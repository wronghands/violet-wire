import assert from 'node:assert/strict';
import test from 'node:test';
import { createFavorites, FAVORITES_KEY, MAX_FAVORITES } from '../favorites.js';

function memoryStorage(initial) {
  const data = new Map(initial);
  return {
    getItem(key) { return data.get(key) ?? null; },
    setItem(key, value) { data.set(key, value); },
  };
}

test('favorites save uppercase swatches, remove them, and restore on reload', () => {
  const storage = memoryStorage();
  const favorites = createFavorites(() => storage);
  assert.deepEqual(favorites.colors, []);
  assert.equal(favorites.add('#ff00ff'), 'stored');
  assert.equal(favorites.add('#FF00FF'), 'unchanged');
  assert.equal(favorites.add('#ff0'), 'unchanged');
  assert.equal(favorites.add('#112233'), 'stored');
  assert.equal(favorites.has('#FF00FF'), true);
  assert.equal(favorites.remove('#ff00ff'), 'stored');
  assert.equal(favorites.remove('#FFFFFF'), 'unchanged');
  assert.deepEqual(createFavorites(() => storage).colors, ['#112233']);
  assert.equal(storage.getItem(FAVORITES_KEY), '["#112233"]');
});

test('favorites restore only valid unique swatches and respect the list limit', () => {
  const inputs = Array.from({ length: MAX_FAVORITES + 2 }, (_, n) => `#00${n.toString(16).padStart(4, '0')}`);
  const storage = memoryStorage([[FAVORITES_KEY, JSON.stringify([null, 'oops', inputs[0], ...inputs])]]);
  const favorites = createFavorites(() => storage);
  assert.deepEqual(favorites.colors, inputs.slice(0, MAX_FAVORITES).map((item) => item.toUpperCase()));
  assert.equal(favorites.add('#FFFFFF'), 'unchanged');
  favorites.remove(inputs[0]);
  assert.equal(favorites.add('#FFFFFF'), 'stored');
});

test('invalid saved data does not break the list or subsequent writes', () => {
  for (const saved of ['invalid JSON', '{"name":"#123456"}']) {
    const storage = memoryStorage([[FAVORITES_KEY, saved]]);
    const favorites = createFavorites(() => storage);
    assert.deepEqual(favorites.colors, []);
    assert.equal(favorites.add('#abcdef'), 'stored');
    assert.deepEqual(createFavorites(() => storage).colors, ['#ABCDEF']);
  }
});

test('denied storage and quota failures keep the list editable for this page', () => {
  const restricted = () => { throw new Error('storage unavailable'); };
  const quota = () => ({
    getItem() { return '["#112233"]'; },
    setItem() { throw new Error('quota exceeded'); },
  });
  for (const getStorage of [restricted, quota]) {
    const favorites = createFavorites(getStorage);
    assert.equal(favorites.add('#000000'), 'session');
    assert.equal(favorites.has('#000000'), true);
    assert.equal(favorites.remove('#000000'), 'session');
    assert.equal(favorites.has('#000000'), false);
  }
});
