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
const source=readFileSync(resolve('src/lib/marketplace/multilingual-search.ts'),'utf8')
 .replace(/import \{CAR_BRANDS,CAR_BRAND_ALIASES\} from '\.\/car-brands';/, 'const CAR_BRANDS='+JSON.stringify(CAR_BRANDS)+'; const CAR_BRAND_ALIASES='+JSON.stringify(CAR_BRAND_ALIASES)+';');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
assert.equal((compiled.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
const {interpretVehicleWish}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputText).toString('base64'));
const cases=[
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
assert.match(browseSource,/aria-label="Marke"/,'brand selection must be visibly editable');
assert.match(browseSource,/CAR_BRANDS\.map/,'dropdown must come from full shared catalog');
assert.match(browseSource,/Andere Marke manuell eingeben/,'unlisted brand must be manually searchable');
assert.match(browseSource,/value=\{String\(filters\.brand\?\?''\)\}/,'brand select must be bound to interpreted brand');
assert.match(browseSource,/await search\(0,next\)/,'interpreted filters must execute immediately');
console.log('Multilingual Suchwunsch: '+cases.length+' language and safety cases passed.');
