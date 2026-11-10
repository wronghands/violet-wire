import { VioletBluetooth } from './ble.js';
import { hsvToRgbHex } from './color-editor.js';
import { lengthFrame, splitPlan, validateSplit, localCountStorage } from './split-experiment.js';
import { createFavorites, MAX_FAVORITES } from './favorites.js';
import { brightnessFrame, colorFrame, customColorFrames, formatHex, normalizeRgbHex, parseRawFrame, powerFrame, rgbHexToHsv } from './protocol.js';

const byId = (id) => document.getElementById(id);
const connect = byId('connect');
const disconnect = byId('disconnect');
const connection = byId('connection');
const activity = byId('activity');
const channel = byId('channel');
const commands = byId('commands');
const brightness = byId('brightness');
const brightnessValue = byId('brightness-value');
const svSurface = byId('sv-surface');
const hueSlider = byId('hue-slider');
const saturationSlider = byId('saturation-slider');
const valueSlider = byId('value-slider');
const colorHex = byId('color-hex');
const colorError = byId('color-error');
const colorSwatch = byId('color-swatch');
const colorTarget = byId('color-target');
const colorLevel = byId('color-level');
const colorStatus = byId('color-status');
const applyColor = byId('apply-color');
const addFavorite = byId('add-favorite');
const favoritesStatus = byId('favorites-status');
const favoritesList = byId('favorites');
const raw = byId('raw');
const preview = byId('raw-preview');
const sendRaw = byId('send-raw');
const log = byId('log');
const originalCountInput = byId('original-count');
const splitCountInput = byId('split-count');
const countConfirmed = byId('count-confirmed');
const storeCount = byId('store-count');
const restoreCount = byId('restore-count');
const prefixColor = byId('prefix-color');
const tailColor = byId('tail-color');
const trySplit = byId('try-split');
const tryReversed = byId('try-reversed');
const probeLength = byId('probe-length');
const restoreFull = byId('restore-full');
const labStatus = byId('lab-status');
const labCommands = byId('lab-commands');
const defaultChannel = channel.textContent;
const defaultActivity = activity.textContent;
const supported = window.isSecureContext && Boolean(navigator.bluetooth);
const bluetooth = new VioletBluetooth(navigator.bluetooth, showEvent);
const favorites = createFavorites(() => window.localStorage);
const percent = new Intl.NumberFormat('tr-TR', { style: 'percent', maximumFractionDigits: 1 });
let customDraft = null;
let pendingColor = null;
let editorHue = 270;
let editorSaturation = 750;
let editorValue = 920;
let activePointerId = null;
const originalStorage = localCountStorage(() => window.localStorage);
let verifiedOriginal = originalStorage.load();

function connectionError(error, stage) {
  if (stage === 'chooser') {
    if (error?.name === 'NotFoundError') return 'Cihaz seçilmedi. Tekrar bağlanmayı deneyebilirsin.';
    if (error?.name === 'SecurityError' || error?.name === 'NotAllowedError') {
      return 'Bluetooth erişimi kapalı. Chrome ve Android Yakındaki Cihazlar izinlerini kontrol et.';
    }
    return 'Cihaz seçici açılamadı. Android Bluetooth’u ve Chrome izinlerini kontrol et.';
  }
  if (stage === 'service') return 'FFF0 servisi açılamadı. Doğru kontrolcüyü seçtiğini kontrol et.';
  if (stage === 'write') return 'Yazılabilir FFF3 kanalı açılamadı.';
  return 'Bağlantı kurulamadı. Kontrolcüye bağlı diğer uygulamaları ayırıp tekrar dene.';
}

function addLog(message) {
  const item = document.createElement('li');
  item.textContent = message;
  log.prepend(item);
  if (log.children.length > 24) log.lastElementChild.remove();
}

function setBrightness(level) {
  brightness.value = level;
  brightnessValue.value = percent.format(level / 1000);
  brightness.setAttribute('aria-valuetext', brightnessValue.value);
}

