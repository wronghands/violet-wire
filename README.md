# Violet Wire

5 m RGB pixel neon için Android Chrome üzerinden çalışan Web Bluetooth test uygulaması. **v0.1.0 ilk donanım test sürümü.**

## Telefonda aç

1. Telefonun Bluetooth’unu aç ve USB’den neon şeride güç ver. MR Star, Elkotrol ve nRF Connect’te etkin bağlantı varsa kapat.
2. [Violet Wire HTTPS uygulamasını](https://wronghands.github.io/violet-wire/) Android Chrome’da doğrudan aç. **Bağlan**’a dokun ve `GATT--DEMO` cihazını seç. Gerekirse Chrome’a yakındaki cihaz erişimi ver.
3. Önce **Kırmızı**’yı dene. Ardından [donanım QA planındaki](docs/QA.md) güç, altı renk ve yeniden bağlanma adımlarını uygula. Her komutun fiziksel şeritteki sonucunu kaydet.

Bağlantı kurulduğunda uygulama kendiliğinden komut göndermez. Uygulama GATT yazmasının tarayıcıdaki sonucunu gösterir. Cihazın uyguladığı renk veya güç durumunu fiziksel şerit üzerinden kontrol et. Ham HEX bölümü bilinen paketlerin elle tekrarı içindir. Uygulama konum, mikrofon veya müzik API’lerini çağırmaz. Android ve Chrome, sürüme göre Bluetooth keşfi için sistem izni isteyebilir.

## Kaynak ve testler

Bu GitHub reposu uygulamanın ve belgelerin esas kaynağıdır. GitHub Pages `main` dalının kökünden statik dosyaları yayımlar. Uygulama derleme, kurulum ve harici servis gerektirmez.

Node.js ile `npm test` komutunu çalıştır. Testler paket baytlarını ve taklit GATT bağlantısını kontrol eder. Android ve fiziksel neon sonuçları ayrı bir aşamadır. [Protokol ve kanıt düzeyleri](docs/PROTOCOL.md) · [Aşamalar ve devir noktası](docs/CHECKPOINT.md)
