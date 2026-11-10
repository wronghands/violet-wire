import { normalizeRgbHex } from './protocol.js';

export const FAVORITES_KEY = 'violet-wire.favorites';
export const MAX_FAVORITES = 12;

export function createFavorites(getStorage) {
  let storage;
  const colors = new Set();
  try {
    storage = getStorage();
    const saved = JSON.parse(storage.getItem(FAVORITES_KEY));
    if (Array.isArray(saved)) {
      for (const item of saved) {
        const color = typeof item === 'string' ? normalizeRgbHex(item) : null;
        if (color) colors.add(color);
        if (colors.size === MAX_FAVORITES) break;
      }
    }
  } catch {
    // Restricted storage or an invalid saved value should leave an editable list.
  }

  function persist() {
    try {
      storage.setItem(FAVORITES_KEY, JSON.stringify([...colors]));
      return 'stored';
    } catch {
      return 'session';
    }
  }

  return {
    get colors() { return [...colors]; },
    has(color) { return colors.has(color); },
    add(input) {
      const color = normalizeRgbHex(input);
      if (!color || colors.has(color) || colors.size === MAX_FAVORITES) return 'unchanged';
      colors.add(color);
      return persist();
    },
    remove(input) {
      if (!colors.delete(normalizeRgbHex(input))) return 'unchanged';
      return persist();
    },
  };
}
