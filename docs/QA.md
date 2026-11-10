# Violet Wire v0.2.0 — Android kabul testi

**v0.2.0 fiziksel kabul testi bekliyor.** Kullanıcı 10 Kasım 2026'da v0.1.0 ile gerçek şeritte bağlantının, hazır renklerin ve parlaklığın çalıştığını, parlaklık kontrolünün MR Star'dan daha hassas olduğunu bildirdi. Genel kullanıcı gözlemi için tek tek test sonucu kaydı bulunmuyor. Bu plandaki v0.2.0 sonuçlarını ayrı kaydedin.

## Hazırlık

- Taslak PR'daki commit'ten sunulan güvenilir HTTPS önizlemesini Android Chrome'da doğrudan açın. Arayüzde v0.2.0 yazdığını doğrulayın. [GitHub Pages adresi](https://wronghands.github.io/violet-wire/) inceleme boyunca v0.1.0 karşılaştırma noktasıdır. Tarayıcı favorileri her site kaynağı için ayrı saklar.
- Test kaydına URL, tam commit, telefon modeli, Android ve Chrome sürümlerini ekleyin.
- 5 m RGB pixel neonu mevcut USB güç kaynağıyla besleyin. Kasayı kapalı tutun. Chrome’un cihaz seçicisini açmadan önce MR Star, Elkotrol ve nRF Connect bağlantılarını kesin.
- Chrome’un Bluetooth cihaz seçicisinde `GATT--DEMO` cihazını seçin. Birden fazla aynı adlı cihaz varsa önce doğru cihazı nRF Connect’te kendi cihaz kaydınızdaki adresle ayırt edin, ardından nRF Connect bağlantısını kesin.
- Bağlan düğmesine dokunana kadar cihaz seçicisi açılmamalı. İzin pencerelerini kaydedin. Uygulama konum, mikrofon veya müzik erişimi talep etmemeli. Android ve Chrome'un Bluetooth keşif iznini ayrı kaydedin.

## Özel renk ve favoriler

| Test | Adımlar | Beklenen sonuç |
| --- | --- | --- |
| Alan ve seçici | Dar ekranı dik kullanın. Renk seçiciden bir renk seçin, ardından metne `#804020` yazın. Klavye ve TalkBack ile alanları ve düğmeleri dolaşın. | Seçici, metin ve önizleme geçerli renk için eşleşir. Alan adları ve geçersiz format mesajı anlaşılır. Yazarken yatay taşma veya BLE yazımı görülmez. |
| Geçersiz biçim | `#123`, `#GG0000` ve `804020` deneyin. | Biçim hatası görünür. Geçersiz değer uygulanamaz ve favori olarak eklenemez. |
| Sıra ve parlaklık | Bağlanın. Manuel parlaklığı %20 civarında uygulayın. `#804020` yazın ve bekleyin. Sonra özel rengi bir kez uygulayın. | Yazarken şerit ve parlaklık kaydırıcısı değişmez. Önce `BC 04 06 00 14 02 EE 00 00 55`, sonra `BC 05 06 01 F6 00 00 00 00 55` yazılır. Oturum kaydı yeni girdileri üstte gösterir. İkinci yazım tamamlanınca kaydırıcı yaklaşık %50,2 olur. Ekran RGB'siyle kesin renk eşleşmesi aranmaz. |
| Gri, beyaz, siyah | Sırayla `#808080`, `#FFFFFF` ve `#000000` uygulayın. Ardından özel renk alanından `#804020` uygulayın. | İlk üç rengin kodlanan değerleri 502, 1000 ve 0 olur. Renk paketinde doygunluk 0'dır. Siyahın görünümünü ve renkli hedefe dönünce oluşan fiziksel tepkiyi ayrıca not edin. Siyah için güç paketi gönderilmez. |
| Favoriler | Bağlıyken renk seçin, favori ekleyin, başka renk seçin ve favoriye dokunun. Aynı adreste sayfayı yenileyin. Favoriyi tekrar seçip uygulayın. Favoriyi kaldırıp yeniden yenileyin. | Favori yerel olarak geri gelir ve silme kalıcıdır. Favori seçmek yalnız renk alanlarını ve önizlemeyi değiştirir. Yalnız uygulama eylemi paket gönderir. Yenileme ve yeniden bağlanma otomatik yazım yapmaz. |
| Yazım sırasında kesinti | Otomatik testte ilk yazım sürerken kopmayı ve ikinci yazım hatasını doğrulayın. Fiziksel testte bir kesinti gözlenirse işlem sonucu ve varsa kısmi LED değişimini kaydedin. Yeniden bağlanın ve yeni bir renk uygulayın. | İki yazım birbiriyle örtüşmez. İlk yazım başarısızsa ikinci paket gönderilmez. Bağlantı kesilince işlem yeniden bağlanmaya taşınmaz. İkinci yazım hata verirse kaydırıcı başarı sonucu gibi güncellenmez. Fiziksel kesinti gözlenmediyse bu vakayı cihazda denenmedi olarak işaretleyin. |

