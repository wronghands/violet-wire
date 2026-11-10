# Violet Wire BLE protokolü

## Hedef cihaz ve kanıt düzeyi

- **Kullanıcı gözlemi.** Hedef 5 m RGB pixel neon, USB yalnızca güç veriyor. MR Star ve Elkotrol bu cihazı çalıştırıyor. Kasaya veya firmware'e müdahale bu araştırmanın kapsamı dışında.
- **Kullanıcı ölçümü.** BLE reklam adı `GATT--DEMO`, GATT servisi `FFF0`, yazma karakteristiği `FFF3` (`WRITE` ve `WRITE_NO_RESPONSE`), bildirim karakteristiği `FFF4` (`NOTIFY`). 16 bit UUID'ler standart Bluetooth tabanına açılır. Örneğin `0000fff0-0000-1000-8000-00805f9b34fb`.
- **Hedef cihazda doğrulandı.** nRF Connect ile `FFF3` üzerine `BC 04 06 00 00 03 E8 00 00 55` yazılınca şerit kırmızı yandı. Violet Wire üzerinden fiziksel LED doğrulaması kullanıcı testinde yapılacak.
- **Kaynaklardan çıkarım.** Bilinen kırmızı çerçeve MR Star / Miracles Star biçimiyle eşleşiyor. Aşağıdaki diğer komutlar kaynak temelli adaylar. Aynı reklam adı veya GATT topolojisi tek başına aynı firmware sürümünü belirlemez.
- **Bilinmeyen.** `FFF4` bildirimlerinin bu cihazdaki içeriği ve ne zaman geldiği, iki bağımsız sabit bölge desteği ve varsa adresleme biçimi.

## Taşıma ve çerçeve

Android Chrome'da HTTPS sayfasındaki kullanıcı eylemi cihaz seçiciyi açar. `GATT--DEMO` ad filtresi kullanılır ve `FFF0` servisine erişim istenir. [mr-star-ble keşif kodu](https://github.com/mishamyrt/mr-star-ble/blob/main/mr_star_ble/discover.py) başka bir reklam UUID'sine (`2022`) göre tarar. Hedefteki servis kimliği kullanıcı ölçümünden gelir.

Komut biçimi `BC <opcode> <payload uzunluğu> <payload> 55`. Her çerçeve ayrı bir `FFF3` yazımıdır. `writeValueWithoutResponse` destekleniyorsa kullanılır, yalnız yanıtlı yazım varsa `writeValueWithResponse` kullanılır. Tarayıcının yazımı başarılı bildirmesi yalnız taşıma hakkında bilgi verir. LED çıktısı komutun sonucunu belirler. `FFF4` bildirimi görülürse ham veri olarak kaydedilir. Anlamı fiziksel gözlemle eşleştirilene kadar açık kalır.

