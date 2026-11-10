# Violet Wire | CANONICAL CHECKPOINT

2026-11-10 · **v0.3.0 experimental** · 5 m pixel neon cihazı. Kaynak: https://github.com/wronghands/violet-wire

## Doğrulanan durum
- v0.1–v0.2.1 kullanıcı gerçek cihaz testleri: BLE, renkler, özel HEX, favoriler ve parlaklık çalıştı. Hue kaydırıcısı bazen ilk denemede güncellenmiyor; tekrar deneyince düzeliyor (**low priority bug**).
- BLE cihaz `GATT--DEMO`, servis `FFF0`, yazma `FFF3`, bildirim `FFF4`.
- Bilinen örnek kırmızı paket: `BC 04 06 00 00 03 E8 00 00 55`.
- USB yalnız güç; kasa açılmayacak, firmware değiştirilmeyecek, Wi-Fi kullanılmayacak.
- v0.3.0 yeni deneysel uzunluk komutu: `BC 03 02 <count:u16 BE> 55`; upstream kaynakta var ancak hedef cihazda denenmedi.
- Statik iki bağımsız bölge/piksel adresleme **UNKNOWN**. Animasyon presetleri mevcut fakat bu kanıt değil.
- Deney A önde / B önde / tek renk kısaltma, orijinal sayıyı restore, tam şerit mavi restore; sonuçlar fiziksel kullanıcı gözlemi gerektirir.
- Orijinal PIXELS sayısı **UNKNOWN**. Kullanıcı önce MR Star üzerinden doğrulayıp uygulamada saklamalı (desteklenen aralık 9–300). Bu sayı olmadan deney gönderilmez.
- Kanıt eşiği: iki renk 30 saniye eşzamanlı sabit kalmalı; restore orijinal tam şerit davranışını geri getirmeli.
- Yazılım testleri github workflow `.github/workflows/test.yml`; fiziksel test otomatik olarak yapılamaz.

## Sıradaki aksiyon
1. GitHub Pages'in v0.3.0'ı sunduğunu doğrula.
2. Gerçek cihaz PIXELS değerini girip deneysel lab'de A kırmızı / B mavi testini çalıştır.
3. Gözleme göre tekrar tasarla. Basit iki renk varsa sınırın ve ikinci bölgenin bağımsızlığı için ek test yap. Başarısızsa firmware'le uyumlu farklı belgeli komutları araştır. Eski seçenekleri başarı olarak varsayma.
