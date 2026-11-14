const {PGlite}=require('./pg-test/node_modules/@electric-sql/pglite');
const fs=require('node:fs'),a=require('node:assert/strict');
(async()=>{const db=new PGlite();try{
await db.exec('create role anon;create role authenticated;create role service_role bypassrls');
await db.exec(fs.readFileSync('supabase/migrations/202611140002_finance_ledger.sql','utf8'));
await db.exec(fs.readFileSync('supabase/migrations/202611140003_finance_ledger_reporting.sql','utf8'));
await db.exec("insert into luvipro_ledger.accounts(chart,code,label,category) values ('SKR03','1200','Bank','asset'),('SKR03','8400','Synthetic revenue','revenue');insert into luvipro_ledger.periods values ('2026-11-01',null),('2026-12-01',now())");
const post=(amount=1200,date='2026-11-14')=>db.query('select luvipro_ledger.post_entry($1,$2,$3)', ['00000000-0000-4000-8000-000000000001',JSON.stringify({source_kind:'fixture',source_id:'one',document_reference:'test-only',posting_date:date}),JSON.stringify([{account_id:1,debit_cents:1200,credit_cents:0},{account_id:2,debit_cents:0,credit_cents:amount}])]);
await db.exec(fs.readFileSync('supabase/migrations/202611140004_finance_company_versions.sql','utf8')); const company=(version,extras={})=>db.query('select luvipro_ledger.save_company_version($1,$2,$3)',['00000000-0000-4000-8000-000000000001',version,JSON.stringify({legal_name:'Synthetic GmbH',legal_form:'GmbH',chart:'SKR03',registered_address:'Fixture address',...extras})]); await db.exec('set role authenticated');await a.rejects(company(0),{code:'42501'});await a.rejects(post(),{code:'42501'});
await db.exec('reset role;set role service_role');
await a.rejects(post(1199),/balance/);
await a.rejects(post(1200,'2026-12-14'),/period/);
await post();await a.rejects(post(),{code:'23505'});
await a.rejects(db.exec('delete from luvipro_ledger.lines'),{code:'42501'});
a.equal((await db.query('select sum(debit_cents-credit_cents)::int as balance from luvipro_ledger.lines')).rows[0].balance,0);
const reverse=()=>db.query("select luvipro_ledger.reverse_entry($1,1,'2026-11-20','Synthetic correction')",['00000000-0000-4000-8000-000000000001']);
const before=(await db.query("select debit_balance_cents from luvipro_ledger.monthly_turnover where category='revenue'")).rows[0];
a.equal(Number(before.debit_balance_cents),-1200);
await reverse();await a.rejects(company(0,{activate:true}),/Invalid company/);await company(0);await a.rejects(company(0),{code:'40001'});await company(1,{legal_name:'Synthetic new version'});a.equal((await db.query('select version from luvipro_ledger.company_versions')).rows.length,2);
await a.rejects(reverse(),{code:'23505'});
const rows=(await db.query('select * from luvipro_ledger.monthly_turnover')).rows;
a.equal(rows.length,2);
a.ok(rows.every(row=>Number(row.debit_balance_cents)===0));
console.log('PASS: real isolated PostgreSQL posting, authorization, balance, closed period, duplicate and immutability checks');
}finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});




