import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  brightnessFrame, colorFrame, customColorFrames, formatHex, normalizeRgbHex, parseRawFrame, powerFrame, rgbHexToHsv,
} from '../protocol.js';

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

test('custom RGB accepts six hex digits and normalizes case and outer whitespace', () => {
  assert.equal(normalizeRgbHex('  #8aCb3e\n'), '#8ACB3E');
  for (const input of ['', '#ABC', '#ABCD', '#ABCDEF00', 'ABCDEF', '#00FFGG', '#AB CDEF', 'BC 01 01 01 55', null, 123456]) {
    assert.equal(normalizeRgbHex(input), null);
    assert.throws(() => customColorFrames(input), RangeError);
  }
});

test('RGB primaries and channel ties produce the existing preset hues and color bytes', () => {
  const presets = {
    red: ['#FF0000', 0],
    green: ['#00FF00', 120],
    blue: ['#0000FF', 240],
    yellow: ['#FFFF00', 60],
    cyan: ['#00FFFF', 180],
    magenta: ['#FF00FF', 300],
  };
  for (const [preset, [hex, hue]] of Object.entries(presets)) {
    assert.deepEqual(rgbHexToHsv(hex), { hue, saturation: 1000, value: 1000 }, hex);
    const frames = customColorFrames(hex);
    assert.deepEqual(frames.color, colorFrame(preset), hex);
    assert.deepEqual(frames.brightness, brightnessFrame(1000), hex);
  }
});

test('custom conversion rounds dim values, handles achromatic colors and wraps rounded red hue', () => {
  const vectors = [
    ['#000000', 0, 0, 0],
    ['#FFFFFF', 0, 0, 1000],
    ['#808080', 0, 0, 502],
    ['#010101', 0, 0, 4],
    ['#000001', 240, 1000, 4],
    ['#804020', 20, 750, 502],
    ['#7F8080', 180, 8, 502],
    ['#FF0003', 359, 1000, 1000],
    ['#FF0001', 0, 1000, 1000],
  ];
  for (const [hex, hue, saturation, value] of vectors) {
    assert.deepEqual(rgbHexToHsv(hex), { hue, saturation, value }, hex);
  }

  const dim = customColorFrames('#804020');
  assert.equal(formatHex(dim.color), 'BC 04 06 00 14 02 EE 00 00 55');
  assert.equal(formatHex(dim.brightness), 'BC 05 06 01 F6 00 00 00 00 55');
  assert.equal(dim.value, 502);

  const black = customColorFrames('#000000');
  assert.equal(formatHex(black.color), 'BC 04 06 00 00 00 00 00 00 55');
  assert.deepEqual(black.brightness, brightnessFrame(0));
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
