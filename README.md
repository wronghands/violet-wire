# Violet Wire

5 m RGB pixel neon için Android Chrome üzerinden çalışan Web Bluetooth uygulaması. **v0.2.0 inceleme sürümü** özel renk ve yerel favoriler ekliyor. Fiziksel cihazda v0.2.0 kabul testi bekleniyor.

Kullanıcı 10 Kasım 2026'da v0.1.0 ile gerçek şeritte bağlantının, hazır renklerin ve parlaklık ayarının çalıştığını, parlaklık kontrolünün MR Star'dan daha hassas olduğunu bildirdi. Bu genel kabul gözlemine ayrı ayrı test sonuçları eşlik etmedi.

## Telefonda aç

1. Telefonun Bluetooth’unu aç ve USB’den neon şeride güç ver. MR Star, Elkotrol ve nRF Connect’te etkin bağlantı varsa kapat.
2. v0.2.0 testi için taslak PR'ın ilgili commit'inden sunulan güvenilir HTTPS önizlemesini Android Chrome'da doğrudan aç. Ekrandaki sürümü kontrol et. [GitHub Pages'teki mevcut v0.1.0](https://wronghands.github.io/violet-wire/) karşılaştırma için kullanılabilir.
3. **Bağlan**’a dokun ve `GATT--DEMO` cihazını seç. Gerekirse Chrome’a yakındaki cihaz erişimi ver. Önce **Kırmızı**’yı dene, ardından [donanım QA planını](docs/QA.md) izle.

## Özel renk ve favoriler

- Renk seçiciyi kullan veya altı haneli `#RRGGBB` yaz. Önizleme istenen RGB rengini gösterir. Fiziksel şeridin rengi ve parlaklığı firmware, LED ve difüzöre göre farklı görünebilir.
- Özel rengi uyguladığında şeridin tamamı için renk tonu, doygunluk ve parlaklık gönderilir. En yüksek RGB kanalı parlaklığı belirler. Örneğin `#804020` yaklaşık %50,2 parlaklık ister. `#000000` %0 parlaklık ister ve güç komutu göndermez. Tarayıcı parlaklık yazmasını tamamlayınca kaydırıcı bu değere gelir.
- En fazla 12 farklı rengi favorilere ekleyebilir, daha sonra seçebilir veya kaldırabilirsin. Favoriler aynı tarayıcıda ve aynı site adresinde yerel olarak saklanır. Tarayıcı depolamayı engellerse liste sayfa açıkken kullanılabilir. Favori seçme, HEX alanına yazma ve yeniden bağlanma kendi başına BLE komutu göndermez.
- Tanılama altındaki ham HEX aracı `BC … 55` protokol çerçevelerinin elle tekrarı içindir. Tarayıcının yazma sonucu ile fiziksel LED davranışını ayrı değerlendir.

Uygulama konum, mikrofon veya müzik API’lerini çağırmaz. Android ve Chrome, sürüme göre Bluetooth keşfi için sistem izni isteyebilir. İki bağımsız sabit bölge için firmware desteği bilinmiyor.

## Kaynak ve testler

Bu GitHub reposu uygulamanın ve belgelerin esas kaynağıdır. GitHub Pages `main` dalının kökünden statik dosyaları yayımlar. v0.2.0 değişiklikleri taslak PR'da incelenir ve `main` için kullanıcı onayı beklenir. Uygulama derleme ve harici çalışma zamanı bağımlılığı gerektirmez.

Node.js ile `npm test` komutunu çalıştır. Testler renk dönüşümünü, paketleri, yerel favorileri ve taklit GATT davranışını kontrol eder. Android ve fiziksel neon sonuçları ayrı kaydedilir. [Protokol ve kanıt düzeyleri](docs/PROTOCOL.md) · [Aşamalar ve devir noktası](docs/CHECKPOINT.md)

## v0.2.1 — doğrudan renk seçici

Android Chrome'un sekiz hazır renkli yerel seçim ekranı yerine **sayfa içinde HSV editörü** kullanılır: büyük doygunluk/ışıklılık alanına dokun ve sürükle; renk tonu kaydırıcısını kullan. Klavye ve erişilebilirlik için doygunluk/ışıklılık kaydırıcıları da bulunur. HEX, favoriler ve önizleme eşzamanlıdır. BLE komutları yalnızca **Rengi uygula** ile gönderilir. v0.2.0 gerçek LED üzerinde kullanıcı tarafından doğrulanmıştır; v0.2.1 editörünün mobil saha testi ayrıca gereklidir.
