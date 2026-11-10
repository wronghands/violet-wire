import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { RUN_MS, SpeedContrast } from '../lab-speed/experiment.js';
import { formatHex } from '../protocol.js';

const preset = 'BC 06 02 00 3A 55';
const minimum = 'BC 08 01 00 55';
const maximum = 'BC 08 01 64 55';
const red = 'BC 04 06 00 00 03 E8 00 00 55';

function fixture(write = () => {}) {
  const device = new EventTarget();
  const writes = [];
  const events = [];
  device.gatt = {
    connected: false,
    async connect() { this.connected = true; return this; },
    disconnect() { this.connected = false; device.dispatchEvent(new Event('gattserverdisconnected')); },
    async getPrimaryService() {
      return {
        async getCharacteristic(id) {
          if (id !== 0xfff3) throw new Error('Optional FFF4 absent');
          return {
            properties: { writeWithoutResponse: true },
            async writeValueWithoutResponse(bytes) {
              writes.push(formatHex(bytes));
              return write(writes.length);
            },
          };
        },
      };
    },
  };
  const lab = new SpeedContrast({ async requestDevice() { return device; } }, (event) => events.push(event));
  return { lab, device, writes, events };
}

test('connection sends no light command and values other than 0 or 100 are rejected', async () => {
  const { lab, writes } = fixture();
  await lab.start(0);
  await lab.connect();
  for (const invalid of [1, 50, 101, -1, '100', undefined]) await lab.start(invalid);
  assert.deepEqual(writes, []);
  await lab.restore();
  assert.deepEqual(writes, [red]);
});

test('comparison writes each speed once, keeping the same preset loaded', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { lab, writes, events } = fixture();
  await lab.connect();
  await Promise.all([lab.start(0), lab.start(100), lab.restore()]);
  assert.deepEqual(writes, [preset, minimum]);
  assert.equal(lab.canRun, false);
  assert.equal(lab.canRestore, true);
  t.mock.timers.tick(RUN_MS - 1);
  assert.equal(events.at(-1).state, 'observing');
  t.mock.timers.tick(1);
  assert.deepEqual(events.at(-1), { type: 'run', state: 'elapsed', speed: 0 });
  await lab.start(100);
  assert.deepEqual(writes, [preset, minimum, maximum]);
  t.mock.timers.tick(RUN_MS);
  assert.deepEqual(events.at(-1), { type: 'run', state: 'elapsed', speed: 100 });
  await lab.start(0);
  assert.deepEqual(writes, [preset, minimum, maximum, minimum]);
  assert.deepEqual(events.filter(({ type }) => type === 'write').map(({ bytes }) => formatHex(bytes)), writes);
});

test('restore cancels the timer and the next run loads the preset again', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { lab, writes, events } = fixture();
  await lab.connect();
  await lab.start(100);
  await lab.restore();
  t.mock.timers.tick(RUN_MS);
  assert.equal(events.at(-1).state, 'restored');
  await lab.start(0);
  assert.deepEqual(writes, [preset, maximum, red, preset, minimum]);
});

test('failure stops the sequence and leaves a solid-red return available', async () => {
  for (const failed of [1, 2]) {
    const { lab, writes, events } = fixture((index) => {
      if (index === failed) throw new Error('Browser write failed');
    });
    await lab.connect();
    await lab.start(0);
    assert.deepEqual(writes, [preset, minimum].slice(0, failed));
    assert.deepEqual(events.at(-1), { type: 'run', state: 'failed', completed: failed - 1 });
    assert.equal(lab.canRestore, true);
    await lab.restore();
    assert.equal(writes.at(-1), red);
  }
});

test('a disconnected operation cannot send a pending speed or finish an observation after reconnect', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let release;
  const { lab, device, writes, events } = fixture((index) => {
    if (index === 1) return new Promise((resolve) => { release = resolve; });
  });
  await lab.connect();
  const pending = lab.start(0);
  device.gatt.disconnect();
  await lab.connect();
  release();
  await pending;
  assert.deepEqual(writes, [preset]);
  await lab.start(100);
  device.gatt.disconnect();
  t.mock.timers.tick(RUN_MS);
  assert.deepEqual(writes, [preset, preset, maximum]);
  assert.equal(events.some(({ state }) => state === 'elapsed'), false);
});

test('the standalone lab is English and presents custom addressing as unverified', () => {
  const page = readFileSync(new URL('../lab-speed/index.html', import.meta.url), 'utf8');
  const script = readFileSync(new URL('../lab-speed/speed.js', import.meta.url), 'utf8');
  assert.match(page, /<html lang="en">/);
  assert.match(page, /independent color or pixel writes is still unverified/);
  assert.doesNotMatch(page + script, /[çğıöşüİÇĞÖŞÜ]|type="color"|lang="tr"/);
});
