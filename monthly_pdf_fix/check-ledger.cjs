const {PGlite}=require('./pg-test/node_modules/@electric-sql/pglite');
const fs=require('node:fs'),a=require('node:assert/strict');
(async()=>{const db=new PGlite();try{
await db.exec('create role anon;create role authenticated;create role service_role bypassrls');
await db.exec(fs.readFileSync('supabase/migrations/202611140002_finance_ledger.sql','utf8'));
await db.exec("insert into luvipro_ledger.accounts(chart,code,label,category) values ('SKR03','1200','Bank','asset'),('SKR03','8400','Synthetic revenue','revenue');insert into luvipro_ledger.periods values ('2026-11-01',null),('2026-12-01',now())");
const post=(amount=1200,date='2026-11-14')=>db.query('select luvipro_ledger.post_entry($1,$2,$3)', ['00000000-0000-4000-8000-000000000001',JSON.stringify({source_kind:'fixture',source_id:'one',document_reference:'test-only',posting_date:date}),JSON.stringify([{account_id:1,debit_cents:1200,credit_cents:0},{account_id:2,debit_cents:0,credit_cents:amount}])]);
await db.exec('set role authenticated');await a.rejects(post(),{code:'42501'});
await db.exec('reset role;set role service_role');
await a.rejects(post(1199),/balance/);
await a.rejects(post(1200,'2026-12-14'),/period/);
await post();await a.rejects(post(),{code:'23505'});
await a.rejects(db.exec('delete from luvipro_ledger.lines'),{code:'42501'});
a.equal((await db.query('select sum(debit_cents-credit_cents)::int as balance from luvipro_ledger.lines')).rows[0].balance,0);
console.log('PASS: real isolated PostgreSQL posting, authorization, balance, closed period, duplicate and immutability checks');
}finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});

