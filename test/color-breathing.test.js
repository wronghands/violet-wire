import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { BreathingPlayer, FRAME_GAP_MS, REFRESH_MS, prepareEffect, sampleEffect } from '../breathing/player.js';
import { customColorFrames } from '../protocol.js';

const settings = { colorA: '#8029C9', colorB: '#D3214F', durationMs: 18_000, brightness: 550, breathing: true };
const level = (frame) => frame[3] * 256 + frame[4];

function fakePlayer(t, write = () => ({ completed: 1 })) {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'] });
  const events = [];
  const frames = [];
  const player = new BreathingPlayer((bytes) => {
    frames.push({ at: Date.now(), bytes });
    return write(frames.length, bytes);
  }, (event) => events.push(event), () => Date.now());
  const advance = async (ms = FRAME_GAP_MS) => {
    t.mock.timers.tick(ms);
    await Promise.resolve();
  };
  return { player, frames, events, advance };
}

test('the effect reaches A, B, and A using the verified global color encoding', () => {
  const effect = prepareEffect(settings);
  assert.deepEqual(sampleEffect(effect, 0).color, customColorFrames(settings.colorA).color);
  assert.deepEqual(sampleEffect(effect, settings.durationMs / 2).color, customColorFrames(settings.colorB).color);
  assert.deepEqual(sampleEffect(effect, settings.durationMs).color, sampleEffect(effect, 0).color);
  assert.notDeepEqual(sampleEffect(effect, settings.durationMs / 4).color, sampleEffect(effect, 0).color);
  for (const input of [{ colorA: '#abc' }, { durationMs: 5999 }, { brightness: 149 }]) {
    assert.throws(() => prepareEffect({ ...settings, ...input }), RangeError);
  }
});

test('gentle breathing dips during transitions, with a positive brightness floor', () => {
  const steady = prepareEffect({ ...settings, colorA: '#FFFFFF', colorB: '#FFFFFF', breathing: false });
  const pulse = prepareEffect({ ...settings, colorA: '#FFFFFF', colorB: '#FFFFFF' });
  assert.equal(level(sampleEffect(steady, 4500).brightness), 550);
  assert.equal(level(sampleEffect(pulse, 4500).brightness), 429);
  assert.equal(level(sampleEffect(pulse, 9000).brightness), 550);
  const dark = prepareEffect({ ...settings, colorA: '#000000', colorB: '#000000', brightness: 150 });
  assert.equal(level(sampleEffect(dark, 4500).brightness), 120);
});

test('one in-flight write, no catch-up, fresh color sampled after a slow write', async (t) => {
  let resolve;
  const { player, frames, advance } = fakePlayer(t, (index) => index === 1
    ? new Promise((done) => { resolve = done; }) : { completed: 1 });
  assert.equal(player.start(settings), true);
  assert.equal(player.start(settings), false);
  await advance(9000 - FRAME_GAP_MS);
  assert.equal(frames.length, 1);
  assert.equal(frames[0].bytes[1], 0x05);
  resolve({ completed: 1 });
  await Promise.resolve();
  await advance(FRAME_GAP_MS - 1);
  assert.equal(frames.length, 1);
  await advance(1);
  assert.equal(frames.length, 2);
  assert.deepEqual(frames[1].bytes, customColorFrames(settings.colorB).color);
  player.stop();
});

test('steady writes are deduplicated and refreshed for silent misses', async (t) => {
  const { player, frames, advance } = fakePlayer(t);
  player.start({ ...settings, colorA: '#FFFFFF', colorB: '#FFFFFF', breathing: false });
  await Promise.resolve();
  for (let i = 1; i < REFRESH_MS / FRAME_GAP_MS; i++) await advance();
  assert.deepEqual(frames.map(({ bytes }) => bytes[1]), [0x05, 0x04]);
  await advance();
  await advance();
  assert.deepEqual(frames.map(({ at }) => at), [0, FRAME_GAP_MS, REFRESH_MS, REFRESH_MS + FRAME_GAP_MS]);
  assert.deepEqual(frames[2].bytes, frames[0].bytes);
  assert.deepEqual(frames[3].bytes, frames[1].bytes);
  player.stop();
});

test('Stop and backgrounding drain one write and keep the restart gap', async (t) => {
  let resolve;
  const { player, frames, events, advance } = fakePlayer(t, (index) => index === 1
    ? new Promise((done) => { resolve = done; }) : { completed: 1 });
  player.start(settings);
  player.stop('background');
  assert.equal(player.active, false);
  assert.equal(player.busy, true);
  assert.equal(player.start(settings), false);
  await advance(5000);
  resolve({ completed: 1 });
  await Promise.resolve();
  assert.deepEqual(events, [{ state: 'running' }, { state: 'stopped', reason: 'background' }, { state: 'settled' }]);
  assert.equal(frames.length, 1);
  player.start(settings);
  await advance(FRAME_GAP_MS - 1);
  assert.equal(frames.length, 1);
  await advance(1);
  assert.equal(frames.length, 2);
  player.stop();
  await advance(5000);
  assert.equal(frames.length, 2);
});

test('disconnect invalidates the old write without continuing on reconnect', async (t) => {
  let release;
  const { player, frames, events, advance } = fakePlayer(t, (index) => index === 1
    ? new Promise((done) => { release = done; }) : { completed: 1 });
  player.start(settings);
  player.disconnect();
  assert.equal(player.busy, false);
  await advance(5000);
  release({ completed: 1 });
  await Promise.resolve();
  assert.deepEqual(events, [{ state: 'running' }, { state: 'stopped', reason: 'disconnect' }]);
  assert.equal(frames.length, 1);
  player.start(settings);
  assert.equal(frames.length, 2);
  player.stop();
});

test('a failed write can recover, but success on one channel cannot mask repeated failures on the other', async (t) => {
  const { player, frames, events, advance } = fakePlayer(t, (index, bytes) => {
    const rejected = index === 1 || (index > 3 && bytes[1] === 0x04);
    return rejected ? { completed: 0, error: new Error('write rejected') } : { completed: 1 };
  });
  player.start({ ...settings, durationMs: 6000 });
  await Promise.resolve();
  for (let i = 0; i < 12; i++) await advance();
  assert.deepEqual(events.map(({ state }) => state), ['running', 'retrying', 'resumed', 'retrying', 'stopped']);
  assert.equal(events.at(-1).reason, 'write-errors');
  assert.equal(frames.slice(3).filter(({ bytes }) => bytes[1] === 0x04).length, 3);
  assert.equal(player.active, false);
});
