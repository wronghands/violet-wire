# Violet Wire | CANONICAL CHECKPOINT

2026-11-10 · **v0.2.1 normal kullanım** · Hazır efektin fiziksel sabitlik testi bekleniyor.

## Aktif hedef

Hedef aynı 5 m RGB pixel neon şeritte eşzamanlı, sabit iki renk. İdeal sonuç ilk yaklaşık 75 LED kırmızı, son yaklaşık 75 LED mavi. Belgelenmiş ilk test sabit bir kırmızı–yeşil efekti adayı kullanır. Bağımsız bölge desteği bilinmiyor. Normal kontrol arayüzü v0.2.1.

## Esas kaynak ve teslim

- [wronghands/violet-wire](https://github.com/wronghands/violet-wire) esas kaynak. Aktif çalışma [görev #8](https://github.com/wronghands/violet-wire/issues/8).
- Karşılaştırma sürümü [v0.2.1](https://wronghands.github.io/violet-wire/), geri alma commit'i [`cfb05d8`](https://github.com/wronghands/violet-wire/commit/cfb05d8ec72e47b4fa862582b05f9966e552f8fb). Ayrı [HTTPS test sürümü](https://wronghands.github.io/violet-wire-tests/effect-58-v1/lab/) kendi sürüm dizininde kalır. [Donanım kanıtı ve test adımları](STATIONARY_COLORS.md)
- Statik uygulama, Node testleri ve belgeler bu bağımsız depoda tutulur. Fiziksel kabul için [QA planı](QA.md), dönüşüm, paketler ve bölge araştırması için [protokol](PROTOCOL.md) kullanılır.

## Doğrulanmış durum ve belirsizlikler

- **KULLANICI BİLGİSİ.** USB sadece güç. Kasa kapalı kalacak. MR Star ve Elkotrol şeridi kontrol edebiliyor. BLE reklam adı `GATT--DEMO`, servis `FFF0`, yazma `FFF3` (`WRITE`/`WRITE_NO_RESPONSE`), bildirim `FFF4`.
- **KULLANICI DONANIM TESTİ.** nRF Connect ile `BC 04 06 00 00 03 E8 00 00 55` yazımı fiziksel şeridi kırmızı yaptı. 10 Kasım 2026'da kullanıcı Android Chrome'daki v0.1.0 ile bağlantının, hazır renklerin ve parlaklığın gerçek şeritte çalıştığını bildirdi. Kullanıcı parlaklık kontrolünü MR Star'dan daha hassas buldu. Bu bir genel kabul raporu. Güç, tek tek renkler, kesinti, ham HEX ve FFF4 için ayrı fiziksel test kaydı yok.
- **KAYNAK.** GlowBridge ve mr-star-ble aynı derece cinsinden renk tonu ve 1000 birimlik doygunluk biçimini, `BC 01` güç paketini ve `BC 05` parlaklık paketini kullanır. Parlaklık ölçekleri 0–1000 ve 0–1024 olarak farklıdır. Violet Wire 0–1000 kullanır.
- **KULLANICI DONANIM TESTİ.** v0.2.1 bağlantı, özel HEX, favoriler ve parlaklık gerçek şeritte çalıştı. Kullanıcı ara sıra renk tonu seçimini tekrarlamak gerektiğini bildirdi.
- **KULLANICI DONANIM TESTİ.** `SET_LENGTH=75` deneyinde ilk yaklaşık yarı seçilen renkte yandı, kalan yarı karanlık kaldı. Önceki rengin kuyrukta kalacağı hipotezi gözlenen koşuda başarısız oldu. Tam paket sırası ve zamanlama kaydedilmedi.
- **KULLANICI SAYIMI.** 146 görünür LED ve bant altında tahmini 4–6 LED. Pratik sayı yaklaşık 150, fiziksel aralık 150–152. Controller'da kayıtlı sayı bilinmiyor.
- **BİLİNMİYOR.** FFF4 bildirimlerinin anlamı, firmware sürümü, hız 0 davranışı ve sabit bölge veya piksel adresleme desteği. İncelenen kaynaklarda bağımsız bölge komutu bulunmadı.

## v0.2.0 uygulama kararları

- Chrome cihaz seçicisi `GATT--DEMO` reklam adını kullanır. `FFF3` yazma yöntemi desteğe göre seçilir. FFF4 bildirimleri tanılama içindir. Erişim isteği Bluetooth ile sınırlı.
- Özel RGB girişi başında `#` olan altı onaltılık basamak. Seçici, metin alanı ve önizleme birlikte çalışır. Önizleme istenen RGB'yi gösterir. Optik doğruluk kabul koşulu değildir.
- HSV renk tonu en yakın dereceye yuvarlanır, 360° sonucu 0° olur. Doygunluk ve değer 0–1000 ölçeğine yuvarlanır. Değer, `round(1000 × max(R,G,B) / 255)` olarak parlaklığı belirler. Gri, beyaz ve siyahın renk tonu ve doygunluğu sıfır. Siyahın parlaklığı sıfır ve güç paketi yok.
- Açık uygulama eylemi önce `BC 04 06 <hue:u16 BE> <sat:u16 BE> 00 00 55`, ardından `BC 05 06 <level:u16 BE> 00 00 00 00 55` gönderir. Örneğin `#804020` için H20/S750/V502. Parlaklık kaydırıcısı yalnız ikinci tarayıcı yazımı tamamlanınca eşitlenir. Fiziksel tepki ayrıca kontrol edilir.
- Yazımlar seri, bir oturuma bağlı ve aralarında başka kontrol komutu kabul edilmez. İlk hata sonraki yazımı durdurur. Kesintiden sonra eski işlem yeniden bağlanmada sürmez. Tamamlanan yazımın fiziksel etkisi kalabilir.
- Favoriler aynı tarayıcıda ve aynı kaynakta yerel renk örnekleri olarak saklanır. Renk girişi, seçim, favori seçme ve yeniden bağlanma gönderim yapmaz. Ham HEX tanılaması ayrı, onaylı tek bir `BC … 55` çerçevesi ve en çok 20 bayt.

## Aşamalar ve geçiş koşulları

1. **Fiziksel deney.** Android Chrome'da ayrı HTTPS testini aç. Bir kez **Dene**. İki ayrı yazım `BC 06 02 00 3A 55` ve `BC 08 01 00 55`. Kayıt ve gerçek şeritteki renkleri, sınırı ve hareketi ayrı kaydet. En az 30 saniye izle. **Tek renge dön** bilinen global kırmızı komutunu gönderir. Önceki hız değerini geri yüklemez.
2. **Pasif inceleme.** Sonuç sabit değilse MR Star veya Elkotrol'ün olağan FFF3 yazımlarını bilinen efekt, minimum hız ve tek renk dönüşü için karşılaştır. Sürümü, zamanlamayı, seçilen efekt adını ve ayıklanmış baytları kaydet. Tam HCI kaydı özel kalır. Yeni uzunluk denemesi için yeni kanıt gerekir. Rastgele opcode taraması, kasa açma, kontrolcü değiştirme ve firmware işlemleri kapsam dışı.
3. **Bölge kanıtı.** Bir hazır efektin ≥30 saniye sabit kalması hazır desen için kanıttır. Bağımsız kontrol için bir bölge değişirken diğer bölge ve sınırı sabit kalmalı. Hareket, tek renk veya karanlık kuyruk başarı sayılmaz.
