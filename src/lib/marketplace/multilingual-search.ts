/** Public, no-cost multilingual filter extraction. Does not read inspection reports. */
import {CAR_BRANDS,CAR_BRAND_ALIASES} from './car-brands';
import {modelsForBrand} from './car-models';

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
// Shared make list powers BOTH the selection field and natural-language wishes.
// Preserve existing Arabic/Russian/Chinese synonyms while recognizing every known make.
const ALL_BRANDS:Record<string,string[]> = Object.fromEntries(
 CAR_BRANDS.map(brand=>[brand,[brand,...(BRAND[brand]||[]),...(CAR_BRAND_ALIASES[brand]||[])]])
);
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
// Use the full integer token. Never strip the digit 0 (e.g. 19000 → 19).
const NUMBER='[0-9]+(?:[., \\u00a0\\u202f][0-9]+)*';
function parseNumeric(raw:string):number|null{
 const compact=raw.replace(/[\s\u00a0\u202f]/g,'');
 // Thousands grouping: 19.000 / 19,000; decimals: 19.000,50 / 19,000.50.
 const tail=compact.match(/[.,]([0-9]{1,2})$/);
 const integer=tail?compact.slice(0,-tail[0].length):compact;
 const normalized=integer.replace(/[.,]/g,'')+(tail?'.'+tail[1]:'');
 const n=Number(normalized);
 return Number.isFinite(n)&&n>0?n:null;
}
function amount(t:string,units:string[],max:number):number|null{
 const u=units.map(escaped).join('|');
 const re=new RegExp('(?<![0-9])('+NUMBER+')\\s*(?:'+u+')(?![\\p{L}\\p{N}])|(?:'+u+')\\s*('+NUMBER+')(?![0-9])','giu');
 for(const m of t.matchAll(re)){
  const n=parseNumeric(m[1]||m[2]);
  if(n!==null&&n<=max)return n;
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
 const brand=matchOne(t,ALL_BRANDS);if(brand)filters.brand=brand;

 // Model suggestions are scoped STRICTLY to the already-detected manufacturer.
 // The list contains nameplates, not technical specs or inspection findings.
 if(brand){
  const model=modelsForBrand(brand)
   .filter(name=>name.length>=2 && (name.length>=3 || /[0-9]/.test(name)))
   .sort((a,b)=>b.length-a.length)
   .find(name=>contains(t,[name])||contains(t,[name.replace(/[-_.]/g,' ')]));
  if(model)filters.model=model;
 }
 const fuel=matchOne(t,FUEL);if(fuel)filters.fuel=fuel;
 const gearbox=matchOne(t,TRANSMISSION);if(gearbox)filters.transmission=gearbox;
 const price=amount(t,PRICE_UNITS,100000000);if(price!==null)filters.max_price=Math.round(price*100);
 const mileage=amount(t,KM_UNITS,10000000);if(mileage!==null)filters.max_mileage=Math.round(mileage);
 // Require a year-specific phrase: unrelated "bis 18.000 Euro" must not suppress "ab 2015".
 const years=[...t.matchAll(/(?<![0-9])(?:19[8-9][0-9]|20[0-3][0-9])(?![0-9])/gu)];
 for(const y of years){
  const before=t.slice(Math.max(0,(y.index??0)-45),y.index).trim();
  if(/(?:^|\s)(?:ab|seit|from|after|newer than|desde|depuis|dal|от|после|منذ|بعد|من|موديل|موديل من)\s*$/u.test(before)){
   filters.first_from=y[0]+'-01';break;
  }
 }
 const city=matchOne(t,CITY);if(city)filters.city=city;
 const features=Object.entries(EQUIPMENT).filter(([,aliases])=>aliases.some(a=>contains(t,[a])&&!negated(t,a))).map(([name])=>name);
 if(features.length)filters.equipment=features;
 const labels:Record<string,string>={brand:'Marke',model:'Modell',fuel:'Kraftstoff',transmission:'Getriebe',max_price:'Preis bis',max_mileage:'Kilometer bis',city:'Ort',first_from:'Erstzulassung ab',equipment:'Ausstattung'};
 const recognized=Object.entries(filters).map(([k,v])=>{const value=k==='max_price'?new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(v)/100):k==='first_from'?String(v).slice(0,4):Array.isArray(v)?v.join(', '):String(v);return (labels[k]||k)+': '+value;});
 const accidentRequested=/(?:unfallfrei|ohne unf[aä]ll?e?|without accidents?|accident.free|sin accidentes|بدون حوادث|بلا حوادث|بدون حادث|sans accident|без дтп)/u.test(t);
 const caveat=accidentRequested?' Unfallfreiheit wird nicht automatisch als Filter behauptet. / لا يمكن ضمان خلو السيارة من الحوادث من البحث وحده.':'';
 return {filters,recognized,notice:recognized.length
  ? 'Mehrsprachige Filter angewendet. Bitte Ergebnisse und Filter prüfen. / تم تنفيذ البحث وفق الشروط المعروفة؛ راجع النتائج.'+caveat
  : 'Keine eindeutigen Fahrzeugfilter erkannt. Bitte Suchbegriffe oder die manuellen Filter ergänzen. / تعذّر فهم الشروط؛ استخدم الفلاتر اليدوية.'};
}
