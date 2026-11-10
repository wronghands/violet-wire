export const DEVICE_NAME = 'GATT--DEMO';
export const SERVICE = 0xfff0;
export const WRITE = 0xfff3;
export const NOTIFY = 0xfff4;

export const HUES = Object.freeze({
  red: 0,
  green: 120,
  blue: 240,
  yellow: 60,
  magenta: 300,
  cyan: 180,
});

export function powerFrame(on) {
  return Uint8Array.of(0xbc, 0x01, 0x01, Number(on), 0x55);
}

export function colorFrame(color) {
  if (!Object.hasOwn(HUES, color)) throw new RangeError('Unknown color');
  const hue = HUES[color];
  return Uint8Array.of(0xbc, 0x04, 0x06, hue >> 8, hue & 0xff, 0x03, 0xe8, 0, 0, 0x55);
}

export function brightnessFrame(value) {
  if (!Number.isInteger(value) || value < 0 || value > 1000) {
    throw new RangeError('Brightness must be an integer from 0 to 1000');
  }
  return Uint8Array.of(0xbc, 0x05, 0x06, value >> 8, value & 0xff, 0, 0, 0, 0, 0x55);
}

export function parseRawFrame(input) {
  if (!/^(?:[\da-f]{2})(?:\s*[\da-f]{2})*$/i.test(input.trim())) {
    throw new Error('Her bayt iki HEX karakterinden oluşmalı.');
  }
  const compact = input.replace(/\s/g, '');
  if (compact.length < 8 || compact.length > 40) {
    throw new Error('Çerçeve 4–20 bayt olmalı.');
  }
  const bytes = Uint8Array.from(compact.match(/.{2}/g), (pair) => Number.parseInt(pair, 16));
  if (bytes[0] !== 0xbc || bytes.at(-1) !== 0x55 || bytes[2] !== bytes.length - 4) {
    throw new Error('BC ile başlayıp 55 ile biten tek bir çerçeve gir. Üçüncü bayt yük uzunluğuyla eşleşmeli.');
  }
  return bytes;
}

export function formatHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}
