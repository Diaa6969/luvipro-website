"""Focused Dealer additions only, synthetic disposable PostgreSQL; no production data."""
from pathlib import Path
base=(Path(__file__).parent/'test-marketplace-operations-postgres.py').read_text(encoding='utf-8')
prefix=base.split(' vehicle=sql(')[0].replace('text=True,capture_output=True)',"text=True,encoding='utf-8',capture_output=True)")
test=r'''
 sql("CREATE TABLE public.partner_verifications(id uuid PRIMARY KEY,status text,show_on_map boolean,admin_notes text,tax_documents_url text);CREATE TABLE public.partner_locations(id uuid PRIMARY KEY,partner_verification_id uuid,partner_user_id uuid,company_name text,city text,postal_code text,street text,house_number text,country text,is_active boolean);")
 q=(ROOT/'supabase/migrations/20261101205226_marketplace_dealer_v1.sql').read_text(encoding='utf-8')
 for a,b in roles.items():q=re.sub(r'\b'+a+r'\b',b,q)
 sql(q);ok('additive dealer functions apply after existing core without data rewrite')
 location,verification,vehicle,report=[str(uuid.uuid4()) for _ in range(4)]
 sql(f"INSERT INTO public.partner_verifications VALUES('{verification}','approved',true,'SECRET_ADMIN','SECRET_TAX');INSERT INTO public.partner_locations VALUES('{location}','{verification}','{seller}','SYNTHETIC Dealer','TESTCITY','12345','Testweg','1','DE',true);INSERT INTO public.vehicles(id,user_id,vin,brand,model) VALUES('{vehicle}','{seller}','WBA12345678901234','SYNTHETIC','TEST');INSERT INTO public.inspections(id,user_id,vin,status,report_status,locked_at,report_generated_at,brand,modell,year,mileage,inspectors_notes,report_url) VALUES('{report}','{seller}','WBA12345678901234','locked','generated',now(),now(),'SYNTHETIC','TEST',2020,10000,'SECRET_FINDINGS','SECRET_PDF')")
 d=dict(city='TESTCITY',postal_code='12345',price_cents='1200000',mileage='11000',seller_type='commercial',commercial_identity='SYNTHETIC public legal business identity',seller_rights_declared=True,first_registration='2020-01',fuel='Benzin',transmission='Automatik')
 l=json.loads(run(seller,f"SELECT public.luvipro_marketplace_save_v1(NULL,NULL,'{vehicle}','{report}',{j(d)})"));lid=l['id']
 sql(f"INSERT INTO public.luvipro_marketplace_photos(listing_id,object_path,category,position,mime_type,bytes) VALUES('{lid}','synthetic/regular.jpg','front',0,'image/jpeg',100)")
 l=json.loads(run(seller,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'submit')"));l=json.loads(run(admin,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'approve','SYNTHETIC rights reviewed')"))
 def public(q):return sql('SET ROLE '+roles['anon']+';'+q).splitlines()[-1]
 profile=json.loads(public(f"SELECT coalesce(public.luvipro_marketplace_dealer_v1('{location}'),'null'::jsonb)"));assert profile['company_name']=='SYNTHETIC Dealer';ok('only approved opted-in active business identity is public')
 assert set(profile)=={'id','company_name','city','postal_code','street','house_number','country'};assert 'SECRET' not in json.dumps(profile) and seller not in json.dumps(profile);ok('public profile excludes Auth UID, account email, private documents and notes')
 card=json.loads(public(f"SELECT public.luvipro_marketplace_read_v1('detail','{lid}')"));assert card['dealer']['id']==location;assert 'SECRET' not in json.dumps(card);ok('published vehicle card links storefront without exposing inspection findings')
 page=json.loads(public(f"SELECT public.luvipro_marketplace_read_v1('search',NULL,{j({'dealer_id':location,'sort':'price_desc'})})"));assert page['total']==1 and page['items'][0]['id']==lid;ok('dealer inventory reuses sorted public eligible listing search')
 empty=json.loads(public(f"SELECT public.luvipro_marketplace_read_v1('search',NULL,{j({'dealer_id':str(uuid.uuid4())})})"));assert empty['total']==0;ok('unknown dealer never falls back to all inventory')
 auto=json.loads(run(seller,'SELECT public.luvipro_marketplace_autopilot_v1()'));assert auto['counts']['published']==1 and auto['owned_vehicles']==1 and auto['eligible'][0]['inspection_id']==report;assert 'SECRET' not in json.dumps(auto);ok('own dashboard has actual counts and existing eligibility projection')
 auto=json.loads(run(other,'SELECT public.luvipro_marketplace_autopilot_v1()'));assert not auto['counts'] and not auto['eligible'] and auto['owned_vehicles']==0;ok('cross-user dashboard isolation')
 sql('SET ROLE '+roles['anon']+';SELECT public.luvipro_marketplace_autopilot_v1()',fail=True);ok('anonymous dashboard denied')
 run(seller,'SELECT public.luvipro_marketplace_autopilot_v1(-1)',True);ok('dashboard pagination bounds remain enforced')
 # Workshop report ownership alone does not establish authority over another vehicle.
 sql(f"UPDATE public.vehicles SET user_id='{other}' WHERE id='{vehicle}'")
 assert not json.loads(run(seller,'SELECT public.luvipro_marketplace_autopilot_v1()'))['eligible'];assert json.loads(public(f"SELECT public.luvipro_marketplace_read_v1('search',NULL,{j({'dealer_id':location})})"))['total']==0;ok('report-owning workshop cannot advertise another owner vehicle without mandate')
 sql(f"UPDATE public.vehicles SET user_id='{seller}' WHERE id='{vehicle}'")
 for change,restore in [("status='pending'","status='approved'"),("show_on_map=false","show_on_map=true")]:
  sql(f"UPDATE public.partner_verifications SET {change} WHERE id='{verification}'")
  assert public(f"SELECT coalesce(public.luvipro_marketplace_dealer_v1('{location}'),'null'::jsonb)")=='null' or not public(f"SELECT coalesce(public.luvipro_marketplace_dealer_v1('{location}'),'null'::jsonb)")
  assert json.loads(public(f"SELECT public.luvipro_marketplace_read_v1('search',NULL,{j({'dealer_id':location})})"))['total']==0;ok('closed/unapproved storefront and inventory fail closed: '+change)
  sql(f"UPDATE public.partner_verifications SET {restore} WHERE id='{verification}'")
 sql(f"UPDATE public.partner_locations SET is_active=false WHERE id='{location}'")
 assert public(f"SELECT coalesce(public.luvipro_marketplace_dealer_v1('{location}'),'null'::jsonb)")=='null';ok('inactive business hidden without deleting historical listings')
 before=sql('SELECT count(*) FROM public.luvipro_marketplace_listings')
 rollback=(ROOT/'docs/sql/marketplace-dealer-rollback.sql').read_text(encoding='utf-8')
 for a,b in roles.items():rollback=re.sub(r'\b'+a+r'\b',b,rollback)
 sql(rollback);assert sql('SELECT count(*) FROM public.luvipro_marketplace_listings')==before;ok('rollback restores original reads and retains all records')
 result={'passed':len(checks),'failed':0,'checks':checks,'scope':'Synthetic PostgreSQL only, no real Auth, Storage files or client runtime.'}
 Path(r'C:\LUVIPRO_Workspace\readiness\ux_marketplace_20261101\dealer_test_results.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
'''
cleanup='''
finally:
 if made:sql('DROP DATABASE '+db+' WITH(FORCE)',database='postgres')
 for r in created:sql('DROP ROLE '+r,database='postgres')
'''
exec(compile(prefix+test+cleanup,__file__,'exec'))
