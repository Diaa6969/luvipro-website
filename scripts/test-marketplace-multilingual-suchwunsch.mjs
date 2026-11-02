import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import ts from 'typescript';

const source=readFileSync(resolve('src/lib/marketplace/multilingual-search.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
assert.equal((compiled.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
const {interpretVehicleWish}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputText).toString('base64'));
const cases=[
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
];
for(const [name,query,expected] of cases){
 const actual=interpretVehicleWish(query).filters;
 for(const [k,v] of Object.entries(expected))assert.deepEqual(actual[k],v,name+' / '+k);
 assert.ok(!('accident_status' in actual),name+' / no unverified inspection claims');
}
assert.deepEqual(interpretVehicleWish('ما بدي سيارة فيها حوادث').filters,{});
assert.equal(interpretVehicleWish('  ').recognized.length,0);
console.log('Multilingual Suchwunsch: '+cases.length+' language and safety cases passed.');
