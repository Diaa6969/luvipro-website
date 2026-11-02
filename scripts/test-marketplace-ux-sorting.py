"""Focused disposable PostgreSQL test; no production connection or files."""
from pathlib import Path
base=(Path(__file__).parent/'test-marketplace-operations-postgres.py').read_text()
prefix=base.split(' vehicle=sql(')[0]
test=r'''
 q=(ROOT/'supabase/migrations/20261101120710_marketplace_ux_sorting_v1.sql').read_text()
 for a,b in roles.items():q=re.sub(r'\b'+a+r'\b',b,q)
 sql(q);ok('new sorting migration applies against existing core/operations')
 vehicle=sql(f"INSERT INTO public.vehicles(user_id,vin,brand,model) VALUES('{seller}','WBA12345678901234','SYNTHETIC','TEST') RETURNING id").splitlines()[0]
 report=sql(f"INSERT INTO public.inspections(user_id,vin,status,report_status,locked_at,report_generated_at,brand,modell,year,mileage,inspectors_notes,report_url) VALUES('{seller}','WBA12345678901234','locked','generated',now(),now(),'SYNTHETIC','TEST',2020,100,'SECRET NOTES','SECRET PDF') RETURNING id").splitlines()[0]
 ids=[]
 for i in range(5):
  data=dict(price_cents=str(100000+(4-i)*10000),mileage=str(1000+i*100),city='TESTCITY',postal_code='12345',seller_type='private',seller_rights_declared=True,first_registration=f'{2018+i}-01',fuel='Benzin',transmission='Automatik',latitude='52.12',longitude='13.12')
  l=json.loads(run(seller,f"SELECT public.luvipro_marketplace_save_v1(NULL,NULL,'{vehicle}','{report}',{j(data)})"));lid=l['id'];ids.append(lid)
  sql(f"INSERT INTO public.luvipro_marketplace_photos(listing_id,object_path,category,position,mime_type,bytes) VALUES('{lid}','SYNTHETIC/{lid}.jpg','front',0,'image/jpeg',100)")
  l=json.loads(run(seller,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'submit')"))
  l=json.loads(run(admin,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'approve','Synthetic isolated seller authority review')"))
  sql(f"SELECT set_config('request.jwt.claim.sub','{admin}',false); UPDATE public.luvipro_marketplace_listings SET published_at=now()-interval '{5-i} days',created_at=now()-interval '{i} days' WHERE id='{lid}'")
 def search(sort=None):
  f={} if sort is None else {'sort':sort}
  return json.loads(sql(f"SET ROLE {roles['anon']};SELECT public.luvipro_marketplace_read_v1('search',NULL,{j(f)})").splitlines()[-1])
 def order(sort):return [x['id'] for x in search(sort)['items']]
 assert order(None)==list(reversed(ids));ok('default newest follows original publication, not draft creation')
 assert order('newest')==list(reversed(ids));ok('explicit newest')
 assert order('oldest')==ids;ok('oldest publication first')
 assert order('price_asc')==list(reversed(ids));ok('price ascending')
 assert order('price_desc')==ids;ok('price descending')
 assert order('mileage_asc')==ids;ok('mileage ascending')
 assert order('mileage_desc')==list(reversed(ids));ok('mileage descending')
 assert order('registration_asc')==ids;ok('first registration ascending')
 assert order('registration_desc')==list(reversed(ids));ok('first registration descending')
 assert all(order('newest')==order('newest') for _ in range(3));ok('stable ordered JSON aggregation')
 result=json.dumps(search());assert 'SECRET' not in result and 'WBA12345678901234' not in result;ok('anonymous sorted cards still omit private VIN/findings/PDF')
 before=sql(f"SELECT published_at FROM public.luvipro_marketplace_listings WHERE id='{ids[0]}'")
 l=json.loads(run(seller,f"SELECT public.luvipro_marketplace_read_v1('mine','{ids[0]}')"))['items'][0]
 for action,who in [('pause',seller),('submit',seller),('approve',admin)]:
  l=json.loads(run(who,f"SELECT public.luvipro_marketplace_state_v1('{ids[0]}',{l['revision']},'{action}','Synthetic isolated rights review')"))
 assert sql(f"SELECT published_at FROM public.luvipro_marketplace_listings WHERE id='{ids[0]}'")==before;ok('pause/review/republication preserves first publication timestamp')
 count=sql('SELECT count(*) FROM public.luvipro_marketplace_listings')
 rollback=Path(r'C:\LUVIPRO_Workspace\readiness\ux_marketplace_20261101\sorting_rollback.sql').read_text()
 sql(rollback);assert sql('SELECT count(*) FROM public.luvipro_marketplace_listings')==count;ok('specific function rollback executes with all records retained')
 result=dict(passed=len(checks),failed=0,checks=checks,scope='Isolated PostgreSQL, synthetic Auth and Storage metadata; no real files/payments')
 target=Path(r'C:\LUVIPRO_Workspace\readiness\ux_marketplace_20261101\sorting_test_results.json');target.write_text(json.dumps(result,indent=2));print(json.dumps(result))
'''
cleanup='''
finally:
 if made:sql('DROP DATABASE '+db+' WITH(FORCE)',database='postgres')
 for r in created:sql('DROP ROLE '+r,database='postgres')
'''
exec(compile(prefix+test+cleanup,__file__,'exec'))
