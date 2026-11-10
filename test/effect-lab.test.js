import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { EffectLab, OBSERVATION_MS } from '../lab/experiment.js';
import { formatHex } from '../protocol.js';

const effect = 'BC 06 02 00 3A 55';
const slowest = 'BC 08 01 00 55';
const red = 'BC 04 06 00 00 03 E8 00 00 55';

function fixture(write = () => {}) {
  const events = [];
  const writes = [];
  const device = new EventTarget();
  const characteristic = {
    properties: { writeWithoutResponse: true },
    async writeValueWithoutResponse(bytes) {
      writes.push(formatHex(bytes));
      return write(writes.length);
    },
  };
  const gatt = device.gatt = {
    connected: false,
    async connect() {
      gatt.connected = true;
      return gatt;
    },
    async getPrimaryService(uuid) {
      assert.equal(uuid, 0xfff0);
      return {
        async getCharacteristic(characteristicUuid) {
          if (characteristicUuid === 0xfff3) return characteristic;
          throw new Error('No notify characteristic');
        },
      };
    },
    disconnect() {
      gatt.connected = false;
      device.dispatchEvent(new Event('gattserverdisconnected'));
    },
  };
  const lab = new EffectLab({
    async requestDevice(options) {
      assert.deepEqual(options, { filters: [{ name: 'GATT--DEMO' }], optionalServices: [0xfff0] });
      return device;
    },
  }, (event) => events.push(event));
  return { lab, writes, events, gatt };
}

function states(events) {
  return events.filter(({ type }) => type === 'run').map(({ state }) => state);
}

test('connect has no writes, restore sends only known red even on a fresh session', async () => {
  const { lab, writes, events } = fixture();
  await lab.tryEffect();
  await lab.restore();
  await lab.connect();
  assert.deepEqual(writes, []);
  assert.equal(lab.canRestore, true);
  await lab.restore();
  assert.deepEqual(writes, [red]);
  assert.deepEqual(states(events), ['sending', 'restored']);
});

test('one Try sends two ordered frames and starts one 30-second observation', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { lab, writes, events } = fixture();
  await lab.connect();
  await Promise.all([lab.tryEffect(), lab.tryEffect(), lab.restore()]);
  assert.deepEqual(writes, [effect, slowest]);
  assert.deepEqual(events.filter(({ phase }) => phase === 'writing').map(({ bytes }) => formatHex(bytes)), writes);
  assert.deepEqual(events.filter(({ type }) => type === 'write').map(({ bytes }) => formatHex(bytes)), writes);
  assert.equal(lab.canTry, false);
  assert.equal(lab.canRestore, true);
  t.mock.timers.tick(OBSERVATION_MS - 1);
  assert.deepEqual(states(events), ['sending', 'observing']);
  t.mock.timers.tick(1);
  assert.deepEqual(states(events), ['sending', 'observing', 'elapsed']);
  assert.equal(lab.canTry, true);
});

test('restore and disconnect cancel an in-progress observation', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { lab, writes, events, gatt } = fixture();
  await lab.connect();
  await lab.tryEffect();
  await lab.restore();
  assert.deepEqual(writes, [effect, slowest, red]);
  await lab.tryEffect();
  gatt.disconnect();
  t.mock.timers.tick(OBSERVATION_MS);
  assert.equal(states(events).includes('elapsed'), false);
  assert.equal(states(events).at(-1), 'interrupted');
  assert.equal(lab.canRestore, false);
  await lab.connect();
  assert.equal(lab.canRestore, true);
});

test('failed writes never start observation or retry, and keep restore available', async () => {
  for (const failure of [1, 2]) {
    const { lab, writes, events } = fixture((number) => {
      if (number === failure) throw new Error('Write rejected');
    });
    await lab.connect();
    await lab.tryEffect();
    assert.deepEqual(writes, [effect, slowest].slice(0, failure));
    assert.deepEqual(events.at(-1), { type: 'run', state: 'failed', completed: failure - 1 });
    assert.equal(lab.canRestore, true);
    await lab.restore();
    assert.equal(writes.at(-1), red);
  }
});

test('disconnect between writes stops the sequence and ignores old completion after reconnect', async () => {
  let finish;
  const { lab, writes, events, gatt } = fixture(() => new Promise((resolve) => { finish = resolve; }));
  await lab.connect();
  const pending = lab.tryEffect();
  assert.deepEqual(writes, [effect]);
  gatt.disconnect();
  assert.equal(states(events).at(-1), 'interrupted');
  await lab.connect();
  finish();
  await pending;
  assert.deepEqual(writes, [effect]);
  assert.deepEqual(states(events), ['sending', 'interrupted']);
  assert.equal(lab.canRestore, true);
});
