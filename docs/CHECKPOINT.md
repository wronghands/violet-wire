# Violet Wire | CANONICAL CHECKPOINT

2026-11-10 · **v0.2.0 inceleme sürümü** · Fiziksel kabul ve yayın onayı bekleniyor.

## Aktif hedef

Android Chrome'da 5 m RGB pixel neon şerit için yerel renk seçici, altı haneli `#RRGGBB` girişi ve yerel favorileri kullanıcı incelemesine sun. v0.1.0 bağlantı, güç, hazır renkler, manuel parlaklık ve tanılama davranışı karşılaştırma noktası. Sonraki araştırma hedefi aynı şeritte aynı anda iki bağımsız sabit bölgeye kırmızı ve mavi atamak. Firmware desteği bilinmiyor ve araştırma bu sürümden ayrı.

## Esas kaynak ve teslim

- [wronghands/violet-wire](https://github.com/wronghands/violet-wire) esas kaynak. v0.2.0 kapsamı [görev #1](https://github.com/wronghands/violet-wire/issues/1). İnceleme dalı ve taslak PR kullanıcı onayına kadar ayrı tutulur.
- Karşılaştırma sürümü v0.1.0, [commit `baacc5b`](https://github.com/wronghands/violet-wire/commit/baacc5b9d9be494dab6d95bcacce1596f2e9b4aa). `main` ve [GitHub Pages HTTPS](https://wronghands.github.io/violet-wire/) inceleme boyunca v0.1.0 sunar.
- Statik uygulama, Node testleri ve belgeler bu bağımsız depoda tutulur. Fiziksel kabul için [QA planı](QA.md), dönüşüm, paketler ve bölge araştırması için [protokol](PROTOCOL.md) kullanılır.

## Doğrulanmış durum ve belirsizlikler

- **KULLANICI BİLGİSİ.** USB sadece güç. Kasa kapalı kalacak. MR Star ve Elkotrol şeridi kontrol edebiliyor. BLE reklam adı `GATT--DEMO`, servis `FFF0`, yazma `FFF3` (`WRITE`/`WRITE_NO_RESPONSE`), bildirim `FFF4`.
- **KULLANICI DONANIM TESTİ.** nRF Connect ile `BC 04 06 00 00 03 E8 00 00 55` yazımı fiziksel şeridi kırmızı yaptı. 10 Kasım 2026'da kullanıcı Android Chrome'daki v0.1.0 ile bağlantının, hazır renklerin ve parlaklığın gerçek şeritte çalıştığını bildirdi. Kullanıcı parlaklık kontrolünü MR Star'dan daha hassas buldu. Bu bir genel kabul raporu. Güç, tek tek renkler, kesinti, ham HEX ve FFF4 için ayrı fiziksel test kaydı yok.
- **KAYNAK.** GlowBridge ve mr-star-ble aynı derece cinsinden renk tonu ve 1000 birimlik doygunluk biçimini, `BC 01` güç paketini ve `BC 05` parlaklık paketini kullanır. Parlaklık ölçekleri 0–1000 ve 0–1024 olarak farklıdır. Violet Wire 0–1000 kullanır.
- **BİLİNMİYOR.** v0.2.0 özel renk uygulamasının ve iki yazımın fiziksel davranışı. FFF4 bildirimlerinin anlamı, firmware sürümü ve sabit bölge veya piksel adresleme desteği. İncelenen kaynaklarda böyle bir komut bulunmadı.

## v0.2.0 uygulama kararları

- Chrome cihaz seçicisi `GATT--DEMO` reklam adını kullanır. `FFF3` yazma yöntemi desteğe göre seçilir. FFF4 bildirimleri tanılama içindir. Erişim isteği Bluetooth ile sınırlı.
- Özel RGB girişi başında `#` olan altı onaltılık basamak. Seçici, metin alanı ve önizleme birlikte çalışır. Önizleme istenen RGB'yi gösterir. Optik doğruluk kabul koşulu değildir.
- HSV renk tonu en yakın dereceye yuvarlanır, 360° sonucu 0° olur. Doygunluk ve değer 0–1000 ölçeğine yuvarlanır. Değer, `round(1000 × max(R,G,B) / 255)` olarak parlaklığı belirler. Gri, beyaz ve siyahın renk tonu ve doygunluğu sıfır. Siyahın parlaklığı sıfır ve güç paketi yok.
- Açık uygulama eylemi önce `BC 04 06 <hue:u16 BE> <sat:u16 BE> 00 00 55`, ardından `BC 05 06 <level:u16 BE> 00 00 00 00 55` gönderir. Örneğin `#804020` için H20/S750/V502. Parlaklık kaydırıcısı yalnız ikinci tarayıcı yazımı tamamlanınca eşitlenir. Fiziksel tepki ayrıca kontrol edilir.
- Yazımlar seri, bir oturuma bağlı ve aralarında başka kontrol komutu kabul edilmez. İlk hata sonraki yazımı durdurur. Kesintiden sonra eski işlem yeniden bağlanmada sürmez. Tamamlanan yazımın fiziksel etkisi kalabilir.
- Favoriler aynı tarayıcıda ve aynı kaynakta yerel renk örnekleri olarak saklanır. Renk girişi, seçim, favori seçme ve yeniden bağlanma gönderim yapmaz. Ham HEX tanılaması ayrı, onaylı tek bir `BC … 55` çerçevesi ve en çok 20 bayt.

## Aşamalar ve geçiş koşulları

1. **v0.2.0 inceleme.** Özellik dalında Node testleri ve dar ekran kontrolü. Taslak PR kullanıcı incelemesine açılır. Test sonucu, commit ve fiziksel kabul durumu ayrı kaydedilir.
2. **Kullanıcı QA ve yayın onayı.** Taslak PR commit'inden sunulan güvenilir HTTPS sayfasında Android Chrome ile çalıştır. Kırmızı referansı, yeni renk/HSV değeri, favoriler, mevcut kontroller ve yeniden bağlanmayı QA planına göre kaydet. Birleştirme ve yayın için açık onay bekle.
3. **Ayrı, salt okunur bölge araştırması.** Yeni kaynak veya gerçek cihaz verisi bulunursa kaynağını ve hipotezi belgele. Kullanıcı onayıyla MR Star ve Elkotrol'ün olağan BLE yazımlarını pasif olarak karşılaştır. Aday komut, beklenen davranış ve geri dönüş anlaşılırsa tek deney için ayrıca onay al. Rastgele opcode taraması, otomatik deneme, kasa açma, kontrolcü değiştirme, Wi-Fi ve firmware/OTA işlemleri kapsam dışı.
4. **Bölge kanıtı.** Gerçek şeritte kırmızı ve mavi eşzamanlı, uzamsal olarak ayrı ve sabit olmalı. Bir bölge değişirken diğer bölge sabit kalmalı. Efekt, ardışık global renk ve simülasyon bölge desteğini kanıtlamaz.
