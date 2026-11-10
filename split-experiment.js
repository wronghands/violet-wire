import { customColorFrames } from './protocol.js';

export const MIN_PIXELS = 8;
export const MAX_PIXELS = 300;
const ORIGINAL_KEY = 'violet-wire:original-pixels-v1';

export function lengthFrame(count) {
  if (!Number.isInteger(count) || count < MIN_PIXELS || count > MAX_PIXELS) {
    throw new RangeError('PIXELS length must be an integer from 8 to 300');
  }
  return Uint8Array.of(0xBC, 0x03, 0x02, count >> 8, count & 0xff, 0x55);
}

export function validateSplit(original, split) {
  if (!Number.isInteger(original) || original < 9 || original > 300) {
    throw new RangeError('Original PIXELS must be between 9 and 300');
  }
  if (!Number.isInteger(split) || split < 8 || split >= original) {
    throw new RangeError('Split PIXELS must be 8 or higher, but smaller than original');
  }
  return split;
}

export function splitPlan({ original, split, prefix, tail }, mode = 'normal') {
  validateSplit(original, split);
  const a = customColorFrames(prefix).color;
  const b = customColorFrames(tail).color;
  if (mode === 'normal') return { label: 'A önde / B arkada denemesi', frames: [b, lengthFrame(split), a] };
  if (mode === 'reversed') return { label: 'B önde / A arkada denemesi', frames: [a, lengthFrame(split), b] };
  if (mode === 'probe') return { label: 'Tek renk kısaltma kontrolü', frames: [b, lengthFrame(split), b] };
  throw new RangeError('Unknown experimental mode');
}

export function localCountStorage(getStorage) {
  return {
    load() {
      try {
        const n = Number(getStorage().getItem(ORIGINAL_KEY));
        return Number.isInteger(n) && n >= 9 && n <= 300 ? n : null;
      } catch { return null; }
    },
    save(n) {
      if (!Number.isInteger(n) || n < 9 || n > 300) throw new RangeError('Invalid original count');
      getStorage().setItem(ORIGINAL_KEY, String(n));
    },
  };
}
