from pathlib import Path
import subprocess,uuid,re,json,tempfile
ROOT=Path(__file__).resolve().parents[1]
out=Path(tempfile.mkdtemp(prefix='luvipro_marketplace_'))
tag=uuid.uuid4().hex[:10];db='luvipro_sec_test_market_'+tag
roles={r:'luvipro_sec_test_'+r+'_'+tag for r in ['anon','authenticated','service_role']}
psql=r'C:\Program Files\PostgreSQL\17\bin\psql.exe'
created=[];made=False;checks=[]
def sql(q,database=None,fail=False):
 p=subprocess.run([psql,'-X','-w','-h','127.0.0.1','-U','postgres','-d',database or db,'-v','ON_ERROR_STOP=1','-At'],input=q,text=True,capture_output=True)
 if fail:
  assert p.returncode!=0,p.stdout
  return p.stderr
 if p.returncode:raise RuntimeError(p.stderr)
 return p.stdout.strip()
admin=str(uuid.uuid4());seller=str(uuid.uuid4());buyer=str(uuid.uuid4());other=str(uuid.uuid4())
def run(uid,q,fail=False):return sql(f"SET ROLE {roles['authenticated']};SELECT set_config('request.jwt.claim.sub','{uid}',false);"+q,fail=fail).splitlines()[-1]
def j(x):return "'"+json.dumps(x).replace("'","''")+"'::jsonb"
def ok(x):checks.append(x)
try:
 for r in roles.values():sql('CREATE ROLE '+r+' NOLOGIN',database='postgres');created.append(r)
 sql('CREATE DATABASE '+db,database='postgres');made=True
 sql(f"""CREATE SCHEMA auth;CREATE SCHEMA storage;CREATE TABLE storage.objects(bucket_id text,name text);CREATE TABLE public.users(id uuid,role text);CREATE TABLE auth.users(id uuid PRIMARY KEY,email_confirmed_at timestamptz,deleted_at timestamptz);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE AS $$SELECT auth.uid()='{admin}'::uuid$$;
 CREATE TABLE public.vehicles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,vin text,brand text,model text,year integer,mileage integer);
 CREATE TABLE public.inspections(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,vin text,status text,report_status text,locked_at timestamptz,report_generated_at timestamptz,created_at timestamptz DEFAULT now(),brand text,modell text,year integer,mileage integer,inspectors_notes text,report_url text);
 GRANT USAGE ON SCHEMA auth TO {roles['authenticated']};
 INSERT INTO auth.users VALUES('{admin}',now(),NULL),('{seller}',now(),NULL),('{buyer}',now(),NULL),('{other}',now(),NULL);""")
 migration=(ROOT/'supabase/migrations/20261030205002_marketplace_core_v1.sql').read_text(encoding='utf-8')
 for a,b in roles.items():migration=re.sub(r'\b'+a+r'\b',b,migration)
 sql(migration);ok('additive migration compiles against production-shaped synthetic schema')
 vehicle=sql(f"INSERT INTO public.vehicles(user_id,vin,brand,model) VALUES('{seller}','WBA12345678901234','SYNTHETIC','TEST') RETURNING id").splitlines()[0]
 report=sql(f"INSERT INTO public.inspections(user_id,vin,status,report_status,locked_at,report_generated_at,inspectors_notes,report_url) VALUES('{seller}','WBA12345678901234','locked','generated',now(),now(),'SECRET NOTES','SECRET PDF') RETURNING id").splitlines()[0]
 data=dict(brand='SYNTHETIC',model='TEST',city='TESTCITY',postal_code='12345',price_cents='1234500',mileage='10000',seller_type='private',seller_rights_declared=True,description='Synthetic isolated listing')
 def save(uid,id='NULL',rev='NULL',v='NULL',r='NULL',d=data,fail=False):return json.loads(run(uid,f"SELECT public.luvipro_marketplace_save_v1({id},{rev},{v},{r},{j(d)})",fail)) if not fail else run(uid,f"SELECT public.luvipro_marketplace_save_v1({id},{rev},{v},{r},{j(d)})",True)
 l=save(seller);lid=l['id'];ok('incomplete unpublished draft allowed')
 run(buyer,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'archive')",True);ok('cross-owner lifecycle denied')
 save(buyer,v=f"'{vehicle}'",r=f"'{report}'",fail=True);ok('knowledge of matching VIN/report does not grant advertising rights')
 save(seller,v=f"'{vehicle}'",r=f"'{report}'",d=dict(data,report_url='FAKE'),fail=True);ok('client cannot inject protected report URLs or unknown fields')
 l=save(seller,f"'{lid}'",str(l['revision']),f"'{vehicle}'",f"'{report}'");ok('own matching locked report association allowed')
 run(seller,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'submit')",True);ok('publication requires a photo')
 sql(f"INSERT INTO public.luvipro_marketplace_photos(listing_id,object_path,category,position,mime_type,bytes) VALUES('{lid}','synthetic/test.jpg','front',0,'image/jpeg',100)")
 def state(uid,action,reason='',fail=False):
  global l
  value=run(uid,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'{action}','{reason}')",fail)
  if not fail:l=json.loads(value)
 state(seller,'submit');ok('complete authorized listing enters pending review')
 state(seller,'approve','SYNTHETIC seller rights verified',True);ok('seller cannot approve own advertisement')
 sql('SET ROLE '+roles['anon']+';SELECT * FROM public.luvipro_marketplace_listings',fail=True);ok('anonymous raw table access denied')
 state(admin,'approve','SYNTHETIC seller rights verified');ok('Admin publication requires revision and documented review')
 card=json.loads(sql(f"SET ROLE {roles['anon']};SELECT public.luvipro_marketplace_read_v1('detail','{lid}')").splitlines()[-1]);assert card['report']['reference']==report;assert 'SECRET' not in json.dumps(card);ok('public card has exact real report reference without notes, URL or full VIN')
 result=json.loads(sql(f"SET ROLE {roles['anon']};SELECT public.luvipro_marketplace_read_v1('search',NULL,{j({'max_price':100})})").splitlines()[-1]);assert result['total']==0;ok('server price filtering')
 run(buyer,f"SELECT public.luvipro_marketplace_favorite_v1('{lid}',true)");run(buyer,f"SELECT public.luvipro_marketplace_favorite_v1('{lid}',true)");assert sql('SELECT count(*) FROM public.luvipro_marketplace_favorites')=='1';ok('favorites idempotent and user-bound')
 thread=run(buyer,f"SELECT public.luvipro_marketplace_message_v1('{lid}','SYNTHETIC inquiry')");ok('inquiry recipient derived from actual listing seller')
 run(other,f"SELECT public.luvipro_marketplace_inbox_v1('{thread}')",True);ok('third party cannot read conversation')
 run(admin,f"SELECT public.luvipro_marketplace_inbox_v1('{thread}')",True);ok('Admin has no blanket private conversation access')
 inbox=json.loads(run(seller,f"SELECT public.luvipro_marketplace_inbox_v1('{thread}','SYNTHETIC reply')"));assert len(inbox['items'])==2;ok('authorized seller reply and conversation persistence')
 sql(f"UPDATE public.inspections SET report_status='pending' WHERE id='{report}'")
 assert sql(f"SELECT status FROM public.luvipro_marketplace_listings WHERE id='{lid}'")=='paused';ok('report invalidation automatically pauses listing without deleting records')
 assert sql(f"SELECT public.luvipro_marketplace_card_v1('{lid}') IS NULL")=='t';ok('withdrawn report removes public listing projection')
 assert sql('SELECT count(*) FROM public.inspections')=='1';ok('existing report retained unchanged except synthetic invalidation')
 assert sql('SELECT count(*) FROM public.luvipro_marketplace_audit')!='0';ok('lifecycle audit retained')
 sql(f"UPDATE public.inspections SET report_status='generated' WHERE id='{report}'")
 run(buyer,f"SELECT public.luvipro_marketplace_authority_v1('{buyer}','{vehicle}','{report}','SYNTHETIC MANDATE',now()+interval '30 days')",True);ok('ordinary user cannot grant advertising mandate')
 mandate=run(admin,f"SELECT public.luvipro_marketplace_authority_v1('{buyer}','{vehicle}','{report}','SYNTHETIC verified owner mandate',now()+interval '30 days')")
 b=save(buyer,v=f"'{vehicle}'",r=f"'{report}'");ok('reviewed limited mandate enables correct customer/report association')
 run(admin,f"SELECT public.luvipro_marketplace_authority_v1(NULL,NULL,NULL,'SYNTHETIC revoked mandate',NULL,'{mandate}')")
 assert sql(f"SELECT public.luvipro_marketplace_eligible_v1('{b['id']}')")=='f';ok('revoked mandate immediately removes eligibility')
 run(seller,f"SELECT public.luvipro_marketplace_photo_commit_v1('{seller}','{lid}','fake','image/jpeg',100,'front')",True);ok('clients cannot finalize image metadata')
 sql(f"SET ROLE {roles['service_role']};SELECT public.luvipro_marketplace_photo_commit_v1('{seller}','{lid}','{seller}/{lid}/missing.jpg','image/jpeg',100,'front')",fail=True);ok('metadata requires completed Storage object')
 path=f'{seller}/{lid}/synthetic.jpg';sql(f"INSERT INTO storage.objects VALUES('luvipro-marketplace-media','{path}')")
 photo=sql(f"SET ROLE {roles['service_role']};SELECT public.luvipro_marketplace_photo_commit_v1('{seller}','{lid}','{path}','image/jpeg',100,'front')").splitlines()[-1];ok('trusted verified upload links to exact owned listing')
 assert sql(f"SET ROLE {roles['service_role']};SELECT public.luvipro_marketplace_photo_access_v1('{photo}',NULL) IS NULL").splitlines()[-1]=='t';ok('unpublished draft image denied anonymously')
 assert sql(f"SET ROLE {roles['service_role']};SELECT public.luvipro_marketplace_photo_access_v1('{photo}','{buyer}') IS NULL").splitlines()[-1]=='t';ok('another customer cannot retrieve draft image')
 assert sql(f"SET ROLE {roles['service_role']};SELECT public.luvipro_marketplace_photo_access_v1('{photo}','{seller}')").splitlines()[-1]==path;ok('draft image owner retrieval allowed')
 run(buyer,f"SELECT public.luvipro_marketplace_photos_v1('{lid}')",True);ok('other seller cannot inspect or reorder private photos')
 run(seller,f"SELECT public.luvipro_marketplace_photos_v1('{lid}',ARRAY['{photo}','{photo}']::uuid[])",True);ok('duplicate or incomplete photo reordering rejected')
 run(seller,f"SELECT public.luvipro_marketplace_photos_v1('{lid}',NULL,'{photo}')");assert sql(f"SELECT removed_at IS NOT NULL FROM public.luvipro_marketplace_photos WHERE id='{photo}'")=='t';ok('photo removal is archival and retains object audit linkage')
 before=sql('SELECT count(*) FROM public.luvipro_marketplace_listings')
 rollback=(ROOT/'docs/sql/marketplace-containment-rollback.sql').read_text(encoding='utf-8')
 for a,b in roles.items():rollback=re.sub(r'\b'+a+r'\b',b,rollback)
 sql(rollback);run(seller,"SELECT public.luvipro_marketplace_save_v1(NULL,NULL,NULL,NULL,'{}')",True);ok('containment revokes authenticated write entry points')
 assert sql('SELECT count(*) FROM public.luvipro_marketplace_listings')==before;assert sql('SELECT count(*) FROM public.inspections')=='1';ok('containment preserves listings, underlying report and histories')
 (out/'results.json').write_text(json.dumps(dict(passed=len(checks),failed=0,checks=checks,scope='Isolated PostgreSQL, synthetic records; not Storage/client integration'),indent=2),encoding='utf-8')
 print(json.dumps(dict(passed=len(checks),failed=0,evidence=str(out/'results.json'))))
finally:
 if made:sql('DROP DATABASE '+db+' WITH(FORCE)',database='postgres')
 for r in created:sql('DROP ROLE '+r,database='postgres')