## Mevcut kontrollerin tekrar testi

Hazır renkleri denemeden önce manuel parlaklığı sıfırın üzerinde uygulayın. Hazır renkler parlaklığı değiştirmez.

| Test | Adımlar | Beklenen sonuç |
| --- | --- | --- |
| İlk bağlantı | Bağlan’a dokunun, `GATT--DEMO`yu seçin. | Bağlantı durumu görünür. Komutlar ancak FFF0 servisi ve FFF3 yazma karakteristiği hazırken etkinleşir. Bağlantı kendiliğinden renk veya güç komutu göndermez. |
| Kırmızı referansı | Kırmızı düğmesine dokunun. | LED’in tamamı sabit kırmızı görünür. Yazma kaydında `BC 04 06 00 00 03 E8 00 00 55` görünür. Hazır renk düğmesi ek parlaklık paketi göndermez. |
| Diğer renkler | Yeşil, Mavi, Sarı, Macenta ve Cyan düğmelerini sırayla deneyin. Her renk sabitlenince gözlemleyin. | Her düğme LED’in tamamını beklenen renk ailesinde sabit gösterir. Görsel eşleşmeyi ekran HEX değeri veya kesin ton üzerinden puanlamayın. |
| Güç | Bir renk görünürken Kapat’a, ardından Aç’a dokunun. Gerekirse bir renk seçin. | Kapat ışığı söndürür. Aç sonrasında şerit tekrar aydınlatılabilir. Renk hafızasını ayrı bir gözlem olarak kaydedin. |
| Yeniden bağlanma | Bağlantıyı kesip yeniden bağlanın, ardından kırmızıyı gönderin. Üç kez tekrarlayın. | Her bağlantı kesiminde komutlar devre dışı kalır. Üç turda da tekrar bağlanıp kırmızı komutu gönderilebilir. |
| Cihaz seçicisi iptali | Bağlantıyı kesin ve tekrar bağlanmayı başlatın. Cihaz seçicisini kapatın, sonra yeniden deneyin. | Uygulama anlaşılır bir durum gösterir ve yeni bağlantı denemesine izin verir. |
| Beklenmedik bağlantı kesilmesi | Bağlıyken harici USB gücünü kesin. Uygulama bağlantı kaybını gösterince gücü verip tekrar bağlanın. | Komutlar devre dışı kalır. Yeniden bağlanma elle başlatılır ve sonrasında kırmızı yeniden gönderilebilir. |
| Manuel parlaklık | Kırmızı yanarken düşük ve yüksek bir değer seçin ve her biri için Uygula’ya dokunun. | Fiziksel parlaklık farkını ve gönderilen çerçeveyi ayrı kaydedin. Kaydırıcıyı hareket ettirmek tek başına yazma başlatmaz. |
| Ham HEX | Tanılamada `#804020` ve bozuk çerçeve deneyin. Sonra yalnızca doğrulanmış kırmızı çerçeveyi kullanın. | RGB hedefi ve bozuk çerçeve yazma başlatmaz. Geçerli `BC … 55` çerçevesi kullanıcı onayıyla tek kez gönderilir. Rastgele veya yeni opcode göndermeyin. |
| FFF4 bildirimleri, varsa | Normal komutları denerken tanılama kaydını izleyin. | Bildirim gelirse ham baytları kaydedin. Bildirim yoksa komut sonucunu LED’den gözlemleyin. |

## Kayıt ve kullanıcı onayı

Her satıra **Geçti**, **Kaldı** veya **Denenmedi** yazın. Sorun varsa hangi düğmeye dokunduğunuzu, arayüz durumunu, gönderilen baytları ve LED’de gördüğünüz sonucu kaydedin. Tarayıcıdaki yazma sonucu ile fiziksel LED gözlemini ayrı tutun.

Otomatik testler çerçeve baytlarını, girdi doğrulamasını, yerel favorileri ve taklit bağlantı davranışını sınar. Android izinlerini, gerçek bağlantı kararlılığını ve LED tepkisini bu saha testi belirler. v0.2.0 test sonuçlarını taslak PR'da gözden geçirin. Birleştirme ve yayın için açık kullanıcı onayı gerekir. İki bağımsız sabit bölge için firmware desteği bilinmiyor. Bölge araştırması ve kabulü ayrı bir aşamadır.

```text
Violet Wire v0.2.0 Android kabul testi
Önizleme adresi ve commit =
Telefon / Android / Chrome =
Bağlantı ve hazır renkler =
Özel renk #804020 / gözlenen paketler / parlaklık =
Gri, beyaz, siyah / fiziksel sonuç =
Favori ekleme, yenileme, seçme ve kaldırma =
Güç / manuel parlaklık / ham HEX / yeniden bağlanma =
Gözlenen hatalar ve kullanıcı onayı =
```
