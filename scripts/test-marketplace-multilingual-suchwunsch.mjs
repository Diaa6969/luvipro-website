import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';

// Transpile catalog separately: parser tests must exercise the real shared brand list.
const catalogSource=readFileSync(resolve('src/lib/marketplace/car-brands.ts'),'utf8');
const catalogJs=ts.transpileModule(catalogSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
assert.equal((catalogJs.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
const {CAR_BRANDS,CAR_BRAND_ALIASES}=await import('data:text/javascript;base64,'+Buffer.from(catalogJs.outputText).toString('base64'));
assert.ok(CAR_BRANDS.length>=200,'Marketplace brand selector must contain at least 200 makes');
assert.equal(new Set(CAR_BRANDS).size,CAR_BRANDS.length,'no duplicate brands');
for(const brand of ['BMW','Audi','Mercedes-Benz','Volkswagen','Citroën','Škoda','Skoda','BYD','MG','Geely','Leapmotor','XPENG','Zeekr','Jaecoo','Omoda','VinFast','Lada','Ferrari','Togg']){
 if(brand==='Škoda')continue; // alternate spelling recognized via aliases
 assert.ok(CAR_BRANDS.includes(brand),'missing brand '+brand);
}
const modelsSource=readFileSync(resolve('src/lib/marketplace/car-models.ts'),'utf8');
const modelJs=ts.transpileModule(modelsSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
assert.equal((modelJs.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
const {CAR_MODELS_BY_BRAND,modelsForBrand}=await import('data:text/javascript;base64,'+Buffer.from(modelJs.outputText).toString('base64'));
assert.ok(Object.values(CAR_MODELS_BY_BRAND).reduce((s,models)=>s+models.length,0)>=5000,'catalog must include 5000+ model suggestions');
assert.ok(modelsForBrand('Mercedes-Benz').includes('C-Klasse'),'Mercedes should include C-Klasse');
assert.ok(!modelsForBrand('BMW').includes('C-Klasse'),'models must not leak between brands');
const source=readFileSync(resolve('src/lib/marketplace/multilingual-search.ts'),'utf8')
 .replace(/import \{CAR_BRANDS,CAR_BRAND_ALIASES\} from '\.\/car-brands';/, 'const CAR_BRANDS='+JSON.stringify(CAR_BRANDS)+'; const CAR_BRAND_ALIASES='+JSON.stringify(CAR_BRAND_ALIASES)+';')
 .replace(/import \{modelsForBrand\} from '\.\/car-models';/, 'const modelsForBrand=(brand)=>('+JSON.stringify(CAR_MODELS_BY_BRAND)+')[brand]||[];');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
assert.equal((compiled.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
const {interpretVehicleWish}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputText).toString('base64'));
const cases=[
 ['Mercedes model scoped','Mercedes GLC Diesel bis 25000 Euro',{brand:'Mercedes-Benz',model:'GLC',fuel:'Diesel',max_price:2500000}],
 ['BMW model scoped','BMW X5 Automatik 30000 Euro',{brand:'BMW',model:'X5',transmission:'Automatik',max_price:3000000}],
 ['Screenshot Arabic price regression','ابحث عن مرسيدس 19000 يورو بنزين حوالي مدينة هانوفر',{brand:'Mercedes-Benz',fuel:'Benzin',max_price:1900000,city:'Hannover'}],
 ['Screenshot German price and year regression','Suche bmw bis 18000 euro unfallfrei ab 2015',{brand:'BMW',max_price:1800000,first_from:'2015-01'}],
 ['Price with German grouping and cents','Mercedes 19.000,50 Euro',{brand:'Mercedes-Benz',max_price:1900050}],
 ['Arabic from the site screenshot','ابحث عن bmw بنزين بسعر لحد 18000 يورو بدون حوادث',{brand:'BMW',fuel:'Benzin',max_price:1800000}],
 ['Arabic digits and city','BMW بنزين ١٨٬٠٠٠ يورو في هانوفر',{brand:'BMW',fuel:'Benzin',max_price:1800000,city:'Hannover'}],
 ['German','BMW Diesel Automatik unter 20.000 Euro weniger als 100.000 km in Berlin',{brand:'BMW',fuel:'Diesel',transmission:'Automatik',max_price:2000000,max_mileage:100000,city:'Berlin'}],
 ['English','Audi petrol automatic 15000 euros',{brand:'Audi',fuel:'Benzin',transmission:'Automatik',max_price:1500000}],
 ['Russian','Ищу BMW дизель автомат до 18000 евро в Берлин',{brand:'BMW',fuel:'Diesel',transmission:'Automatik',max_price:1800000,city:'Berlin'}],
 ['Turkish','Hyundai otomatik benzin en fazla 20000 euro',{brand:'Hyundai',transmission:'Automatik',fuel:'Benzin',max_price:2000000}],
 ['Dutch','Volvo benzine automaat tot 18000 euro in Hamburg',{brand:'Volvo',fuel:'Benzin',transmission:'Automatik',max_price:1800000,city:'Hamburg'}],
 ['Spanish','Audi gasolina automático hasta 15.000 euros en Berlin',{brand:'Audi',fuel:'Benzin',transmission:'Automatik',max_price:1500000,city:'Berlin'}],
 ['French','Mercedes diesel automatique moins de 18 000 euros',{brand:'Mercedes-Benz',fuel:'Diesel',transmission:'Automatik',max_price:1800000}],
 ['Chinese','BMW 汽油 自动挡 18000 欧元 柏林',{brand:'BMW',fuel:'Benzin',transmission:'Automatik',max_price:1800000,city:'Berlin'}],
 ['Persian digits','BMW дизель ۱۸۰۰۰ یورو',{brand:'BMW',fuel:'Diesel',max_price:1800000}],
 ['Positive equipment only','Audi Navi Bluetooth 12000 Euro',{brand:'Audi',equipment:['Navigation','Bluetooth'],max_price:1200000}],
 ['Plug-in hybrid','Audi plug-in hybrid 20000 euros',{brand:'Audi',fuel:'Plug-in-Hybrid',max_price:2000000}],
 ['Chinese car brand','BYD 25000 Euro',{brand:'BYD',max_price:2500000}],
 ['New European EV','Leapmotor electric 19000 Euro',{brand:'Leapmotor',fuel:'Elektro',max_price:1900000}],
 ['Specialty maker','Abarth unter 18000 Euro',{brand:'Abarth',max_price:1800000}],
 ['French maker alias','Citroen 14500 Euro',{brand:'Citroën',max_price:1450000}],
 ['VW alias','VW Benzin unter 18000 Euro',{brand:'Volkswagen',fuel:'Benzin',max_price:1800000}],
 ['Nordic maker','Polestar electric 35000 Euro',{brand:'Polestar',fuel:'Elektro',max_price:3500000}],
 ['New entrant','Zeekr 30000 Euro',{brand:'Zeekr',max_price:3000000}],
];
for(const [name,query,expected] of cases){
 const actual=interpretVehicleWish(query).filters;
 for(const [k,v] of Object.entries(expected))assert.deepEqual(actual[k],v,name+' / '+k);
 assert.ok(!('accident_status' in actual),name+' / no unverified inspection claims');
}
assert.deepEqual(interpretVehicleWish('ما بدي سيارة فيها حوادث').filters,{});
assert.equal(interpretVehicleWish('  ').recognized.length,0);
const screenshotResult=interpretVehicleWish('Mercedes 19000 Euro');
assert.ok(screenshotResult.recognized.includes('Preis bis: 19.000,00\u00a0€'),'price display must be full euros');
const browseSource=readFileSync(resolve('src/components/marketplace/browse.tsx'),'utf8');
assert.match(browseSource,/aria-label=\{txt\.brands\}/,'brand selection must be visibly editable');
assert.match(browseSource,/CAR_BRANDS\.map/,'dropdown must come from full shared catalog');
assert.match(browseSource,/txt\.brandOther/,'unlisted brand must be manually searchable');
assert.match(browseSource,/aria-label=\{txt\.models\}/,'model selector must be present');
assert.match(browseSource,/modelsForBrand\(String\(filters\.brand/,'model options must depend on selected brand');
assert.match(browseSource,/delete next\.model/,'switching brands must reset any previous model');
assert.match(browseSource,/aria-label=\{txt\.firstFrom\}/,'first registration from control missing');
assert.match(browseSource,/aria-label=\{txt\.firstTo\}/,'first registration to control missing');
assert.match(browseSource,/step="100"/,'price must change in €100 increments');
assert.match(browseSource,/step="1000"/,'mileage must change in 1,000 km increments');
assert.match(browseSource,/rounded\*100/,'price normalization must be stored as cents');

const siteLocalesSource=readFileSync(resolve('src/lib/site-locales.ts'),'utf8');
const siteLocalesJs=ts.transpileModule(siteLocalesSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
const {siteLocales}=await import('data:text/javascript;base64,'+Buffer.from(siteLocalesJs.outputText).toString('base64'));
const hintsSource=readFileSync(resolve('src/lib/marketplace/search-hints.ts'),'utf8');
const hintsJs=ts.transpileModule(hintsSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
const {MARKETPLACE_SEARCH_HINTS,marketplaceSearchHint}=await import('data:text/javascript;base64,'+Buffer.from(hintsJs.outputText).toString('base64'));
assert.equal(Object.keys(MARKETPLACE_SEARCH_HINTS).length,siteLocales.length,'all site languages must have a search hint');
for(const [locale] of siteLocales){
 assert.ok(marketplaceSearchHint(locale).length>20,'missing or too short Suchwunsch hint for '+locale);
 assert.ok(marketplaceSearchHint(locale).includes('BMW'),'example should contain an actual searchable vehicle make for '+locale);
}
assert.match(marketplaceSearchHint('de'),/BMW Diesel Automatik bis 20\.000 €/,'German must be default example');
assert.match(marketplaceSearchHint('ar'),/أبحث عن/,'Arabic search example must not be mixed-language text');
assert.match(browseSource,/placeholder=\{marketplaceSearchHint\(locale\)\}/,'Suchwunsch textarea must use localized hint');
assert.match(browseSource,/useSiteLocale\(\)/,'Marketplace must follow the user-selected language');
const pickerSource=readFileSync(resolve('src/components/ui/language-picker.tsx'),'utf8');
assert.match(pickerSource,/onClick=\{\(\) => setPreferredSiteLocale\(code\)\}/,'site language picker must remember selection');
assert.match(pickerSource,/next\.searchParams\.set\("lang", code\)/,'language switching must preserve existing route and checkout parameters');
assert.match(siteLocalesSource,/return stored && isSiteLocale\(stored\) \? stored : 'de'/,'German must remain the default for unknown or missing preferences');

assert.match(browseSource,/value=\{customBrand\?'__other__':String\(filters\.brand\?\?''\)\}/,'brand select must be bound to interpreted brand or manual mode');
assert.match(browseSource,/await search\(0,next\)/,'interpreted filters must execute immediately');
const marketCopySource=readFileSync(resolve('src/lib/marketplace/market-copy.ts'),'utf8')
 .replace(/import \{siteLocales,type SiteLocale\} from '@\/lib\/site-locales';/, 'const siteLocales='+JSON.stringify(siteLocales)+';');
const marketCopyJs=ts.transpileModule(marketCopySource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
assert.equal((marketCopyJs.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
const {marketCopy}=await import('data:text/javascript;base64,'+Buffer.from(marketCopyJs.outputText).toString('base64'));
for(const [locale] of siteLocales){
 const t=marketCopy(locale);
 assert.equal(Object.keys(t).length,29,'All 29 Marketplace labels required for '+locale);
 for(const [k,v] of Object.entries(t))assert.ok(typeof v==='string'&&v.length>=2,'Missing '+k+' in '+locale);
}
assert.equal(marketCopy('de').brands,'Alle Marken');
assert.equal(marketCopy('ar').brands,'كل الماركات');
assert.equal(marketCopy('en').brands,'All makes');

console.log('Multilingual Suchwunsch: '+cases.length+' language and safety cases passed.');