function updateColorButtons() {
  applyColor.disabled = !customDraft || bluetooth.phase !== 'ready';
  addFavorite.disabled = !customDraft || favorites.has(customDraft) || favorites.colors.length >= MAX_FAVORITES;
}

function renderColorEditor() {
  hueSlider.value = String(editorHue);
  saturationSlider.value = String(editorSaturation);
  valueSlider.value = String(editorValue);
  const hueText = `${editorHue}°`;
  hueSlider.setAttribute('aria-valuetext', hueText);
  saturationSlider.setAttribute('aria-valuetext', `${(editorSaturation / 10).toFixed(1)}%`);
  valueSlider.setAttribute('aria-valuetext', `${(editorValue / 10).toFixed(1)}%`);
  svSurface.style.setProperty('--editor-hue', `${editorHue}deg`);
  svSurface.style.setProperty('--sat', `${editorSaturation / 10}%`);
  svSurface.style.setProperty('--val-top', `${100 - editorValue / 10}%`);
}

function updateCustomDraft(syncEditor = true) {
  customDraft = normalizeRgbHex(colorHex.value);
  colorHex.setAttribute('aria-invalid', String(!customDraft));
  colorError.textContent = customDraft ? '' : '# işaretini ve ardından altı HEX karakteri gir. Örnek #7C3AED.';
  if (customDraft) {
    if (syncEditor === true || (syncEditor && typeof syncEditor === 'object')) {
      const hsv = rgbHexToHsv(customDraft);
      if (hsv.saturation > 0 && hsv.value > 0) editorHue = hsv.hue;
      editorSaturation = hsv.saturation;
      editorValue = hsv.value;
    }
    renderColorEditor();
    colorSwatch.style.setProperty('--swatch', customDraft);
    colorTarget.textContent = customDraft;
    colorLevel.textContent = `Hedef parlaklık ${percent.format(rgbHexToHsv(customDraft).value / 1000)}`;
  } else {
    colorSwatch.style.removeProperty('--swatch');
    colorTarget.textContent = 'Geçersiz renk';
    colorLevel.textContent = 'Önizleme yok';
  }
  updateColorButtons();
  for (const button of favoritesList.querySelectorAll('[data-favorite]')) {
    button.setAttribute('aria-pressed', String(button.dataset.favorite === customDraft));
  }
}

function stageColor(color, fromEditor = false) {
  colorHex.value = color.toUpperCase();
  updateCustomDraft(!fromEditor);
}

function stageEditorColor() {
  stageColor(hsvToRgbHex(editorHue, editorSaturation, editorValue), true);
}

function setColorFromSurface(event) {
  const rect = svSurface.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
  editorSaturation = Math.round(x * 1000);
  editorValue = Math.round((1 - y) * 1000);
  stageEditorColor();
}

function renderFavorites() {
  const items = favorites.colors.map((color) => {
    const item = document.createElement('li');
    const select = document.createElement('button');
    const swatch = document.createElement('span');
    const remove = document.createElement('button');
    select.type = remove.type = 'button';
    select.className = 'favorite-select';
    select.dataset.favorite = color;
    select.setAttribute('aria-pressed', String(color === customDraft));
    swatch.setAttribute('aria-hidden', 'true');
    swatch.style.setProperty('--swatch', color);
    select.append(swatch, color);
    select.addEventListener('click', () => stageColor(color));
    remove.textContent = 'Sil';
    remove.setAttribute('aria-label', `${color} favorisini sil`);
    remove.addEventListener('click', () => {
      const index = favorites.colors.indexOf(color);
      const result = favorites.remove(color);
      renderFavorites();
      const nextItem = favoritesList.children[index] ?? favoritesList.lastElementChild;
      (nextItem?.querySelector('button') ?? (addFavorite.disabled ? colorHex : addFavorite)).focus();
      favoritesStatus.textContent = result === 'stored' ? `${color} favorilerden silindi.` : `${color} bu sayfa oturumunda favorilerden silindi.`;
    });
    item.append(select, remove);
    return item;
  });
  favoritesList.replaceChildren(...items);
  updateColorButtons();
}

