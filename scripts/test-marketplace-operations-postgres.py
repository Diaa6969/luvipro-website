"""New upload reservations/moderation only. Disposable local DB and synthetic records."""
from pathlib import Path
import subprocess,uuid,re,json,tempfile
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1];out=Path(tempfile.mkdtemp(prefix='luvipro_marketplace_ops_'))
tag=uuid.uuid4().hex[:10];db='luvipro_sec_test_market_ops_'+tag
roles={r:'luvipro_sec_test_'+r+'_'+tag for r in ['anon','authenticated','service_role']}
psql=r'C:\Program Files\PostgreSQL\17\bin\psql.exe';created=[];made=False;checks=[]
def sql(q,database=None,fail=False):
 p=subprocess.run([psql,'-X','-w','-h','127.0.0.1','-U','postgres','-d',database or db,'-v','ON_ERROR_STOP=1','-At'],input=q,text=True,capture_output=True)
 if fail:assert p.returncode!=0,p.stdout;return p.stderr
 if p.returncode:raise RuntimeError(p.stderr)
 return p.stdout.strip()
admin,seller,buyer,other=[str(uuid.uuid4()) for _ in range(4)]
def run(uid,q,fail=False):return sql(f"SET ROLE {roles['authenticated']};SELECT set_config('request.jwt.claim.sub','{uid}',false);"+q,fail=fail).splitlines()[-1]
def service(q,fail=False):return sql('SET ROLE '+roles['service_role']+';'+q,fail=fail).splitlines()[-1]
def j(x):return "'"+json.dumps(x).replace("'","''")+"'::jsonb"
def ok(x):checks.append(x)
try:
 for r in roles.values():sql('CREATE ROLE '+r+' NOLOGIN'+(' BYPASSRLS' if r==roles['service_role'] else ''),database='postgres');created.append(r)
 sql('CREATE DATABASE '+db,database='postgres');made=True
 sql(f"""CREATE SCHEMA auth;CREATE SCHEMA storage;CREATE TABLE storage.objects(bucket_id text,name text,metadata jsonb);CREATE TABLE public.users(id uuid,role text);
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email_confirmed_at timestamptz,deleted_at timestamptz,banned_until timestamptz);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE AS $$SELECT auth.uid()='{admin}'::uuid$$;
 CREATE TABLE public.vehicles(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,vin text,brand text,model text,year integer,mileage integer);
 CREATE TABLE public.inspections(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid,vin text,status text,report_status text,locked_at timestamptz,report_generated_at timestamptz,created_at timestamptz DEFAULT now(),brand text,modell text,year integer,mileage integer,inspectors_notes text,report_url text);
 GRANT USAGE ON SCHEMA auth TO {roles['authenticated']};
 INSERT INTO auth.users(id,email_confirmed_at) VALUES('{admin}',now()),('{seller}',now()),('{buyer}',now()),('{other}',now());INSERT INTO public.users VALUES('{admin}','admin');""")
 for filename in ['20261030205002_marketplace_core_v1.sql','20261031192504_marketplace_upload_and_admin_operations_v1.sql']:
  q=(ROOT/'supabase/migrations'/filename).read_text(encoding='utf-8')
  for a,b in roles.items():q=re.sub(r'\b'+a+r'\b',b,q)
  sql(q)
 ok('operations migration applies after immutable deployed core')
 vehicle=sql(f"INSERT INTO public.vehicles(user_id,vin,brand,model) VALUES('{seller}','WBA12345678901234','SYNTHETIC','TEST') RETURNING id").splitlines()[0]
 report=sql(f"INSERT INTO public.inspections(user_id,vin,status,report_status,locked_at,report_generated_at,brand,modell,year,mileage,inspectors_notes,report_url) VALUES('{seller}','WBA12345678901234','locked','generated',now(),now(),'SYNTHETIC','TEST',2020,10000,'SECRET NOTES','SECRET PDF') RETURNING id").splitlines()[0]
 data=dict(brand='CLIENT_FORGED',model='FORGED',year='2021',vin='WBA99999999999999',city='TESTCITY',postal_code='12345',price_cents='1234500',mileage='11000',seller_type='private',seller_rights_declared=True,first_registration='2020-01',fuel='Benzin',transmission='Automatik',power_kw='100',latitude='52.123456',longitude='13.123456',equipment=['Navigation','Sitzheizung'],description='Synthetic isolated listing')
 def save(uid=seller,v=None,r=None,d=data):return json.loads(run(uid,f"SELECT public.luvipro_marketplace_save_v1(NULL,NULL,{'NULL' if v is None else chr(39)+v+chr(39)},{'NULL' if r is None else chr(39)+r+chr(39)},{j(d)})"))
 l=save(v=vehicle,r=report);lid=l['id']
 assert l['data']['brand']=='SYNTHETIC' and l['data']['year']==2020;ok('report-derived brand/model/year cannot be overwritten by client')
 assert l['draft_vin']=='WBA12345678901234' and 'vin' not in l['data'];ok('report VIN remains canonical and is stored privately outside public listing data')
 vehicles=json.loads(run(seller,"SELECT public.luvipro_marketplace_read_v1('vehicles')"));assert vehicles['items'][0]['vin']=='WBA12345678901234';assert not json.loads(run(buyer,"SELECT public.luvipro_marketplace_read_v1('vehicles')"))['items'];ok('vehicle selector exposes VIN only to its owner')
 partial=save(d=dict(brand='',price_cents='',mileage='',power_kw=''));assert partial['data']=={};ok('incomplete draft can save blank optional fields without false success at publication')
 assert l['data']['latitude']==52.12 and l['data']['longitude']==13.12;ok('public listing coordinates are rounded to approximate city precision')
 run(buyer,f"SELECT public.luvipro_marketplace_save_v1(NULL,NULL,'{vehicle}',NULL,{j(data)})",True);ok('even unpublished drafts cannot link another seller vehicle without mandate')
 run(seller,f"SELECT public.luvipro_marketplace_actor_v1('{admin}')",True);ok('clients cannot spoof private live-account helper')
 def reserve(listing=lid,key=None,actor=seller,mime='image/jpeg',size=100,sha='a'*64,category='front',fail=False):
  q=f"SELECT public.luvipro_marketplace_upload_reserve_v1('{actor}','{listing}','{key or uuid.uuid4()}','{mime}',{size},'{sha}','{category}')"
  return service(q,True) if fail else json.loads(service(q))
 args=f"'{seller}','{lid}',gen_random_uuid(),'image/jpeg',100,'{'a'*64}','front'"
 sql(f"SET ROLE {roles['anon']};SELECT public.luvipro_marketplace_upload_reserve_v1({args})",fail=True);ok('anonymous upload reservation denied')
 run(seller,f"SELECT public.luvipro_marketplace_upload_reserve_v1({args})",True);ok('authenticated clients cannot directly reserve trusted upload paths')
 reserve(actor=buyer,fail=True);ok('trusted endpoint still requires exact listing ownership')
 sql(f"UPDATE auth.users SET banned_until=now()+interval '1 day' WHERE id='{seller}'")
 reserve(fail=True);run(seller,"SELECT public.luvipro_marketplace_read_v1('mine')",True);ok('banned account denied upload and private listing access despite old JWT subject')
 sql(f"UPDATE auth.users SET banned_until=NULL WHERE id='{seller}'")
 key=str(uuid.uuid4());intent=reserve(key=key);assert intent['path'].startswith(seller+'/'+lid+'/') and not intent['uploaded'];ok('server generates scoped UUID object path before uploading')
 assert reserve(key=key)['path']==intent['path'];assert sql('SELECT count(*) FROM public.luvipro_marketplace_upload_intents')=='1';ok('same upload id reserves once')
 reserve(key=key,sha='b'*64,fail=True);ok('retry with different file hash rejected')
 def commit(path=intent['path'],size=100,fail=False):return service(f"SELECT public.luvipro_marketplace_photo_commit_v1('{seller}','{lid}','{path}','image/jpeg',{size},'front')",fail)
 commit(fail=True);ok('no photo success before matching completed Storage object')
 sql(f"INSERT INTO storage.objects VALUES('luvipro-marketplace-media','{intent['path']}',{j({'size':100,'mimetype':'image/jpeg'})})")
 assert reserve(key=key)['uploaded'];ok('safe retry detects completed matching Storage upload')
 photo=commit();assert commit()==photo;assert sql('SELECT count(*) FROM public.luvipro_marketplace_photos')=='1';ok('photo linkage and repeated commit are idempotent')
 completed=reserve(key=key);assert completed['completed'] and completed['photo_id']==photo;ok('client retry after ambiguous response returns existing completed photo')
 intent2=reserve();sql(f"INSERT INTO storage.objects VALUES('luvipro-marketplace-media','{intent2['path']}',{j({'size':99,'mimetype':'image/jpeg'})})")
 commit(intent2['path'],fail=True);ok('wrong Storage size cannot be marked successful')
 sql(f"UPDATE storage.objects SET metadata={j({'size':100,'mimetype':'image/jpeg'})} WHERE name='{intent2['path']}'");commit(intent2['path']);ok('matching completed upload links after safe retry')
 other_listing=save()['id']
 def competing(_):
  try:return reserve(listing=other_listing)
  except RuntimeError as e:return str(e)
 with ThreadPoolExecutor(max_workers=12) as pool:results=list(pool.map(competing,range(25)))
 assert sum(isinstance(x,dict) for x in results)==24,results
 assert sum('Maximum 24' in x for x in results if isinstance(x,str))==1;ok('25 concurrent reservations allow exactly 24 pending photos, not unbounded orphan uploads')
 assert reserve(key=key)['completed'];ok('completed retries do not consume another upload slot')
 run(seller,'SELECT * FROM public.luvipro_marketplace_upload_intents',True);ok('upload hashes and private paths inaccessible through raw tables')
 # Publication still uses the real guarded core and an Admin review.
 l=json.loads(run(seller,f"SELECT public.luvipro_marketplace_read_v1('mine','{lid}')"))['items'][0]
 assert len(l['photos'])==2 and 'object_path' not in json.dumps(l['photos']);ok('owner listing includes safe photo metadata without raw paths')
 l=json.loads(run(seller,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'submit')"))
 l=json.loads(run(admin,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'approve','SYNTHETIC seller rights verified')"));ok('complete listing with reserved uploads can pass documented Admin approval')
 def search(filters):return json.loads(sql(f"SET ROLE {roles['anon']};SELECT public.luvipro_marketplace_read_v1('search',NULL,{j(filters)})").splitlines()[-1])
 assert search(dict(latitude=52.12,longitude=13.12,radius_km=1))['total']==1;assert search(dict(latitude=48,longitude=11,radius_km=10))['total']==0;ok('server radius search includes nearby and excludes distant city coordinates')
 assert search(dict(brand='synthetic',model='TEST',min_price=1200000,max_price=1300000,min_mileage=10000,max_mileage=12000,min_power=90,max_power=110,first_from='2019-01',first_to='2021-01',equipment=['Navigation']))['total']==1;ok('combined indexed vehicle, price, mileage, power, registration and equipment filters')
 assert search(dict(equipment=['Anhängerkupplung']))['total']==0;assert search(dict(max_power=50))['total']==0;ok('unsupported equipment and insufficient power do not leak unmatched listings')
 assert 'WBA12345678901234' not in json.dumps(search({})) and 'SECRET' not in json.dumps(search({}));ok('extended public search still excludes private VIN, notes and PDFs')
 sql(f"GRANT SELECT,UPDATE ON public.luvipro_marketplace_listings TO {roles['service_role']}")
 service(f"UPDATE public.luvipro_marketplace_listings SET status='published' WHERE id='{other_listing}'",True);ok('trusted service table write cannot bypass publication constraint trigger')
 sql(f"SELECT set_config('request.jwt.claim.sub','{admin}',false);UPDATE public.luvipro_marketplace_listings SET revision=revision+1 WHERE id='{lid}'",fail=True);ok('raw Admin write cannot reuse approval audit for another revision')
 run(buyer,"SELECT public.luvipro_marketplace_admin_v1()",True);ok('ordinary customer denied Admin workspace')
 assert json.loads(run(admin,"SELECT public.luvipro_marketplace_admin_v1('listings',NULL,'','published')"))['total']==1;ok('Admin filters published listings across owners')
 audit=json.loads(run(admin,f"SELECT public.luvipro_marketplace_admin_v1('audit','{lid}')"));assert len(audit['items'])>=3;ok('Admin can inspect immutable lifecycle audit')
 thread=run(buyer,f"SELECT public.luvipro_marketplace_message_v1('{lid}','SYNTHETIC buyer inquiry')")
 case=run(buyer,f"SELECT public.luvipro_marketplace_case_v1('{lid}','SYNTHETIC concern for reviewed test')");ok('authenticated buyer can report a real published listing')
 run(buyer,f"SELECT public.luvipro_marketplace_case_v1('{lid}','SYNTHETIC duplicate concern')",True);ok('duplicate open abuse reports blocked')
 run(buyer,f"SELECT public.luvipro_marketplace_case_review_v1('{case}','reviewed','SYNTHETIC purpose','{thread}')",True);ok('ordinary reporter cannot inspect private conversation as Admin')
 run(admin,f"SELECT public.luvipro_marketplace_inbox_v1('{thread}')",True);ok('Admin still has no blanket inbox access')
 evidence=json.loads(run(admin,f"SELECT public.luvipro_marketplace_case_review_v1('{case}','reviewed','SYNTHETIC necessary case investigation','{thread}')"));assert len(evidence['items'])==1;ok('specific matching open case and documented purpose allow audited Admin inspection')
 wrong=str(uuid.uuid4());sql(f"INSERT INTO public.luvipro_marketplace_inquiries(id,listing_id,buyer_uid,seller_uid) VALUES('{wrong}','{other_listing}','{other}','{seller}')")
 run(admin,f"SELECT public.luvipro_marketplace_case_review_v1('{case}','reviewed','SYNTHETIC necessary case investigation','{wrong}')",True);ok('case cannot grant access to a different listing conversation')
 run(admin,f"SELECT public.luvipro_marketplace_case_review_v1('{case}','closed','SYNTHETIC reviewed case closed')")
 run(admin,f"SELECT public.luvipro_marketplace_case_review_v1('{case}','reviewed','SYNTHETIC necessary case investigation','{thread}')",True);ok('closed case cannot be used to reopen private conversation access')
 run(admin,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'pause')",True);ok('Admin suspension requires a documented reason')
 run(admin,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'pause','SYNTHETIC moderation reason')");ok('documented Admin suspension removes public availability')
 # Production is_admin also requires active public profile status. Keep service-mediated media equally strict.
 sql("ALTER TABLE public.users ADD COLUMN status text DEFAULT 'active'")
 active_sql=(ROOT/'supabase/migrations/20261031235555_marketplace_photo_active_admin_v1.sql').read_text(encoding='utf8')
 sql(active_sql)
 assert service(f"SELECT public.luvipro_marketplace_photo_access_v1('{photo}','{admin}')")==intent['path'];ok('active Admin can access private listing photo through guarded service')
 sql(f"UPDATE public.users SET status='suspended' WHERE id='{admin}'")
 assert service(f"SELECT public.luvipro_marketplace_photo_access_v1('{photo}','{admin}') IS NULL")=='t';ok('inactive Admin profile cannot retrieve private listing photo')
 sql(f"UPDATE public.users SET status='active' WHERE id='{admin}'")
 # Isolated fixture deletion only; never a production account deletion.
 retained=save(uid=other)['id'];reserve(listing=retained,actor=other)
 before=sql('SELECT count(*) FROM public.luvipro_marketplace_listings');sql(f"DELETE FROM auth.users WHERE id='{other}'")
 assert sql(f"SELECT seller_uid IS NULL FROM public.luvipro_marketplace_listings WHERE id='{retained}'")=='t';assert sql('SELECT count(*) FROM public.luvipro_marketplace_listings')==before
 assert sql(f"SELECT status FROM public.luvipro_marketplace_listings WHERE id='{retained}'")=='archived'
 assert sql('SELECT count(*) FROM public.inspections')=='1';ok('isolated manual Auth deletion retains listing/report/history references and nulls login links')
 rollback=(ROOT/'docs/sql/marketplace-containment-rollback.sql').read_text(encoding='utf-8')
 for a,b in roles.items():rollback=re.sub(r'\b'+a+r'\b',b,rollback)
 sql(rollback);reserve(fail=True);ok('containment disables new reservation service entry point')
 assert sql('SELECT count(*) FROM public.luvipro_marketplace_listings')==before;ok('operations rollback preserves every listing and report')
 (out/'results.json').write_text(json.dumps(dict(passed=len(checks),failed=0,checks=checks,scope='Local PostgreSQL with synthetic Auth/Storage metadata; no real Auth, files, payments or production deletions'),indent=2),encoding='utf-8')
 print(json.dumps(dict(passed=len(checks),failed=0,evidence=str(out/'results.json'))))
finally:
 if made:sql('DROP DATABASE '+db+' WITH(FORCE)',database='postgres')
 for r in created:sql('DROP ROLE '+r,database='postgres')
