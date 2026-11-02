import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const module={exports:{}};
vm.runInNewContext(ts.transpileModule(readFileSync('src/lib/marketplace-price.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,BigInt},{timeout:1000});
const parse=module.exports.marketplacePriceCents;
let checks=0;
for(const [input,result] of [['13,49','1349'],['2699.99','269999'],['0.01','1'],['999999999,99','99999999999'],[' 12000 ','1200000']]){assert.equal(parse(input),result);checks++;}
for(const input of ['','0','-5','1,234','20.000,00','NaN','Infinity','1e5','1000000000']){assert.throws(()=>parse(input));checks++;}
console.log(`${checks} exact-price cases passed; no API, payment or production data used.`);
