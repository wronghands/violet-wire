# Violet Wire — ilk saha testi

**Durum:** Android Chrome ve fiziksel neon testi bekliyor. Bu dosya test planıdır. Sonuçları her çalıştırma için ayrı kaydedin.

## Hazırlık

- Canlı HTTPS adresini Android Chrome’da doğrudan açın. Test kaydına URL, sürüm veya commit, telefon modeli, Android ve Chrome sürümlerini ekleyin.
- 5 m RGB pixel neonu mevcut USB güç kaynağıyla besleyin. Kasayı kapalı tutun. Chrome’un cihaz seçicisini açmadan önce MR Star, Elkotrol ve nRF Connect bağlantılarını kesin.
- Chrome’un Bluetooth cihaz seçicisinde `GATT--DEMO` cihazını seçin. Birden fazla aynı adlı cihaz varsa önce doğru cihazı nRF Connect’te kendi cihaz kaydınızdaki adresle ayırt edin, ardından nRF Connect bağlantısını kesin.
- Bağlan düğmesine dokunana kadar cihaz seçicisi açılmamalı. İzin pencerelerini kaydedin. Uygulama konum, mikrofon veya müzik erişimi talep etmemeli.

## Test matrisi

| Test | Adımlar | Beklenen sonuç |
| --- | --- | --- |
| İlk bağlantı | Bağlan’a dokunun, `GATT--DEMO`yu seçin. | Bağlantı durumu görünür. Komutlar ancak FFF0 servisi ve FFF3 yazma karakteristiği hazırken etkinleşir. Bağlantı kendiliğinden renk veya güç komutu göndermez. |
| Kırmızı referansı | Kırmızı düğmesine dokunun. | LED’in tamamı sabit kırmızı görünür. Yazma kaydında `BC 04 06 00 00 03 E8 00 00 55` görünür. Bu çerçeve kullanıcı tarafından nRF Connect ile doğrulandı, Violet Wire üzerinden tekrar sınanacak. |
| Diğer renkler | Yeşil, Mavi, Sarı, Macenta ve Cyan düğmelerini sırayla deneyin. Her renk sabitlenince gözlemleyin. | Her düğme LED’in tamamını beklenen renk ailesinde sabit gösterir. Görsel eşleşmeyi ekran HEX değeri veya kesin ton üzerinden puanlamayın. |
| Güç | Bir renk görünürken Kapat’a, ardından Aç’a dokunun. Gerekirse bir renk seçin. | Kapat ışığı söndürür. Aç sonrasında şerit tekrar aydınlatılabilir. Renk hafızasını ayrı bir gözlem olarak kaydedin. |
| Yeniden bağlanma | Bağlantıyı kesip yeniden bağlanın, ardından kırmızıyı gönderin. Üç kez tekrarlayın. | Her bağlantı kesiminde komutlar devre dışı kalır. Üç turda da tekrar bağlanıp kırmızı komutu gönderilebilir. |
| Cihaz seçicisi iptali | Bağlantıyı kesin ve tekrar bağlanmayı başlatın. Cihaz seçicisini kapatın, sonra yeniden deneyin. | Uygulama anlaşılır bir durum gösterir ve yeni bağlantı denemesine izin verir. |
| Beklenmedik bağlantı kesilmesi | Bağlıyken harici USB gücünü kesin. Uygulama bağlantı kaybını gösterince gücü verip tekrar bağlanın. | Komutlar devre dışı kalır. Yeniden bağlanma elle başlatılır ve sonrasında kırmızı yeniden gönderilebilir. |
| Parlaklık, varsa | Kırmızı yanarken düşük ve yüksek bir değer seçin ve her biri için Uygula’ya dokunun. | Fiziksel parlaklık farkını ve gönderilen çerçeveyi ayrı kaydedin. Kaydırıcıyı hareket ettirmek tek başına yazma başlatmaz. |
| Ham HEX, varsa | Önce bozuk HEX girin. Sonra yalnızca doğrulanmış kırmızı çerçeveyi kullanın. | Geçersiz giriş yazma başlatmaz. Geçerli giriş kullanıcı onayıyla tek kez gönderilir. Rastgele veya yeni opcode göndermeyin. |
| FFF4 bildirimleri, varsa | Normal komutları denerken tanılama kaydını izleyin. | Bildirim gelirse ham baytları kaydedin. Bildirim yoksa komut sonucunu LED’den gözlemleyin. |

## Kayıt ve kullanıcı onayı

Her satıra **Geçti**, **Kaldı** veya **Denenmedi** yazın. Sorun varsa hangi düğmeye dokunduğunuzu, arayüz durumunu, gönderilen baytları ve LED’de gördüğünüz sonucu kaydedin. Tarayıcıdaki yazma sonucu ile fiziksel LED gözlemini ayrı tutun.

Otomatik testler çerçeve baytlarını, girdi doğrulamasını veya taklit bağlantı davranışını sınayabilir. Android izinlerini, gerçek bağlantı kararlılığını ve LED tepkisini bu saha testi belirler. İlk sürüm kullanıcı incelemesine açık bir test sürümüdür. Temel test sonuçlarını kullanıcıyla gözden geçirin. İki bağımsız sabit bölge için ayrı protokol kanıtı, fiziksel cihaz doğrulaması ve uygulamaya geçmek için açık kullanıcı onayı gerekir.
