from pathlib import Path
import subprocess,uuid,re,json
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1]
import os,tempfile,shutil
OUT=Path(tempfile.mkdtemp(prefix='luvipro_checkout_test_'))
tag=uuid.uuid4().hex[:10];db='luvipro_sec_test_aff_'+tag
roles={r:'luvipro_sec_test_'+r+'_'+tag for r in ['anon','authenticated','service_role']}
psql=os.environ.get('LUVIPRO_PSQL') or shutil.which('psql') or r'C:\Program Files\PostgreSQL\17\bin\psql.exe'
checks=[]
database_created=False
created_roles=[]
def sql(q,database=None,fail=False):
 p=subprocess.run([psql,'-X','-w','-h','127.0.0.1','-U','postgres','-d',database or db,'-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose','-At'],input=q,text=True,capture_output=True)
 if fail:
  assert p.returncode!=0,p.stdout
  return p.stderr
 if p.returncode:raise RuntimeError(p.stderr)
 return p.stdout.strip()
admin='11111111-1111-4111-8111-111111111111';one='22222222-2222-4222-8222-222222222222';two='33333333-3333-4333-8333-333333333333'
def as_user(uid,q,fail=False):return sql(f"SET ROLE {roles['authenticated']}; SELECT set_config('request.jwt.claim.sub','{uid}',false); "+q,fail=fail)
def ok(name):checks.append(name)
try:
 for k,v in roles.items():
  sql('CREATE ROLE '+v+' NOLOGIN'+(' BYPASSRLS' if k=='service_role' else ''),database='postgres');created_roles.append(v)
 sql('CREATE DATABASE '+db,database='postgres');database_created=True
 sql(f'''CREATE SCHEMA auth;CREATE SCHEMA storage;
 CREATE TABLE auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);CREATE TABLE public.users(id uuid primary key,role text); CREATE TABLE public.partner_verifications(user_id uuid,status text);
 CREATE TABLE storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 CREATE TABLE storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb,owner_id text);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$SELECT EXISTS(SELECT 1 FROM public.users WHERE id=auth.uid() AND role='admin')$$;
 GRANT USAGE ON SCHEMA auth TO {roles['authenticated']},{roles['service_role']};GRANT SELECT ON auth.users TO {roles['service_role']};
 INSERT INTO auth.users(id,email,email_confirmed_at) VALUES('{admin}','admin@example.invalid',now()),('{one}','one@example.invalid',now()),('{two}','two@example.invalid',now());
 INSERT INTO public.users VALUES('{admin}','admin'),('{one}','User'),('{two}','Partner');''')
 files=['invoicing-schema.sql','affiliate-accounting-extension.sql','affiliate-code-controls.sql','affiliate-agb-acceptance.sql','bookkeeping-extension.sql','affiliate-manual-settlements.sql','affiliate-payment-reminders.sql','affiliate-flutter-admin.sql','affiliate-account-access.sql','affiliate-program-management.sql','bank-transfer-orders.sql','affiliate-promo-engine.sql']
 for f in files:
  q=(ROOT/'docs/sql'/f).read_text(encoding='utf-8-sig')
  for k,v in roles.items():q=re.sub(r'\b'+k+r'\b',v,q)
  sql(q);ok('migration applied: '+f)
 def affiliate(uid,n):return sql(f"INSERT INTO public.luvipro_affiliate_applications(owner_uid,company_name,contact_name,email,business_address,registration_path,status,legal_agb_version,legal_agb_accepted_at,individual_agreement_ref,individual_agreement_accepted_at) VALUES('{uid}','SYNTHETIC {n}','TEST','test{n}@example.invalid','Teststrasse 1','synthetic/{n}.pdf','approved','2026-10-29',now(),'SYNTHETIC_SIGNED_{n}',now()) RETURNING id;").splitlines()[0]
 # Promo engine tests only; previous finance checks are not rerun.
 def js(v):return "'"+json.dumps(v).replace("'","''")+"'::jsonb"
 def quote(uid,product='device',code='',quantity=1):
  return json.loads(as_user(uid,f"SELECT public.luvipro_promo_quote_v1('{product}',{quantity},'{code}')").splitlines()[-1])

 sql("ALTER TABLE public.partner_verifications ADD COLUMN id uuid DEFAULT gen_random_uuid(),ADD COLUMN show_on_map boolean DEFAULT true; CREATE TABLE public.partner_locations(id uuid DEFAULT gen_random_uuid(),partner_verification_id uuid,partner_user_id uuid,company_name text,city text,postal_code text,is_active boolean,accepts_inspection_requests boolean);")
 sql(f"INSERT INTO public.partner_verifications(user_id,status) VALUES('{two}','approved');INSERT INTO public.partner_locations(partner_verification_id,partner_user_id,company_name,city,postal_code,is_active,accepts_inspection_requests) SELECT id,user_id,'SYNTHETIC WORKSHOP','TESTCITY','12345',true,true FROM public.partner_verifications WHERE user_id='{two}'")
 new=(ROOT/'supabase/migrations/20261030193919_affiliate_checkout_completion_v1.sql').read_text(encoding='utf-8')
 for k,v in roles.items():new=re.sub(r'\b'+k+r'\b',v,new)
 sql(new);ok('new checkout migration applied against existing finance schema')
 settings={'code':'CHECKOUT10','code_type':'both','terms_reference':'SYNTHETIC reviewed terms','evidence_checked':True,'valid_from':'2020-01-01','valid_until':'2099-01-01','active':True}
 rules=[{'product_kind':p,'discount_kind':'percent','discount_bps':1000,'commission_bps':0} for p in ['device','inspection_standard','inspection_premium']]
 code=as_user(admin,f"SELECT public.luvipro_promo_admin_save_v1(NULL,NULL,{js(settings)},{js(rules)})").splitlines()[-1]
 billing={'company':'SYNTHETIC CUSTOMER','contact':'SYNTHETIC CONTACT','address':'SYNTHETIC 123','postal_code':'12345','city':'TESTCITY','terms_accepted':True,'privacy_accepted':True}
 def cq(uid,p='device',code='CHECKOUT10',partner='NULL'):
  return json.loads(as_user(uid,f"SELECT public.luvipro_promo_quote_v1('{p}',1,'{code}',{partner})").splitlines()[-1])
 def create(uid,q,key=None,b=billing,fail=False):
  return as_user(uid,f"SELECT public.luvipro_checkout_order_v1('{q['quote_id']}','{key or uuid.uuid4()}',{js(b)})",fail).splitlines()[-1]
 partners=json.loads(as_user(one,'SELECT public.luvipro_checkout_partners_v1()').splitlines()[-1]);assert partners['items'][0]['partner_user_id']==two;ok('only approved active public workshops returned')
 sql('SET ROLE '+roles['anon']+";SELECT public.luvipro_checkout_order_v1(gen_random_uuid(),gen_random_uuid(),'{}')",fail=True);ok('anonymous checkout denied')
 aq=cq(one,'inspection_standard',partner="'"+two+"'");sql('UPDATE public.partner_locations SET is_active=false');create(one,aq,fail=True);sql('UPDATE public.partner_locations SET is_active=true');ok('inactive workshop rejected at order time even with an earlier quote')
 q=cq(one);as_user(two,f"SELECT public.luvipro_checkout_order_v1('{q['quote_id']}',gen_random_uuid(),{js(billing)})",True);ok('cross-customer quote cannot create order')
 key=str(uuid.uuid4());o=json.loads(create(one,q,key));assert o['payment_initiated']==False and o['status']=='pending';ok('device order created without initiating payment')
 assert json.loads(create(one,q,key))['reused'];ok('same customer request remains idempotent')
 create(one,q,fail=True);ok('duplicate quote redemption blocked')
 history=json.loads(as_user(one,'SELECT public.luvipro_checkout_history_v1()').splitlines()[-1]);assert history['total']==1 and history['items'][0]['gross_cents']=='324869';ok('owner history matches trusted discounted device amount')
 assert json.loads(as_user(two,'SELECT public.luvipro_checkout_history_v1()').splitlines()[-1])['total']==0;ok('other customer cannot read order history')
 assert 'commission_bps' not in str(history);ok('customer history excludes private Affiliate agreement')
 for product,gross in [('inspection_standard','5399'),('inspection_premium','10799')]:
  q=cq(one,product);create(one,q,fail=True);ok(product+' requires selected approved workshop')
  q=cq(one,product,partner="'"+two+"'");order=json.loads(create(one,q));amount=sql(f"SELECT gross_cents FROM public.luvipro_bank_orders WHERE id='{order['order_id']}'");assert amount==gross,(product,amount);ok(product+' checkout uses server discount and VAT')
 q=cq(one);create(one,q,b=dict(billing,terms_accepted=False),fail=True);ok('unchecked order terms cannot reserve a code')
 as_user(two,f"SELECT public.luvipro_checkout_cancel_v1('{o['order_id']}','SYNTHETIC cancellation')",True);ok('another customer cannot cancel order')
 before=sql(f"SELECT redemption_count FROM public.luvipro_discount_codes WHERE id='{code}'")
 as_user(one,f"SELECT public.luvipro_checkout_cancel_v1('{o['order_id']}','SYNTHETIC cancellation')");as_user(one,f"SELECT public.luvipro_checkout_cancel_v1('{o['order_id']}','SYNTHETIC cancellation')")
 assert int(sql(f"SELECT redemption_count FROM public.luvipro_discount_codes WHERE id='{code}'"))==int(before)-1;ok('owner cancellation releases quota exactly once and preserves record')
 q=cq(two);paid=json.loads(create(two,q));pid=paid['order_id']
 as_user(admin,f"SELECT public.luvipro_promo_confirm_customer_payment_v1('{pid}',current_date-1,'SYNTHETIC_RECEIPT_1',true,true)")
 as_user(two,f"SELECT public.luvipro_checkout_cancel_v1('{pid}','SYNTHETIC cancellation')",True);ok('customer cannot cancel a paid order')
 args=f"'{pid}',current_date,'SYNTHETIC_REFUND_1','SYNTHETIC full external refund'"
 as_user(one,f"SELECT public.luvipro_checkout_refund_v1({args},true)",True);ok('customer cannot assert bank refund')
 as_user(admin,f"SELECT public.luvipro_checkout_refund_v1({args},false)",True);ok('refund requires actual external confirmation flag')
 as_user(admin,f"SELECT public.luvipro_checkout_refund_v1({args},true)");ok('Admin records synthetic full refund without transfer API')
 assert sql(f"SELECT status FROM public.luvipro_promo_redemptions WHERE order_id='{pid}'")=='refunded';ok('refund keeps immutable redemption history consumed')
 as_user(admin,f"SELECT public.luvipro_checkout_refund_v1({args},true)",True);ok('duplicate refund denied')
 as_user(one,'SELECT * FROM public.luvipro_order_refunds',True);ok('private refund banking references denied to ordinary users')
 a=affiliate(one,9);sql(f"UPDATE public.luvipro_affiliate_applications SET registration_verified_at=now() WHERE id='{a}'")
 acode=as_user(admin,f"SELECT public.luvipro_promo_admin_save_v1(NULL,NULL,{js(dict(settings,code='AFFCHECK',affiliate_id=a,code_type='device'))},{js([dict(product_kind='device',discount_kind='percent',discount_bps=1000,commission_bps=1000,settlement_delay_days=15)])})").splitlines()[-1]
 for allocated in [False,True]:
  aq=cq(two,code='AFFCHECK');ao=json.loads(create(two,aq));aid=ao['order_id']
  as_user(admin,f"SELECT public.luvipro_promo_confirm_customer_payment_v1('{aid}',current_date-90,'SYNTHETIC_PAST_{allocated}',true,true)")
  as_user(admin,f"SELECT public.luvipro_promo_fulfill_v1('{aid}',now()-interval '89 days',now()-interval '60 days','SYNTHETIC delivery',true);SELECT public.luvipro_promo_accrue_v1('{aid}')")
  if allocated:
   sql(f"SET ROLE {roles['service_role']};SELECT public.luvipro_affiliate_prepare_manual_payout('{a}',(date_trunc('month',now())-interval '1 month')::date,'{admin}')")
   as_user(admin,f"SELECT public.luvipro_checkout_refund_v1('{aid}',current_date,'SYNTHETIC_REFUND_ALLOCATED','SYNTHETIC refund evidence',true)",True)
   assert sql(f"SELECT refunded_at IS NULL FROM public.luvipro_bank_orders WHERE id='{aid}'")=='t';ok('allocated settlement blocks automatic reversal without changing paid history')
  else:
   amount=sql(f"SELECT commission_cents FROM public.luvipro_affiliate_commissions WHERE source_order_id='{aid}'");assert amount=='27000';ok('shared commission remains TOTAL based on net after discount')
   as_user(admin,f"SELECT public.luvipro_checkout_refund_v1('{aid}',current_date,'SYNTHETIC_REFUND_COMMISSION','SYNTHETIC refund evidence',true)")
   assert sql(f"SELECT status FROM public.luvipro_affiliate_commissions WHERE source_order_id='{aid}'")=='void';ok('refunded unsettled commission voided without deleting attribution')
 records=sql('SELECT count(*) FROM public.luvipro_bank_orders')
 rollback=(ROOT/'docs/sql/affiliate-checkout-rollback.sql').read_text(encoding='utf-8')
 for k,v in roles.items():rollback=re.sub(r'\b'+k+r'\b',v,rollback)
 sql(rollback);as_user(one,f"SELECT public.luvipro_checkout_order_v1('{q['quote_id']}',gen_random_uuid(),{js(billing)})",True);ok('containment stops new checkout writes')
 assert sql('SELECT count(*) FROM public.luvipro_bank_orders')==records;ok('rollback preserves all records')
 assert json.loads(as_user(one,'SELECT public.luvipro_checkout_history_v1()').splitlines()[-1])['total']>0;ok('rollback preserves authorized history access')
 (OUT/'results.json').write_text(json.dumps({'passed':len(checks),'failed':0,'checks':checks,'scope':'Isolated PostgreSQL with synthetic Auth/Storage fixtures; not real Supabase runtime'},indent=2),encoding='utf-8')
 print(json.dumps({'passed':len(checks),'failed':0}))
finally:
 if database_created:sql('DROP DATABASE '+db+' WITH (FORCE)',database='postgres')
 for v in created_roles:sql('DROP ROLE '+v,database='postgres')
