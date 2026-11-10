import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { brightnessFrame, colorFrame, formatHex, parseRawFrame, powerFrame } from '../protocol.js';

test('red matches the frame reported working on the target LED', () => {
  assert.equal(formatHex(colorFrame('red')), 'BC 04 06 00 00 03 E8 00 00 55');
});

test('other presets encode hue as a big-endian degree value', () => {
  const hues = { green: '00 78', blue: '00 F0', yellow: '00 3C', magenta: '01 2C', cyan: '00 B4' };
  for (const [color, hue] of Object.entries(hues)) {
    assert.equal(formatHex(colorFrame(color)), `BC 04 06 ${hue} 03 E8 00 00 55`);
  }
  assert.throws(() => colorFrame('pink'), RangeError);
});

test('power uses one payload byte', () => {
  assert.equal(formatHex(powerFrame(true)), 'BC 01 01 01 55');
  assert.equal(formatHex(powerFrame(false)), 'BC 01 01 00 55');
});

test('brightness validates integer bounds and encodes both bytes', () => {
  assert.equal(formatHex(brightnessFrame(0)), 'BC 05 06 00 00 00 00 00 00 55');
  assert.equal(formatHex(brightnessFrame(500)), 'BC 05 06 01 F4 00 00 00 00 55');
  assert.equal(formatHex(brightnessFrame(1000)), 'BC 05 06 03 E8 00 00 00 00 55');
  for (const value of [-1, 1001, 0.5, NaN, '500']) {
    assert.throws(() => brightnessFrame(value), RangeError);
  }
});

test('raw replay accepts one complete frame up to 20 bytes', () => {
  assert.deepEqual(parseRawFrame(' bc0406 00 00\n03\tE8 00 00 55 '), colorFrame('red'));
  assert.equal(parseRawFrame('BC 01 00 55').length, 4);
  assert.equal(parseRawFrame(`BC 01 10 ${'00 '.repeat(16)}55`).length, 20);
});

test('raw replay rejects malformed, truncated, and oversized input', () => {
  for (const frame of [
    '', 'BC 01 0G 55', 'BC0100550', 'B C 01 00 55', 'BC 01 55', '0xbc 01 00 55',
    'BD 01 00 55', 'BC 01 00 54', 'BC 01 01 55', 'BC 01 00 55 BC 01 00 55',
    `BC 01 11 ${'00 '.repeat(17)}55`,
  ]) {
    assert.throws(() => parseRawFrame(frame), Error, frame);
  }
});