function readLabConfig() {
  if (verifiedOriginal === null || !countConfirmed.checked) return null;
  if (Number(originalCountInput.value) !== verifiedOriginal) return null;
  try {
    const split = validateSplit(verifiedOriginal, Number(splitCountInput.value));
    const prefix = normalizeRgbHex(prefixColor.value);
    const tail = normalizeRgbHex(tailColor.value);
    if (!prefix || !tail) return null;
    return { original: verifiedOriginal, split, prefix, tail };
  } catch {
    return null;
  }
}

function refreshLab() {
  const config = readLabConfig();
  const ready = bluetooth.phase === 'ready';
  restoreCount.disabled = !ready || verifiedOriginal === null;
  restoreFull.disabled = !ready || verifiedOriginal === null;
  trySplit.disabled = !ready || !config;
  tryReversed.disabled = !ready || !config;
  probeLength.disabled = !ready || !config;
  labCommands.textContent = config
    ? `Sıra: ${formatHex(customColorFrames(config.tail).color)} → ${formatHex(lengthFrame(config.split))} → ${formatHex(customColorFrames(config.prefix).color)}. Geri yükleme: ${formatHex(lengthFrame(config.original))}`
    : 'Orijinal değeri kaydet ve doğrula; test sınırı daha küçük olmalı. Renkler geçerli #RRGGBB olmalı.';
}

async function sendLabPlan(label, frames) {
  if (bluetooth.phase !== 'ready') return;
  labStatus.textContent = `${label}: ${frames.length} çerçeve gönderiliyor…`;
  const result = await bluetooth.sendSequence(frames);
  if (!result) {
    labStatus.textContent = 'Bağlantı kesildi veya işlem tamamlanamadı. Orijinal PIXELS sayısını geri yüklemeyi kontrol et.';
  } else if (result.error) {
    labStatus.textContent = `${label}: ${result.completed}/${frames.length} yazım tamamlandı. Geri yüklemeden önce bağlantıyı kontrol et.`;
  } else {
    labStatus.textContent = `${label}: tarayıcı ${result.completed} çerçeveyi gönderdi. LED'de iki sabit renk var mı? 30 saniye gözle, sonra orijinal PIXELS sayısını geri yükle. Bu sonuç donanımda henüz kanıtlanmadı.`;
  }
  refreshLab();
}

function showEvent(event) {
  if (event.type === 'notify') {
    addLog(`FFF4 bildirim · ${formatHex(event.bytes)}`);
    return;
  }
  if (event.type === 'write') {
    addLog(`${event.error ? 'Yazma hatası' : 'FFF3 yazıldı'} · ${formatHex(event.bytes)}`);
    if (event.total === 2) {
      if (!event.error && event.index === 0) return;
      const { hex, value } = pendingColor;
      let result = `Tarayıcı ${hex} için renk ve parlaklık yazımını tamamladı. LED’i gözle kontrol et.`;
      if (!event.error) setBrightness(value);
      else if (event.index === 0) result = `${hex} yazılamadı. Parlaklık paketi gönderilmedi.`;
      else result = `${hex} için renk yazımı tamamlandı. Parlaklık yazılamadı.`;
      pendingColor = null;
      colorStatus.textContent = result;
      return;
    }
    const result = event.error ? 'Yazma başarısız. Bağlantıyı kontrol edip tekrar dene.' : 'Tarayıcı yazmayı tamamladı. LED tepkisini gözle kontrol et.';
    activity.textContent = result;
    return;
  }

  const { phase } = event;
  const connected = phase === 'ready' || phase === 'writing';
  connect.disabled = !supported || phase !== 'idle';
  disconnect.disabled = !connected;
  commands.disabled = phase !== 'ready';
  updateRaw();
  updateColorButtons();
  refreshLab();

  if (phase === 'idle') {
    colorStatus.textContent = pendingColor ? `${pendingColor.hex} işlemi bağlantı kesilince durdu. Şeridin durumunu kontrol et.` : '';
    pendingColor = null;
    const messages = { manual: 'Bağlantı kesildi.', lost: 'Bluetooth bağlantısı koptu. Tekrar bağlanabilirsin.' };
    connection.textContent = event.reason === 'error' ? connectionError(event.error, event.stage) : messages[event.reason];
    activity.textContent = defaultActivity;
    channel.textContent = defaultChannel;
    addLog(connection.textContent);
  } else if (phase === 'choosing') {
    log.replaceChildren();
    connection.textContent = 'Chrome listesinde GATT--DEMO cihazını seç.';
  } else if (phase === 'connecting') {
    connection.textContent = 'Kontrolcüye bağlanılıyor…';
  } else if (phase === 'ready') {
    connection.textContent = 'GATT--DEMO bağlı.';
    const writeMode = event.mode === 'without-response' ? 'WRITE_NO_RESPONSE' : 'WRITE';
    channel.textContent = `FFF3 ${writeMode} · FFF4 bildirim ${event.notifications ? 'etkin' : 'kullanılamıyor'}`;
  } else if (phase === 'writing' && event.total === 1) {
    activity.textContent = `Gönderiliyor · ${formatHex(event.bytes)}`;
  }
}

