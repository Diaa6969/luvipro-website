"""New feature checks only; disposable PostgreSQL, no external AI/email/payment calls."""
from pathlib import Path
base=(Path(__file__).parent/'test-marketplace-operations-postgres.py').read_text(encoding='utf-8')
prefix=base.split(' vehicle=sql(')[0]
prefix=prefix.replace('text=True,capture_output=True)',"text=True,encoding='utf-8',capture_output=True)")
test=r'''
 sql("CREATE SCHEMA luvipro_security; CREATE FUNCTION luvipro_security.phase2_can_read(i uuid) RETURNS boolean LANGUAGE sql STABLE AS $$SELECT public.is_admin() OR EXISTS(SELECT 1 FROM public.inspections x WHERE x.id=i AND x.user_id=auth.uid())$$;")
 q=(ROOT/'supabase/migrations/20261101142825_marketplace_assist_and_offers_v1.sql').read_text(encoding='utf-8')
 for a,b in roles.items():q=re.sub(r'\b'+a+r'\b',b,q)
 sql(q);ok('settings/assistance/offer migration applies without modifying existing core')
 config=json.loads(run(admin,'SELECT public.luvipro_marketplace_config_v1()'))
 assert config['report_price_cents']==2999 and not config['purchases_enabled'] and not config['ai_provider_enabled'];ok('report price matches retained checkout source; purchases/provider disabled')
 assert len(config['boost_products'])==3 and all(not p['enabled'] and p['comparison_status']=='unverified' for p in config['boost_products']);ok('three provisional packages retained internally, no active paid offers')
 run(seller,'SELECT public.luvipro_marketplace_config_v1()',True);ok('ordinary user cannot read Admin configuration')
 sql(f"SET ROLE {roles['anon']};SELECT public.luvipro_marketplace_config_v1()",fail=True);ok('anonymous configuration denied')
 for name in ['settings','assist_usage']:
  run(seller,'SELECT * FROM public.luvipro_marketplace_'+name,True)
  service('SELECT * FROM public.luvipro_marketplace_'+name,True)
 ok('private tables inaccessible to ordinary users and raw trusted-service calls')
 for payload in [{'purchases_enabled':True},{'ai_provider_enabled':True},{'report_price_cents':0},{'assist_daily':1001}]:
  run(admin,f"SELECT public.luvipro_marketplace_config_v1({j(payload)},1,'Synthetic bounded config test')",True)
 ok('clients cannot activate payments/providers or bypass price/quota bounds')
 p=dict(config['boost_products'][0]);p['comparison_status']='verified'
 run(admin,f"SELECT public.luvipro_marketplace_config_v1({j({'boost_products':[p]})},1,'Synthetic benchmark check')",True);ok('verified competitor claim requires actual benchmark fields')
 p=dict(config['boost_products'][0]);p['api_key']='FORBIDDEN'
 run(admin,f"SELECT public.luvipro_marketplace_config_v1({j({'boost_products':[p]})},1,'Synthetic unsupported field')",True);ok('configuration cannot become an arbitrary secrets/input container')
 changed=json.loads(run(admin,f"SELECT public.luvipro_marketplace_config_v1({j({'assist_daily':31})},1,'Synthetic admin quota adjustment')"));assert changed['revision']==2;ok('Admin config change has optimistic revision and audit')
 run(admin,f"SELECT public.luvipro_marketplace_config_v1({j({'assist_daily':32})},1,'Synthetic stale revision check')",True);ok('stale configuration revision rejected')
 assert sql("SELECT count(*) FROM public.luvipro_marketplace_audit WHERE action='configuration_updated'")=='1';ok('successful config update audited once')
 def assist(uid,action='search',text='',listing=None,fail=False):
  query=f"SELECT public.luvipro_marketplace_assist_v1('{action}',{chr(39)+text.replace(chr(39),chr(39)*2)+chr(39)},{'NULL' if listing is None else chr(39)+listing+chr(39)})"
  value=run(uid,query,fail)
  return value if fail else json.loads(value)
 answer=assist(seller,text='Ich suche einen BMW Diesel mit Automatik unter 20.000 Euro und weniger als 100.000 km.')
 assert answer['mode']=='deterministic' and not answer['provider_active'] and answer['requires_review'];ok('fallback is explicitly deterministic and requires review, not represented as AI')
 assert answer['filters']==dict(brand='BMW',fuel='Diesel',transmission='Automatik',max_price=2000000,max_mileage=100000);ok('German manufacturer/fuel/gear/price/mileage example maps to real backend filters')
 answer=assist(seller,text='Familienauto maximal 15.000 Euro in Hannover ab 2018 mit Sitzheizung')
 assert answer['filters']['max_price']==1500000 and answer['filters']['city']=='Hannover' and answer['filters']['first_from']=='2018-01' and answer['filters']['equipment']==['Sitzheizung'];ok('city/year/equipment explicit facts extracted without inventing economy or family suitability')
 answer=assist(seller,text='Kein Diesel und keine Automatik bitte')
 assert 'fuel' not in answer['filters'] and 'transmission' not in answer['filters'];ok('negated common attributes are not silently inverted')
 assist(seller,text='a'*1001,fail=True);ok('oversized text rejected')
 sql(f"SET ROLE {roles['anon']};SELECT public.luvipro_marketplace_assist_v1('search','BMW Diesel')",fail=True);ok('anonymous assistance denied while normal browse remains public')
 assert json.loads(sql(f"SET ROLE {roles['anon']};SELECT public.luvipro_marketplace_read_v1('search')").splitlines()[-1])['total']==0;ok('existing anonymous traditional search remains operational')
 vehicle=sql(f"INSERT INTO public.vehicles(user_id,vin,brand,model) VALUES('{seller}','WBA12345678901234','SYNTHETIC','TEST') RETURNING id").splitlines()[0]
 report=sql(f"INSERT INTO public.inspections(user_id,vin,status,report_status,locked_at,report_generated_at,brand,modell,year,mileage,inspectors_notes,report_url) VALUES('{seller}','WBA12345678901234','locked','generated',now(),now(),'SYNTHETIC','TEST',2020,100,'SECRET FINDINGS','SECRET PDF') RETURNING id").splitlines()[0]
 d=dict(price_cents='1000000',mileage='1000',city='TESTCITY',postal_code='12345',seller_type='private',seller_rights_declared=True,first_registration='2020-01',fuel='Diesel',transmission='Automatik',equipment=[],known_damage='Seller-declared dent')
 l=json.loads(run(seller,f"SELECT public.luvipro_marketplace_save_v1(NULL,NULL,'{vehicle}','{report}',{j(d)})"));lid=l['id']
 sql('TRUNCATE public.luvipro_marketplace_assist_usage')
 desc=assist(seller,'description',listing=lid)
 assert isinstance(desc['description'],str) and 'Seller-declared dent' in desc['description'];ok('description works with empty equipment and declared damage')
 assert all(x not in json.dumps(desc) for x in ['SECRET','WBA12345678901234','report_url','inspectors_notes']);ok('description input/output excludes VIN, findings, UV media and PDF')
 assist(buyer,'description',listing=lid,fail=True);ok('cross-seller description generation denied')
 assert run(seller,f"SELECT public.luvipro_marketplace_report_offer_v1('{lid}') IS NULL")=='t';ok('private draft does not expose a public report offer')
 sql(f"INSERT INTO public.luvipro_marketplace_photos(listing_id,object_path,category,position,mime_type,bytes) VALUES('{lid}','SYNTHETIC/photo.jpg','front',0,'image/jpeg',100)")
 l=json.loads(run(seller,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'submit')"))
 l=json.loads(run(admin,f"SELECT public.luvipro_marketplace_state_v1('{lid}',{l['revision']},'approve','Synthetic seller authority review')"))
 offer=json.loads(run(buyer,f"SELECT public.luvipro_marketplace_report_offer_v1('{lid}')"))
 assert offer['price_cents']==2999 and offer['currency']=='EUR' and not offer['purchases_enabled'] and not offer['has_access'];ok('unentitled buyer sees exact server price with no activation/access grant')
 assert all(x not in json.dumps(offer) for x in ['SECRET','WBA12345678901234','report_url','inspectors_notes']);ok('public offer contains no confidential inspection content')
 assert json.loads(run(seller,f"SELECT public.luvipro_marketplace_report_offer_v1('{lid}')"))['has_access'];ok('offer delegates owner access to existing security helper (mocked local policy)')
 assert sql('SELECT count(*) FROM public.inspections')=='1';ok('assistance and offers never rewrite the inspection')
 sql('TRUNCATE public.luvipro_marketplace_assist_usage')
 for _ in range(5):assist(other,text='BMW Diesel')
 assist(other,text='BMW Diesel',fail=True);assert sql(f"SELECT count(*) FROM public.luvipro_marketplace_assist_usage WHERE actor_uid='{other}'")=='5';ok('sixth request in one minute denied atomically')
 sql('TRUNCATE public.luvipro_marketplace_assist_usage');sql('UPDATE public.luvipro_marketplace_settings SET assist_daily=1,assist_monthly=300')
 assist(other,text='BMW');sql("UPDATE public.luvipro_marketplace_assist_usage SET created_at=now()-interval '10 minutes'")
 assist(other,text='BMW',fail=True);ok('daily cap applies beyond the one-minute window')
 sql('TRUNCATE public.luvipro_marketplace_assist_usage');sql('UPDATE public.luvipro_marketplace_settings SET assist_daily=30,assist_monthly=1')
 assist(other,text='BMW');sql("UPDATE public.luvipro_marketplace_assist_usage SET created_at=date_trunc('month',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'")
 assist(other,text='BMW',fail=True);ok('monthly cap enforced separately')
 assert sql("SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='luvipro_marketplace_assist_usage' AND column_name IN('prompt','input','response','api_key')")=='0';ok('usage stores counts/lengths only, never prompts or credentials')
 # Containment rollback for newly introduced entry points; no tables or records dropped.
 before=sql('SELECT count(*) FROM public.luvipro_marketplace_listings')
 for signature in ['luvipro_marketplace_config_v1(jsonb,integer,text)','luvipro_marketplace_assist_v1(text,text,uuid)','luvipro_marketplace_report_offer_v1(uuid)']:
  sql(f"REVOKE ALL ON FUNCTION public.{signature} FROM {roles['authenticated']},{roles['anon']}")
 assist(other,text='BMW',fail=True);assert sql('SELECT count(*) FROM public.luvipro_marketplace_listings')==before;ok('containment rollback disables new APIs while preserving all records')
 result=dict(passed=len(checks),failed=0,checks=checks,scope='Disposable PostgreSQL. Synthetic Auth/inspection/photo metadata and mocked existing phase2_can_read; not actual Auth, AI or payment integration.')
 Path(r'C:\LUVIPRO_Workspace\readiness\ux_marketplace_20261101\assist_offer_test_results.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
'''
cleanup='''
finally:
 if made:sql('DROP DATABASE '+db+' WITH(FORCE)',database='postgres')
 for r in created:sql('DROP ROLE '+r,database='postgres')
'''
exec(compile(prefix+test+cleanup,__file__,'exec'))
