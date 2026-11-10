import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { VioletBluetooth } from '../ble.js';
import { colorFrame, customColorFrames, powerFrame } from '../protocol.js';

function fixture({ mode = 'without-response', notify = true, requestError, serviceError, write } = {}) {
  const events = [];
  const writes = [];
  const notifications = Object.assign(new EventTarget(), {
    properties: { notify: true },
    async startNotifications() {},
  });
  const characteristic = {
    properties: { writeWithoutResponse: mode === 'without-response', write: mode !== 'unsupported' },
    async writeValueWithoutResponse(bytes) {
      writes.push({ bytes, mode: 'without-response' });
      return write?.();
    },
    async writeValueWithResponse(bytes) {
      writes.push({ bytes, mode: 'with-response' });
      return write?.();
    },
  };
  const device = new EventTarget();
  const gatt = device.gatt = {
    connected: false,
    async connect() {
      gatt.connected = true;
      return gatt;
    },
    async getPrimaryService(uuid) {
      assert.equal(uuid, 0xfff0);
      if (serviceError) throw serviceError;
      return {
        async getCharacteristic(characteristicUuid) {
          if (characteristicUuid === 0xfff3) return characteristic;
          assert.equal(characteristicUuid, 0xfff4);
          if (!notify) throw new Error('No FFF4');
          return notifications;
        },
      };
    },
    disconnect() {
      gatt.connected = false;
      device.dispatchEvent(new Event('gattserverdisconnected'));
    },
  };
  const controller = new VioletBluetooth({
    async requestDevice(options) {
      assert.deepEqual(options, { filters: [{ name: 'GATT--DEMO' }], optionalServices: [0xfff0] });
      if (requestError) throw requestError;
      return device;
    },
  }, (event) => events.push(event));
  return { controller, gatt, notifications, events, writes };
}

test('connect and disconnect do not write commands, reconnect can send', async () => {
  const { controller, gatt, events, writes } = fixture();
  for (let cycle = 0; cycle < 3; cycle++) {
    await controller.connect();
    assert.equal(controller.phase, 'ready');
    assert.equal(events.at(-1).notifications, true);
    assert.equal(writes.length, cycle);
    await controller.send(colorFrame('red'));
    assert.deepEqual(writes.at(-1), { bytes: colorFrame('red'), mode: 'without-response' });
    controller.disconnect();
    assert.equal(gatt.connected, false);
    assert.equal(events.at(-1).reason, 'manual');
    await controller.send(powerFrame(false));
    assert.equal(writes.length, cycle + 1);
  }
});

test('missing notification channel keeps controls usable with write-with-response', async () => {
  const { controller, events, writes } = fixture({ notify: false, mode: 'with-response' });
  await controller.connect();
  assert.equal(events.at(-1).notifications, false);
  await controller.send(powerFrame(true));
  assert.equal(writes[0].mode, 'with-response');
});

test('notification log reads only the DataView range and stops after disconnect', async () => {
  const { controller, notifications, events } = fixture();
  await controller.connect();
  notifications.value = new DataView(Uint8Array.of(0, 0x12, 0x34, 0).buffer, 1, 2);
  notifications.dispatchEvent(new Event('characteristicvaluechanged'));
  assert.deepEqual(events.at(-1), { type: 'notify', bytes: Uint8Array.of(0x12, 0x34) });
  controller.disconnect();
  const eventCount = events.length;
  notifications.dispatchEvent(new Event('characteristicvaluechanged'));
  assert.equal(events.length, eventCount);
});

test('chooser cancellation and missing or unwritable service leave the app idle', async () => {
  const scenarios = [
    [{ requestError: new DOMException('Cancelled', 'NotFoundError') }, 'chooser'],
    [{ serviceError: new Error('No FFF0') }, 'service'],
    [{ mode: 'unsupported' }, 'write'],
  ];
  for (const [options, stage] of scenarios) {
    const { controller, gatt, events, writes } = fixture(options);
    await controller.connect();
    assert.equal(controller.phase, 'idle');
    assert.equal(events.at(-1).stage, stage);
    assert.equal(events.at(-1).reason, 'error');
    assert.equal(gatt.connected, false);
    assert.equal(writes.length, 0);
  }
});

