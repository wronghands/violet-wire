import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { hsvToRgbHex } from '../color-editor.js';
import { rgbHexToHsv } from '../protocol.js';

test('inline HSV editor reproduces the six primary color targets', () => {
  const colors = [
    [0, '#FF0000'], [60, '#FFFF00'], [120, '#00FF00'],
    [180, '#00FFFF'], [240, '#0000FF'], [300, '#FF00FF'],
  ];
  for (const [h, expected] of colors) assert.equal(hsvToRgbHex(h, 1000, 1000), expected);
});

test('inline HSV editor handles gray, black, white, and dim mixed colors', () => {
  assert.equal(hsvToRgbHex(180, 0, 1000), '#FFFFFF');
  assert.equal(hsvToRgbHex(300, 1000, 0), '#000000');
  assert.equal(hsvToRgbHex(25, 0, 502), '#808080');
  assert.equal(hsvToRgbHex(20, 750, 502), '#804020');
});

test('HEX -> HSV -> HEX stays within channel rounding tolerance', () => {
  for (const color of ['#804020', '#7C3AED', '#1256CD', '#E6A5C8', '#000000', '#FFFFFF']) {
    const hsv = rgbHexToHsv(color);
    const roundTrip = hsvToRgbHex(hsv.hue, hsv.saturation, hsv.value);
    for (let channel = 1; channel < 7; channel += 2) {
      const inputValue = Number.parseInt(color.slice(channel, channel + 2), 16);
      const outputValue = Number.parseInt(roundTrip.slice(channel, channel + 2), 16);
      assert.ok(Math.abs(inputValue - outputValue) <= 2, color + ' => ' + roundTrip);
    }
  }
});

test('malformed HSV input is rejected', () => {
  for (const vector of [[-1,0,0],[360,0,0],[0,-1,0],[0,1001,0],[0,0,1001],[NaN,0,0]]) {
    assert.throws(() => hsvToRgbHex(...vector), RangeError);
  }
});

test('no native eight-swatch intermediary picker is present', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /type=["']color["']/i);
  assert.match(html, /id="sv-surface"/);
  assert.match(html, /id="hue-slider"/);
  assert.match(html, /id="saturation-slider"/);
  assert.match(html, /id="value-slider"/);
});
