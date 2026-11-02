/** Public, no-cost multilingual filter extraction. Does not read inspection reports. */
export type SearchFilters = Record<string,string|number|string[]>;
export type SearchInterpretation = {filters:SearchFilters;recognized:string[];notice:string};
const eastern='٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹';
export function normalizeVehicleWish(value:string):string {
 return value.normalize('NFKC').replace(/[٠-٩۰-۹]/g,c=>String(eastern.indexOf(c)%10))
  .normalize('NFD').replace(/[̀-ًͯ-ٟ]/g,'')
  .toLocaleLowerCase('und').replace(/ـ/g,'').replace(/[‌-‏‪-‮]/g,' ')
  .replace(/٬/g,',').replace(/\s+/g,' ').trim();
}
const escaped=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+');
const contains=(t:string,words:readonly string[])=>words.some(x=>new RegExp('(?<![\\p{L}\\p{N}])'+escaped(normalizeVehicleWish(x))+'(?![\\p{L}\\p{N}])','u').test(t));
const BRAND:Record<string,string[]>={
 BMW:['bmw','بي ام دبليو','بيم','бмв','宝马'],
 Audi:['audi','اودي','أودي','ауди','奥迪'],
 Volkswagen:['volkswagen','vw','فولكس فاغن','فولكسفاغن','фольксваген','大众'],
 'Mercedes-Benz':['mercedes','mercedes-benz','مرسيدس','мерседес','奔驰'],
 Opel:['opel','اوبل','опель'],Ford:['ford','فورد','форд','福特'],
 Toyota:['toyota','تويوتا','тойота','丰田'],Skoda:['skoda','škoda','سكودا','шкода'],
 Seat:['seat','سيات','сеат'],Volvo:['volvo','فولفو','вольво'],
 Porsche:['porsche','بورش','порше','保时捷'],Renault:['renault','رينو','рено'],
 Peugeot:['peugeot','بيجو','пежо'],Hyundai:['hyundai','هيونداي','хендай'],
 Kia:['kia','كيا','киа'],Tesla:['tesla','تسلا','тесла'],
 Honda:['honda','هوندا','хонда'],Nissan:['nissan','نيسان','ниссан'],
 Mazda:['mazda','مازدا','мазда'],Fiat:['fiat','فيات','фиат'],Dacia:['dacia','داسيا'],Mini:['mini','ميني']};
const FUEL:Record<string,string[]>={
 'Plug-in-Hybrid':['plug-in hybrid','plug in hybrid','phev','هجين قابل للشحن','插电混动'],
 Benzin:['benzin','benzine','benzina','benzyna','gasolina','gasoline','petrol','essence','bensin','bensiini','benzină','بنزين','بترول','بنزین','бензин','βενζινη','汽油','ガソリン','휘발유','पेट्रोल'],
 Diesel:['diesel','gasoil','gazole','gasóleo','gasoleo','nafta','olej napedowy','olej napędowy','дизель','дизел','ديزل','مازوت','دیزل','πετρελαιο','柴油','ディーゼル','디젤','डीजल'],
 Elektro:['electric','elektrisch','elektro','electrique','électrique','electrico','eléctrico','elettrico','elektrikli','elektrisk','elektryczny','электро','электрический','كهربائي','برقی',' ηλεκτρικο','电动','電気','전기','इलेक्ट्रिक'],
 Hybrid:['hybrid','hybride','hibrido','híbrido','ibrida','hibrid','гибрид','هجين','هايبرد','هیبرید','υβριδικο','混动','ハイブリッド','하이브리드','हाइब्रिड'],
 LPG:['lpg','autogas','gpl'],CNG:['cng','erdgas','gnv']};
const TRANSMISSION:Record<string,string[]>={
 Automatik:['automatik','automatic','automatique','automatica','automático','automatico','otomatik','automatisch','automat','automaat','automatisk','automatyczna','автомат','автоматическая','أوتوماتيك','اوتوماتيك','اتوماتيك','اتومات','خودکار','αυτοματο','自动挡','オートマ','자동','ऑटोमैटिक'],
 Schaltgetriebe:['manual','manuell','manuale','manuel','handgeschakeld','schaltgetriebe','механика','механическая','يدوي','دنده دستی','χειροκινητο','手动挡','マニュアル','수동','मैनुअल']};
const EQUIPMENT:Record<string,string[]>={
 Navigation:['navigation','navi','navigator','gps','ملاحة','نافي','навигация','导航'],
 Sitzheizung:['sitzheizung','heated seats','sièges chauffants','مقاعد مدفأة','تدفئة مقاعد','подогрев сидений','座椅加热'],
 Rückfahrkamera:['rückfahrkamera','rueckfahrkamera','rear camera','backup camera','camera recul','كاميرا خلفية','камера заднего вида','倒车影像'],
 Klimaanlage:['klimaanlage','air conditioning','climatisation','aire acondicionado','تكييف','مكيف','кондиционер','空调'],
 Bluetooth:['bluetooth','بلوتوث','блютуз','蓝牙'],
 'Apple CarPlay':['carplay','apple carplay'],'Android Auto':['android auto'],
 Anhängerkupplung:['anhängerkupplung','anhaengerkupplung','tow bar','trailer hitch','خطاف سحب','фаркоп'],
 Panoramadach:['panoramadach','panoramic roof','panorama roof','سقف بانوراما','панорамная крыша']};