test('busy writes do not queue and old completions cannot touch the reconnected UI', async () => {
  let finish;
  const { controller, gatt, events, writes } = fixture({ write: () => new Promise((resolve) => { finish = resolve; }) });
  await controller.connect();
  const pending = controller.send(colorFrame('red'));
  assert.equal(controller.phase, 'writing');
  await controller.send(colorFrame('blue'));
  assert.equal(writes.length, 1);
  gatt.disconnect();
  assert.equal(events.at(-1).reason, 'lost');
  await controller.connect();
  const eventCount = events.length;
  finish();
  await pending;
  assert.equal(events.length, eventCount);
  assert.equal(controller.phase, 'ready');
});

test('a rejected write is reported and controls recover if still connected', async () => {
  const error = new Error('Rejected');
  const { controller, events } = fixture({ write: () => Promise.reject(error) });
  await controller.connect();
  const bytes = powerFrame(true);
  await controller.send(bytes);
  assert.equal(controller.phase, 'ready');
  assert.deepEqual(events.at(-1), { type: 'write', bytes, error });
});

function pendingWriteFixture() {
  const finish = [];
  const result = fixture({ write: () => new Promise((resolve) => finish.push(resolve)) });
  return { ...result, finish };
}

test('custom color and brightness are separate ordered writes with a continuous busy phase', async () => {
  const { controller, events, writes, finish } = pendingWriteFixture();
  const { color, brightness } = customColorFrames('#804020');
  assert.equal(await controller.sendSequence([color, brightness]), undefined);
  assert.equal(writes.length, 0);

  await controller.connect();
  events.length = 0;
  const pending = controller.sendSequence([color, brightness]);
  assert.equal(controller.phase, 'writing');
  assert.deepEqual(writes.map(({ bytes }) => bytes), [color]);
  await controller.send(powerFrame(false));
  assert.equal(await controller.sendSequence([color, brightness]), undefined);
  assert.equal(writes.length, 1);

  finish[0]();
  await new Promise(setImmediate);
  assert.equal(controller.phase, 'writing');
  assert.deepEqual(writes.map(({ bytes }) => bytes), [color, brightness]);
  assert.equal(events.some(({ phase }) => phase === 'ready'), false);

  finish[1]();
  assert.deepEqual(await pending, { completed: 2 });
  assert.deepEqual(events.filter(({ type }) => type === 'write'), [
    { type: 'write', bytes: color, index: 0, total: 2, error: undefined },
    { type: 'write', bytes: brightness, index: 1, total: 2, error: undefined },
  ]);
  assert.equal(events.at(-1).phase, 'ready');
});

test('a failed custom write stops the sequence and reports how many writes completed', async () => {
  const { color, brightness } = customColorFrames('#804020');
  const frames = [color, brightness];
  for (const failureIndex of [0, 1]) {
    const error = new Error(`Rejected frame ${failureIndex}`);
    let attempt = 0;
    const { controller, events, writes } = fixture({
      write: () => (attempt++ === failureIndex ? Promise.reject(error) : Promise.resolve()),
    });
    await controller.connect();
    assert.deepEqual(await controller.sendSequence(frames), { completed: failureIndex, error });
    assert.deepEqual(writes.map(({ bytes }) => bytes), frames.slice(0, failureIndex + 1));
    assert.deepEqual(events.filter(({ type }) => type === 'write').at(-1), {
      type: 'write', bytes: frames[failureIndex], index: failureIndex, total: 2, error,
    });
    assert.equal(controller.phase, 'ready');
  }
});

test('disconnect during either custom write suppresses late state and stops old frames after reconnect', async () => {
  const { color, brightness } = customColorFrames('#804020');
  for (const interruptedIndex of [0, 1]) {
    const { controller, gatt, events, writes, finish } = pendingWriteFixture();
    await controller.connect();
    const pending = controller.sendSequence([color, brightness]);
    if (interruptedIndex === 1) {
      finish[0]();
      await new Promise(setImmediate);
    }

    gatt.disconnect();
    assert.equal(events.at(-1).reason, 'lost');
    await controller.connect();
    const eventCount = events.length;
    finish[interruptedIndex]();
    assert.equal(await pending, undefined);
    assert.equal(events.length, eventCount);
    assert.equal(writes.length, interruptedIndex + 1);
    assert.equal(controller.phase, 'ready');
  }
});