function updateRaw() {
  sendRaw.disabled = true;
  preview.textContent = '';
  if (!raw.value.trim()) return;
  try {
    preview.textContent = `Gönderilecek baytlar · ${formatHex(parseRawFrame(raw.value))}`;
    sendRaw.disabled = bluetooth.phase !== 'ready';
  } catch (error) {
    preview.textContent = error.message;
  }
}

connect.disabled = !supported;
connection.textContent = supported ? 'Hazır. Kontrolcüye güç ver ve Bağlan’a dokun.' : 'Web Bluetooth burada kullanılamıyor. Sayfayı Android Chrome’da doğrudan HTTPS üzerinden aç.';
connect.addEventListener('click', () => bluetooth.connect());
disconnect.addEventListener('click', () => bluetooth.disconnect());

for (const button of commands.querySelectorAll('[data-power]')) {
  button.addEventListener('click', () => bluetooth.send(powerFrame(button.dataset.power === 'on')));
}
for (const button of commands.querySelectorAll('[data-color]')) {
  button.addEventListener('click', () => bluetooth.send(colorFrame(button.dataset.color)));
}
brightness.addEventListener('input', () => setBrightness(Number(brightness.value)));
byId('apply-brightness').addEventListener('click', () => bluetooth.send(brightnessFrame(Number(brightness.value))));

colorHex.addEventListener('input', updateCustomDraft);
colorHex.addEventListener('blur', () => {
  if (customDraft) colorHex.value = customDraft;
});
hueSlider.addEventListener('input', () => {
  editorHue = Number(hueSlider.value);
  stageEditorColor();
});
saturationSlider.addEventListener('input', () => {
  editorSaturation = Number(saturationSlider.value);
  stageEditorColor();
});
valueSlider.addEventListener('input', () => {
  editorValue = Number(valueSlider.value);
  stageEditorColor();
});
svSurface.addEventListener('pointerdown', (event) => {
  if (activePointerId !== null) return;
  activePointerId = event.pointerId;
  svSurface.setPointerCapture(event.pointerId);
  setColorFromSurface(event);
});
svSurface.addEventListener('pointermove', (event) => {
  if (event.pointerId === activePointerId) setColorFromSurface(event);
});
function finishSurfacePointer(event) {
  if (event.pointerId !== activePointerId) return;
  activePointerId = null;
  if (svSurface.hasPointerCapture(event.pointerId)) svSurface.releasePointerCapture(event.pointerId);
}
svSurface.addEventListener('pointerup', finishSurfacePointer);
svSurface.addEventListener('pointercancel', finishSurfacePointer);
applyColor.addEventListener('click', () => {
  if (!customDraft || bluetooth.phase !== 'ready') return;
  const { color, brightness: levelFrame, value } = customColorFrames(customDraft);
  pendingColor = { hex: customDraft, value };
  colorStatus.textContent = `${customDraft} için renk ve parlaklık yazılıyor…`;
  bluetooth.sendSequence([color, levelFrame]);
});
addFavorite.addEventListener('click', () => {
  const result = favorites.add(customDraft);
  if (result === 'unchanged') return;
  renderFavorites();
  favoritesList.querySelector(`[data-favorite="${customDraft}"]`).focus();
  favoritesStatus.textContent = result === 'stored' ? `${customDraft} favorilere eklendi.` : `${customDraft} bu sayfa oturumunda favorilere eklendi.`;
  if (favorites.colors.length === MAX_FAVORITES) favoritesStatus.textContent += ` ${MAX_FAVORITES} favori sınırına ulaştın.`;
});
updateCustomDraft();
renderFavorites();