const CITY:Record<string,string[]>={
 Hannover:['hannover','hanover','هانوفر','ганновер'],
 Berlin:['berlin','برلين','берлин','柏林'],
 Hamburg:['hamburg','هامبورغ','هامبورج','гамбург','汉堡'],
 München:['münchen','munchen','munich','ميونخ','мюнхен','慕尼黑'],
 Köln:['köln','koln','cologne','كولن','كولونيا','кельн'],
 Frankfurt:['frankfurt','فرانكفورت','франкфурт'],
 Düsseldorf:['düsseldorf','dusseldorf','دوسلدورف','дюссельдорф'],
 Stuttgart:['stuttgart','شتوتغارت','штутгарт'],
 Bremen:['bremen','بريمن','бремен'],
 Leipzig:['leipzig','لايبزيغ','лейпциг'],
 Dresden:['dresden','دريسدن','дрезден'],
 Dortmund:['dortmund','دورتموند','дортмунд'],
 Essen:['essen','إيسن','اسن','эссен'],
 Nürnberg:['nürnberg','nurnberg','nuremberg','نورنبيرغ','нюрнберг']};
const PRICE_UNITS=['€','eur','euro','euros','يورو','یورو','евро','ευρω','欧元','ユーロ','유로','यूरो'];
const KM_UNITS=['km','kms','kilometer','kilometre','kilometres','kilometers','kilometros','kilómetros','كيلومتر','كيلو متر','كيلو','км','километров','χλμ','公里','キロ','킬로미터','किमी'];
const NUMBER='(?:[0-9]{1,3}(?:[. ,\\u00a0\\u202f][0-9]{3})+|[0-9]{1,9})(?:[.,][0-9]{1,2})?';
function amount(t:string,units:string[],max:number):number|null{
 const u=units.map(escaped).join('|');
 const re=new RegExp('('+NUMBER+')\\s*(?:'+u+')(?![\\p{L}])|(?:'+u+')\\s*('+NUMBER+')','giu');
 for(const m of t.matchAll(re)){
  const raw=(m[1]||m[2]).replace(/[\\s\\u00a0\\u202f]/g,'').replace(/(?<=\\d)[.,](?=\\d{3}(?:\\D|$))/g,'').replace(',','.');
  const n=Number(raw);
  if(Number.isFinite(n)&&n>0&&n<=max)return n;
 }
 return null;
}
function negated(t:string,word:string):boolean{
 const i=t.indexOf(normalizeVehicleWish(word));if(i<0)return false;
 return /(?:^|\\s)(?:without|not|no|ohne|kein|keine|nicht|sans|sin|senza|без|не|بدون|بلا|غير|niet|geen|ikke|inte|uden)\\s*$/u.test(t.slice(Math.max(0,i-25),i));
}
function matchOne(t:string,map:Record<string,string[]>):string|undefined {
 return Object.entries(map).find(([,aliases])=>aliases.some(a=>contains(t,[a])&&!negated(t,a)))?.[0];
}
/** Returns canonical backend filters; ambiguous words and accident claims are ignored. */
export function interpretVehicleWish(raw:string):SearchInterpretation {
 const t=normalizeVehicleWish(raw.slice(0,1000));const filters:SearchFilters={};
 if(t.length<3)return {filters,recognized:[],notice:'Mindestens 3 Zeichen eingeben. / اكتب ثلاثة أحرف على الأقل.'};
 const brand=matchOne(t,BRAND);if(brand)filters.brand=brand;
 const fuel=matchOne(t,FUEL);if(fuel)filters.fuel=fuel;
 const gearbox=matchOne(t,TRANSMISSION);if(gearbox)filters.transmission=gearbox;
 const price=amount(t,PRICE_UNITS,100000000);if(price!==null)filters.max_price=Math.round(price*100);
 const mileage=amount(t,KM_UNITS,10000000);if(mileage!==null)filters.max_mileage=Math.round(mileage);
 const year=t.match(/(?<![0-9])(?:19[8-9][0-9]|20[0-3][0-9])(?![0-9])/u)?.[0];
 if(year&&contains(t,['ab','seit','from','after','newer than','a partir de','depuis','desde','dal','от','من سنة','موديل من','بعد','أحدث من','احدث من','سنة'])&&!contains(t,['before','vor','bis','قبل','до']))filters.first_from=year+'-01';
 const city=matchOne(t,CITY);if(city)filters.city=city;
 const features=Object.entries(EQUIPMENT).filter(([,aliases])=>aliases.some(a=>contains(t,[a])&&!negated(t,a))).map(([name])=>name);
 if(features.length)filters.equipment=features;
 const recognized=Object.entries(filters).map(([k,v])=>k+': '+(Array.isArray(v)?v.join(', '):v));
 return {filters,recognized,notice:recognized.length
  ? 'Mehrsprachige Filter angewendet. Bitte Ergebnisse und Filter prüfen. / تم تنفيذ البحث وفق الشروط المعروفة؛ راجع النتائج.'
  : 'Keine eindeutigen Fahrzeugfilter erkannt. Bitte Suchbegriffe oder die manuellen Filter ergänzen. / تعذّر فهم الشروط؛ استخدم الفلاتر اليدوية.'};
}
