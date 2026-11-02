"""Optional AI budget only; synthetic PostgreSQL, no external provider or charges."""
from pathlib import Path
base=(Path(__file__).parent/'test-marketplace-operations-postgres.py').read_text(encoding='utf-8')
prefix=base.split(' vehicle=sql(')[0].replace('text=True,capture_output=True)',"text=True,encoding='utf-8',capture_output=True)")
test=r'''
 sql("CREATE SCHEMA luvipro_security;CREATE FUNCTION luvipro_security.phase2_can_read(i uuid)RETURNS boolean LANGUAGE sql AS $$SELECT false$$")
 for name in ['20261101142825_marketplace_assist_and_offers_v1.sql','20261102055837_marketplace_optional_ai_budget_v1.sql']:
  q=(ROOT/'supabase/migrations'/name).read_text(encoding='utf-8')
  for a,b in roles.items():q=re.sub(r'\b'+a+r'\b',b,q)
  sql(q)
 ok('optional AI migration applies additively with provider off and zero budgets')
 def reserve(actor=seller,key=None,cost=600):return service(f"SELECT public.luvipro_marketplace_ai_reserve_v1('{actor}','{key or uuid.uuid4()}','search',{cost},'synthetic-pinned-model')")
 assert reserve()=='f';ok('disabled production-default gate cannot reserve paid calls')
 sql("UPDATE public.luvipro_marketplace_settings SET ai_provider_enabled=true",fail=True);ok('activation requires approved evidence and nonzero capped budgets')
 sql("UPDATE public.luvipro_marketplace_settings SET ai_provider_enabled=true,ai_daily_usd_micros=1000,ai_monthly_usd_micros=1500,ai_approval_reference='SYNTHETIC local approval only'")
 assert reserve()=='f';ok('service reserve still requires recent authorized user-quota operation')
 run(seller,"SELECT public.luvipro_marketplace_assist_v1('search','Audi Diesel')")
 key=str(uuid.uuid4());assert reserve(key=key)=='t' and reserve(key=key)=='f';ok('each server-generated reservation is one-use, duplicate cannot repeat paid request')
 assert reserve()=='f';ok('global daily upper cost cap rejects excess before external call')
 run(buyer,"SELECT public.luvipro_marketplace_assist_v1('search','Audi Diesel')");assert reserve(actor=buyer)=='f';ok('global cap cannot be bypassed by another account')
 assert sql('SELECT count(*) FROM public.luvipro_marketplace_ai_reservations')=='1';ok('denied calls do not create false charges or prompt records')
 sql("UPDATE public.luvipro_marketplace_ai_reservations SET created_at=now()-interval '1 day'")
 assert reserve()=='t' and reserve(cost=400)=='f';ok('monthly cap includes previous-day conservative reservations')
 sql("UPDATE public.luvipro_marketplace_settings SET ai_daily_usd_micros=1000,ai_monthly_usd_micros=10000;UPDATE public.luvipro_marketplace_ai_reservations SET created_at=now()-interval '2 months'")
 with ThreadPoolExecutor(max_workers=2) as pool: results=list(pool.map(lambda _:reserve(),range(2)))
 assert results.count('t')==1 and results.count('f')==1;ok('atomic global lock prevents concurrent calls overspending daily cap')
 q=f"SELECT public.luvipro_marketplace_ai_reserve_v1('{seller}',gen_random_uuid(),'search',1,'synthetic')"
 run(seller,q,True);sql('SET ROLE '+roles['anon']+';'+q,fail=True);ok('client and anonymous roles cannot reserve trusted financial budget')
 sql('SET ROLE '+roles['authenticated']+';SELECT * FROM public.luvipro_marketplace_ai_reservations',fail=True);ok('raw AI audit/accounting table inaccessible to clients')
 sql(f"UPDATE auth.users SET banned_until=now()+interval '1 day' WHERE id='{seller}'");service(q,True);ok('banned account cannot reserve using a stale verified session')
 before=sql('SELECT count(*) FROM public.luvipro_marketplace_ai_reservations');q=(ROOT/'docs/sql/marketplace-ai-containment.sql').read_text(encoding='utf-8')
 for a,b in roles.items():q=re.sub(r'\b'+a+r'\b',b,q)
 sql(q);assert sql('SELECT count(*) FROM public.luvipro_marketplace_ai_reservations')==before;service(q=f"SELECT public.luvipro_marketplace_ai_reserve_v1('{buyer}',gen_random_uuid(),'search',1,'synthetic')",fail=True);ok('containment disables calls and retains all reservations')
 result={'passed':len(checks),'failed':0,'checks':checks,'scope':'Synthetic PostgreSQL roles and simulated USD upper bounds. No real provider/model/pricing/charges tested.'};Path(r'C:\LUVIPRO_Workspace\readiness\ux_marketplace_20261101\ai_budget_test_results.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
'''
cleanup='''
finally:
 if made:sql('DROP DATABASE '+db+' WITH(FORCE)',database='postgres')
 for r in created:sql('DROP ROLE '+r,database='postgres')
'''
exec(compile(prefix+test+cleanup,__file__,'exec'))
