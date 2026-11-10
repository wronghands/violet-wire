import { VioletBluetooth } from './ble.js';
import { brightnessFrame, colorFrame, formatHex, parseRawFrame, powerFrame } from './protocol.js';

const byId = (id) => document.getElementById(id);
const connect = byId('connect');
const disconnect = byId('disconnect');
const connection = byId('connection');
const activity = byId('activity');
const channel = byId('channel');
const commands = byId('commands');
const brightness = byId('brightness');
const brightnessValue = byId('brightness-value');
const raw = byId('raw');
const preview = byId('raw-preview');
const sendRaw = byId('send-raw');
const log = byId('log');
const defaultChannel = channel.textContent;
const defaultActivity = activity.textContent;
const supported = window.isSecureContext && Boolean(navigator.bluetooth);
const bluetooth = new VioletBluetooth(navigator.bluetooth, showEvent);

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

function showEvent(event) {
  if (event.type === 'notify') {
    addLog(`FFF4 bildirim · ${formatHex(event.bytes)}`);
    return;
  }
  if (event.type === 'write') {
    const result = event.error ? 'Yazma başarısız. Bağlantıyı kontrol edip tekrar dene.' : 'Tarayıcı yazmayı tamamladı. LED tepkisini gözle kontrol et.';
    activity.textContent = result;
    addLog(`${event.error ? 'Yazma hatası' : 'FFF3 yazıldı'} · ${formatHex(event.bytes)}`);
    return;
  }

  const { phase } = event;
  const connected = phase === 'ready' || phase === 'writing';
  connect.disabled = !supported || phase !== 'idle';
  disconnect.disabled = !connected;
  commands.disabled = phase !== 'ready';
  updateRaw();

  if (phase === 'idle') {
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
  } else if (phase === 'writing') {
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
brightness.addEventListener('input', () => {
  const percent = Number(brightness.value) / 10;
  brightnessValue.value = `${percent}%`;
  brightness.setAttribute('aria-valuetext', `Yüzde ${percent}`);
});
byId('apply-brightness').addEventListener('click', () => bluetooth.send(brightnessFrame(Number(brightness.value))));

raw.addEventListener('input', updateRaw);
sendRaw.addEventListener('click', () => {
  if (bluetooth.phase !== 'ready') return;
  const bytes = parseRawFrame(raw.value);
  if (window.confirm(`Bu deneysel çerçeve bir kez gönderilecek.\n\n${formatHex(bytes)}\n\nGöndermek istiyor musun?`)) bluetooth.send(bytes);
});