raw.addEventListener('input', updateRaw);
sendRaw.addEventListener('click', () => {
  if (bluetooth.phase !== 'ready') return;
  const bytes = parseRawFrame(raw.value);
  if (window.confirm(`Bu deneysel çerçeve bir kez gönderilecek.\n\n${formatHex(bytes)}\n\nGöndermek istiyor musun?`)) bluetooth.send(bytes);
});

function invalidateLabVerification() {
  countConfirmed.checked = false;
  refreshLab();
}
originalCountInput.addEventListener('input', invalidateLabVerification);
splitCountInput.addEventListener('input', refreshLab);
prefixColor.addEventListener('input', refreshLab);
tailColor.addEventListener('input', refreshLab);
countConfirmed.addEventListener('change', refreshLab);
storeCount.addEventListener('click', () => {
  const count = Number(originalCountInput.value);
  if (!countConfirmed.checked || !Number.isInteger(count) || count < 9 || count > 300) {
    labStatus.textContent = 'MR Star’da görülen gerçek orijinal PIXELS sayısını (9–300) girip doğrulamalısın.';
    return;
  }
  try {
    originalStorage.save(count);
    verifiedOriginal = count;
    if (!splitCountInput.value) splitCountInput.value = String(Math.floor(count / 2));
    labStatus.textContent = `Orijinal ${count} piksel yerelde kaydedildi; bağlantı koparsa da aynı tarayıcıdan geri yüklenebilir.`;
  } catch {
    verifiedOriginal = count;
    labStatus.textContent = `Orijinal ${count} piksel yalnız bu oturumda hatırlandı; tarayıcı depolama izni yok.`;
  }
  refreshLab();
});
async function restoreLab({ recolor = false } = {}) {
  if (verifiedOriginal === null) return;
  const frames = recolor ? [lengthFrame(verifiedOriginal), colorFrame('blue')] : [lengthFrame(verifiedOriginal)];
  await sendLabPlan(recolor ? 'Tam şerit restore + mavi' : 'Orijinal uzunluk restore', frames);
}
restoreCount.addEventListener('click', () => restoreLab());
restoreFull.addEventListener('click', () => restoreLab({ recolor: true }));
for (const [button, order] of [[trySplit, 'normal'], [tryReversed, 'reversed'], [probeLength, 'probe']]) {
  button.addEventListener('click', () => {
    const config = readLabConfig();
    if (!config) return;
    const plan = splitPlan(config, order);
    sendLabPlan(plan.label, plan.frames);
  });
}
if (verifiedOriginal !== null) {
  originalCountInput.value = String(verifiedOriginal);
  labStatus.textContent = `Kaydedilmiş orijinal sayı: ${verifiedOriginal}. MR Star'daki PIXELS değerini yeniden doğrulayıp kutuyu işaretle.`;
  splitCountInput.value = String(Math.floor(verifiedOriginal / 2));
}
refreshLab();
