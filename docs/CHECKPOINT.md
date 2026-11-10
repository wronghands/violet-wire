# Violet Wire | CANONICAL CHECKPOINT

Tarih: 2026-11-10 · Sürüm: 0.1.0 · Durum: **İlk fiziksel donanım QA’sı ve kullanıcı onayı bekleniyor.**

## Aktif hedef

Android Chrome ve HTTPS üzerinden 5 m RGB pixel neon şeridin BLE kontrolünü doğrula. Sonraki araştırma hedefi aynı şeritte aynı anda iki bağımsız sabit bölgeye kırmızı ve mavi atamak. İkinci hedef, ilk test sürümünün kabulünden ve bir komutun gerçek cihazda kanıtlanmasından sonra uygulamaya alınabilir.

## Esas kaynak ve teslim

- Repo: [wronghands/violet-wire](https://github.com/wronghands/violet-wire), `main` dalı.
- Test uygulaması: [GitHub Pages HTTPS](https://wronghands.github.io/violet-wire/).
- Statik uygulama, Node testleri ve belgeler bu bağımsız depoda tutulur. Fiziksel test için [QA planı](QA.md), paketler ve araştırma için [protokol](PROTOCOL.md) kullanılır.

## Doğrulanmış durum ve belirsizlikler

- **KULLANICI BİLGİSİ.** USB sadece güç. Kasa kapalı kalacak. MR Star ve Elkotrol şeridi kontrol edebiliyor. BLE reklam adı `GATT--DEMO`, servis `FFF0`, yazma `FFF3` (`WRITE`/`WRITE_NO_RESPONSE`), bildirim `FFF4`.
- **KULLANICI DONANIM TESTİ.** nRF Connect ile `BC 04 06 00 00 03 E8 00 00 55` yazımı fiziksel şeridi kırmızı yaptı. Bu, Chrome uygulamasının testi için karşılaştırma noktasıdır.
- **KAYNAK.** GlowBridge ve mr-star-ble, tek renk için derece cinsinden hue ve `1000` doygunluk alanı kullanılan aynı paket yapısını, `BC 01` güç paketini ve `BC 05` parlaklık paketini uyguluyor. Parlaklık ölçekleri farklı. Bu sürüm `0–1000` kullanıyor ve değişikliği elle uygulatıyor. İlgili kod ve tam paketler protokol belgesinde.
- **UYGULAMA KARARI.** Chrome cihaz seçicisi reklam adını kullanır. Yazma için uygun FFF3 yöntemi seçilir. FFF4 bildirimleri tanılama içindir. Her paket kullanıcı eylemiyle gönderilir. Ham HEX tek bir tam `BC … 55` paketi ve 20 bayt sınırı ile onaylı tekrar içindir.
- **BİLİNMİYOR.** Chrome üzerinden bağlantının, altı rengin, güç ve parlaklığın bu cihazdaki gerçek davranışı. FFF4 bildirimlerinin semantiği. Firmware sürümü. İki bağımsız sabit bölge veya piksel adresleme desteği. Kaynaklarda böyle bir komut bulunmadı, bu firmware’de bulunmadığı kanıtlanmış değil.

## Aşamalar ve geçiş koşulları

1. **İlk sürüm.** Uygulama, protokol incelemesi, Node testleri ve canlı HTTPS önizlemesi. Otomatik test, donanım QA’sından ayrı tutulur.
2. **Kullanıcı QA ve onay.** Android Chrome’da kırmızı referans, güç, altı renk, üç bağlantı döngüsü ve kesinti sonrası toparlanma. İsteğe bağlı parlaklık ve ham kırmızı tekrarı. Sonuçları aynı cihazda kaydet ve ilerleme kararını kullanıcıdan al.
3. **Salt okunur bölge araştırması.** Upstream komutları karşılaştır. Kullanıcı kabul ederse kendi telefonundaki MR Star/Elkotrol’ün normal işlemlerine ait BLE yazımlarını pasif olarak karşılaştır. Aday komutun kaynağı, sınırları ve geri alma adımı anlaşılırsa tek tek deneysel test için kullanıcı onayı al. Rastgele opcode taraması, otomatik tekrar, firmware yazma/yükleme ve kasa açma kapsam dışı.
4. **Ayrı uygulama kararı.** Gerçek şeritte kırmızı ve mavi eşzamanlı, uzamsal olarak ayrı ve sabit olmalı. Bir bölge değişirken diğer bölge sabit kalmalı. Animasyon, efekt preseti, iki ardışık global renk komutu veya simülasyon kanıt sayılmaz. Kesin RGB HEX renk eşleşmesi kabul koşulu değildir.
