# Violet Wire

5 m RGB pixel neon için Android Chrome üzerinden çalışan Web Bluetooth uygulaması. **v0.2.1** normal kullanım sürümüdür. Kullanıcı gerçek şeritte Bluetooth bağlantısını, özel HEX renklerini, favorileri ve parlaklığı doğruladı.

Kullanıcı 10 Kasım 2026'da v0.1.0 ile gerçek şeritte bağlantının, hazır renklerin ve parlaklık ayarının çalıştığını, parlaklık kontrolünün MR Star'dan daha hassas olduğunu bildirdi. Bu genel kabul gözlemine ayrı ayrı test sonuçları eşlik etmedi.

## Telefonda aç

1. Telefonun Bluetooth’unu aç ve USB’den neon şeride güç ver. MR Star, Elkotrol ve nRF Connect’te etkin bağlantı varsa kapat.
2. [Violet Wire v0.2.1](https://wronghands.github.io/violet-wire/) sayfasını Android Chrome'da doğrudan aç.
3. **Bağlan**’a dokun ve `GATT--DEMO` cihazını seç. Gerekirse Chrome’a yakındaki cihaz erişimi ver. Önce **Kırmızı**’yı dene, ardından [donanım QA planını](docs/QA.md) izle.

## Özel renk ve favoriler

- Renk seçiciyi kullan veya altı haneli `#RRGGBB` yaz. Önizleme istenen RGB rengini gösterir. Fiziksel şeridin rengi ve parlaklığı firmware, LED ve difüzöre göre farklı görünebilir.
- Özel rengi uyguladığında şeridin tamamı için renk tonu, doygunluk ve parlaklık gönderilir. En yüksek RGB kanalı parlaklığı belirler. Örneğin `#804020` yaklaşık %50,2 parlaklık ister. `#000000` %0 parlaklık ister ve güç komutu göndermez. Tarayıcı parlaklık yazmasını tamamlayınca kaydırıcı bu değere gelir.
- En fazla 12 farklı rengi favorilere ekleyebilir, daha sonra seçebilir veya kaldırabilirsin. Favoriler aynı tarayıcıda ve aynı site adresinde yerel olarak saklanır. Tarayıcı depolamayı engellerse liste sayfa açıkken kullanılabilir. Favori seçme, HEX alanına yazma ve yeniden bağlanma kendi başına BLE komutu göndermez.
- Tanılama altındaki ham HEX aracı `BC … 55` protokol çerçevelerinin elle tekrarı içindir. Tarayıcının yazma sonucu ile fiziksel LED davranışını ayrı değerlendir.

Uygulama konum, mikrofon veya müzik API’lerini çağırmaz. Android ve Chrome, sürüme göre Bluetooth keşfi için sistem izni isteyebilir. İki bağımsız sabit bölge için firmware desteği bilinmiyor.

## Kaynak ve testler

Bu GitHub reposu uygulamanın ve belgelerin esas kaynağıdır. GitHub Pages `main` dalının kökünden statik dosyaları yayımlar. Uygulama derleme ve harici çalışma zamanı bağımlılığı gerektirmez.

Node.js ile `npm test` komutunu çalıştır. Testler renk dönüşümünü, paketleri, yerel favorileri ve taklit GATT davranışını kontrol eder. Android ve fiziksel neon sonuçları ayrı kaydedilir. [Protokol ve kanıt düzeyleri](docs/PROTOCOL.md) · [Aşamalar ve devir noktası](docs/CHECKPOINT.md)

## v0.2.1 — doğrudan renk seçici

**Sayfa içinde HSV editörü** büyük doygunluk ve ışıklılık alanını, renk tonu kaydırıcısını ve klavyeyle kullanılabilen ek kaydırıcıları bir araya getirir. HEX, favoriler ve önizleme eşzamanlıdır. Özel renk için BLE komutları yalnızca **Rengi uygula** ile gönderilir. Kullanıcı, renk tonu seçicisinin bazen bir kez daha denenmesi gerektiğini bildirdi.

## Ayrı donanım deneyi

[İki renk deneyini](https://wronghands.github.io/violet-wire-tests/effect-58-v1/lab/) Android Chrome'da aç. Deney, hazır kırmızı–yeşil efektinin kaynakta geçerli olan en düşük hızda fiziksel şeritte 30 saniye sabit kalıp kalmadığını ölçer. `SET_LENGTH=75` denemesinde ilk yaklaşık yarı renk aldı, kuyruk karanlık kaldı. Bağımsız bölge yazımı hâlâ bilinmiyor. [Donanım bulguları, tam paketler ve QA](docs/STATIONARY_COLORS.md)