Bağlantı sırasında renk, güç veya başlatma çerçevesi gönderilmez. GlowBridge, eskiden başlatmada kullanılan `06` komutunun animasyon seçtiğini kaydediyor. [GlowBridge protokol belgesi](https://github.com/ronnygeo/GlowBridge/blob/main/docs/PROTOCOL.md)

## İlk sürüm komutları

### Tek renk

`BC 04 06 <hue:u16 BE> <saturation:u16 BE> 00 00 55`. Hue derece, saturation binde değeridir. GlowBridge belgesindeki bir cümle her iki alanı binde olarak tanımlıyor. Aşağıdaki eşleme iki projenin derece kullanan uygulama koduna dayanıyor. Sondaki iki sıfır dolgu. Renk ile parlaklık ayrı yazılır. [GlowBridge C kodu](https://github.com/ronnygeo/GlowBridge/blob/main/Sources/CGlowProtocol/glow_frames.c#L73-L107), [mr-star-ble renk dönüşümü](https://github.com/mishamyrt/mr-star-ble/blob/main/mr_star_ble/color.py), [mr-star-ble çerçeveleri](https://github.com/mishamyrt/mr-star-ble/blob/main/mr_star_ble/commands.py)

| Renk | Hue | Çerçeve | Hedef cihaz kanıtı |
| --- | ---: | --- | --- |
| Kırmızı | 0° | `BC 04 06 00 00 03 E8 00 00 55` | Kullanıcı nRF Connect ile gördü |
| Yeşil | 120° | `BC 04 06 00 78 03 E8 00 00 55` | Kullanıcı testi bekliyor |
| Mavi | 240° | `BC 04 06 00 F0 03 E8 00 00 55` | Kullanıcı testi bekliyor |
| Sarı | 60° | `BC 04 06 00 3C 03 E8 00 00 55` | Kullanıcı testi bekliyor |
| Magenta | 300° | `BC 04 06 01 2C 03 E8 00 00 55` | Kullanıcı testi bekliyor |
| Cyan | 180° | `BC 04 06 00 B4 03 E8 00 00 55` | Kullanıcı testi bekliyor |

Bu kontroller altı tanınabilir renk için hazırlanmıştır. Fiziksel LED, optik difüzör ve firmware renk dönüşümü nedeniyle ekran HEX değerleri LED için ölçüm standardı sayılmaz.

### Güç ve parlaklık

| İşlem | Çerçeve | Dayanak |
| --- | --- | --- |
| Aç | `BC 01 01 01 55` | İki referansın temel güç biçimi |
| Kapat | `BC 01 01 00 55` | İki referansın temel güç biçimi |
| Parlaklık | `BC 05 06 <seviye:u16 BE> 00 00 00 00 55` | İki referans aynı yapıyı kullanıyor |

Hedefte üç işlem de fiziksel test bekliyor. İlk sürüm parlaklıkta GlowBridge'in 0–1000 ölçeğini kullanır. Örneğin %50 için `BC 05 06 01 F4 00 00 00 00 55`. mr-star-ble 0–1024 kullanır. Hedef firmware'in üst uçta nasıl davrandığı bilinmiyor. GlowBridge ayrıca bazı varyantlar için açma `BC 0C 01 01 55` ve kapatma `BC 0F 01 01 55` belgeliyor. Bunlar ilk sürümün güç düğmeleriyle otomatik gönderilmez. Güç düğmesi sonuç vermezse aday biçimi MR Star veya Elkotrol kaydında arayın. [GlowBridge protokol belgesi](https://github.com/ronnygeo/GlowBridge/blob/main/docs/PROTOCOL.md), [mr-star-ble çerçeveleri](https://github.com/mishamyrt/mr-star-ble/blob/main/mr_star_ble/commands.py)

## İki sabit bölge araştırması

**Durum: bilinmiyor.** İncelenen açık kaynak kodunda iki bölgenin başlangıç/bitiş adresini, ayrı renklerini veya piksel tamponunu yazan bir komut görülmedi. GlowBridge'in `06` çerçevesi bir efekt seçer. mr-star-ble'daki `03` ayarı şerit uzunluğunu temsil eder. `07` yönü, `08` ise o projenin desteklediği cihazlarda hızı ayarlar. Bunların varlığı iki bağımsız sabit bölgeye ilişkin kanıt sağlamaz. [GlowBridge protokol belgesi](https://github.com/ronnygeo/GlowBridge/blob/main/docs/PROTOCOL.md), [mr-star-ble komut listesi](https://github.com/mishamyrt/mr-star-ble/blob/main/mr_star_ble/const.py), [Findn entegrasyonunun özellikleri](https://github.com/hirotasoshu/ha-findn-led-ble#features)

Benzer reklam adı ve GATT topolojisi bir başka 3 m Miracles Star cihazında da raporlanmış. Bu, taşıma için bağımsız bir karşılaştırma noktasıdır. Hedef 5 m ürünün firmware kimliği veya sabit bölge özelliği hakkında doğrudan bilgi vermez. [Tira-led GATT kaydı](https://github.com/Luiscrespo-bot/Tira-led/blob/main/knowledge_base.yaml)

### Kullanıcı onayı sonrası salt okunur inceleme

1. Kullanıcının kendi cihazında MR Star ve Elkotrol sürümlerini kaydedin. Varsa manuel bölge veya piksel düzenleme ekranının tam adını ve kontrollerini belirleyin. Önce uygulamanın normal BLE trafiğini inceleyin. Kullanıcının izniyle Android HCI kaydı alınabilir. Hedef dışı Bluetooth verilerini içerebilecek tam kaydı yerelde tutun, repoya yalnız kişisel veriden arındırılmış hedef çerçevelerini ekleyin. [Android Bluetooth kayıt belgeleri](https://source.android.com/docs/core/connect/bluetooth/verifying_debugging)
2. Boşta, kırmızı, mavi, tek bir parlaklık adımı ve aç/kapat için ayrı kayıtlar alın. GATT keşfinden `FFF3` değer tutamacını belirleyip yalnız hedef bağlantıdaki yazımları karşılaştırın. `FFF4` verisi görülürse zamanıyla birlikte kaydedin.
3. Manuel bölge kontrolü varsa önce aynı sınırlarla yalnız bir bölgenin rengini, sonra aynı renklerle yalnız sınırı değiştirin. Fiziksel gözlemi çerçevelerdeki farklarla eşleştirin. Sadece efekt seçimi görülürse bunu efekt bulgusu olarak kaydedin. Kontrol bulunamazsa bu, donanımın özelliği hiç desteklemediğini ispatlamaz.
4. İlk sürümün ham HEX alanı, gözlemlenmiş tek bir kısa çerçevenin kullanıcı tarafından elle yeniden gönderilmesi içindir. Uygulama sınırı 20 bayttır. Bilinen kırmızı çerçeveyle başlayın. Rastgele opcode taraması, otomatik denemeler, ayar veya güncelleme komutları ve firmware müdahalesi kapsam dışında.

**Bölge doğrulama eşiği.** Gerçek şeritte aynı anda iki ayrı sabit renk görünmeli. Bir bölgenin rengi değişirken diğerinin rengi ve sınırı sabit kalmalı. Desen, komut yazımı durduktan sonra en az 30 saniye sabit kalmalı ve aynı dizinin yeniden uygulanması sonucu tekrarlamalı. Video ve ayıklanmış çerçeveler kullanıcı tarafından gözden geçirildikten sonra uygulama kapsamı yeniden değerlendirilebilir.
