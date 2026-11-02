"""New Buyer Check state machine only. Synthetic local fixtures, no external messages/payments."""
from pathlib import Path
import ast
base=(Path(__file__).parent/'test-marketplace-operations-postgres.py').read_text(encoding='utf-8')
prefix=base.split(' vehicle=sql(')[0].replace('text=True,capture_output=True)',"text=True,encoding='utf-8',capture_output=True)")
tree=ast.parse((Path(__file__).parent/'test-marketplace-dealer.py').read_text(encoding='utf-8'))
dealer=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='test' for t in n.targets))
prefix+=dealer.split(' def public(')[0]
test=r'''
 sql('ALTER TABLE public.partner_locations ADD COLUMN accepts_inspection_requests boolean DEFAULT true')
 altloc,altver,request=[str(uuid.uuid4()) for _ in range(3)]
 sql(f"INSERT INTO public.partner_verifications VALUES('{altver}','approved',true,'PRIVATE_NOTES','PRIVATE_DOC');INSERT INTO public.partner_locations(id,partner_verification_id,partner_user_id,company_name,city,postal_code,street,house_number,country,is_active) VALUES('{altloc}','{altver}','{other}','SYNTHETIC Independent Workshop','TESTCITY','12345','Testweg','2','DE',true)")
 sql(f"ALTER TABLE public.users ADD COLUMN status text DEFAULT 'active';INSERT INTO public.users(id,role) VALUES('{seller}','partner'),('{other}','partner');ALTER TABLE public.partner_verifications ADD COLUMN user_id uuid;ALTER TABLE public.partner_verifications ADD COLUMN created_at timestamptz DEFAULT now();UPDATE public.partner_verifications SET user_id='{seller}' WHERE id='{verification}';UPDATE public.partner_verifications SET user_id='{other}' WHERE id='{altver}'")
 q=(ROOT/'supabase/migrations/20261101211330_marketplace_buyer_check_v1.sql').read_text(encoding='utf-8')
 for a,b in roles.items():q=re.sub(r'\b'+a+r'\b',b,q)
 sql(q);ok('Buyer Check migration applies without changing orders or inspections')
 patch=(ROOT/'supabase/migrations/20261101214150_marketplace_buyer_admin_scope_v1.sql').read_text(encoding='utf-8');sql(patch)
 def action(uid,kind,record=None,**kw):
  fail=kw.pop('fail',False)
  params=dict(p_action=kind,**kw)
  if record:params.update(p_id=record['id'],p_revision=record['revision'])
  args=[]
  for k,v in params.items():
   val='NULL' if v is None else 'true' if v is True else 'false' if v is False else str(v) if isinstance(v,int) else "'"+str(v).replace("'","''")+"'"
   args.append(k+'=>'+val)
  result=run(uid,'SELECT public.luvipro_marketplace_buyer_check_v1('+','.join(args)+')',fail)
  return result if fail else json.loads(result)
 partners=json.loads(run(buyer,f"SELECT public.luvipro_marketplace_check_partners_v1('{lid}')"));assert [x['partner_user_id'] for x in partners['items']]==[other];assert 'PRIVATE' not in json.dumps(partners);ok('existing approved workshop network excludes seller/original inspector, no private documents')
 sql(f"UPDATE public.users SET status='suspended' WHERE id='{other}'")
 assert not json.loads(run(buyer,f"SELECT public.luvipro_marketplace_check_partners_v1('{lid}')"))['items'];sql(f"UPDATE public.users SET status='active' WHERE id='{other}'");ok('suspended Partner profile excluded despite approved old location')
 newer=str(uuid.uuid4());sql(f"INSERT INTO public.partner_verifications(id,status,show_on_map,user_id,created_at) VALUES('{newer}','pending',false,'{other}',now()+interval '1 minute')")
 assert not json.loads(run(buyer,f"SELECT public.luvipro_marketplace_check_partners_v1('{lid}')"))['items'];sql(f"UPDATE public.partner_verifications SET status='approved' WHERE id='{newer}'");ok('latest pending verification overrides an older approved location')
 sql(f"UPDATE public.users SET status='suspended' WHERE id='{seller}'")
 assert run(buyer,f"SELECT coalesce(public.luvipro_marketplace_dealer_v1('{location}'),'null'::jsonb)")=='null';sql(f"UPDATE public.users SET status='active' WHERE id='{seller}'");ok('storefront latest live profile rule matches Partner authorization')
 r=action(buyer,'create',p_listing=lid,p_partner=other,p_request=request)
 assert r['status']=='waiting_seller' and not r['seller_accepted'] and r['slot'] is None;ok('new request is not an accepted appointment or entitlement')
 again=action(buyer,'create',p_listing=lid,p_partner=other,p_request=request);assert again['id']==r['id'];assert sql('SELECT count(*) FROM public.luvipro_marketplace_buyer_checks')=='1';ok('retry creates exactly one request and event')
 assert sql('SELECT count(*) FROM public.luvipro_marketplace_messages')=='1';ok('seller notified once through existing private inquiry inbox')
 action(buyer,'create',p_listing=lid,p_partner=other,p_request=str(uuid.uuid4()),fail=True);ok('duplicate active requests blocked')
 action(seller,'create',p_listing=lid,p_request=str(uuid.uuid4()),fail=True);ok('seller cannot request own advertised car as independent buyer')
 action(buyer,'partner_accept',r,p_confirm=True,fail=True);action(other,'partner_accept',r,p_confirm=True,fail=True);ok('buyer cannot spoof workshop and workshop cannot bypass seller consent')
 action(buyer,'seller_accept',r,p_confirm=True,fail=True);action(seller,'seller_accept',r,p_confirm=False,fail=True);ok('seller consent requires correct actor and explicit confirmation')
 r=action(seller,'seller_accept',r,p_confirm=True);assert r['status']=='waiting_partner';ok('seller approval waits for workshop, no automatic appointment')
 stale=dict(r,revision=r['revision']-1);action(other,'partner_accept',stale,p_confirm=True,fail=True);ok('stale revisions rejected')
 action(other,'partner_accept',r,p_confirm=False,fail=True);ok('workshop must declare independence')
 r=action(other,'partner_accept',r,p_confirm=True);assert r['status']=='accepted' and r['partner_independence_confirmed'];ok('separate live workshop acceptance records declaration')
 action(buyer,'propose_slot',r,p_slot='2099-01-01',p_note='Synthetic slot evidence',fail=True);ok('buyer cannot forge workshop availability')
 slot=sql("SELECT (now()+interval '3 days')::text")
 sql(f"UPDATE public.partner_verifications SET status='pending' WHERE id='{altver}'");action(other,'propose_slot',r,p_slot=slot,p_note='Synthetic invalid authorization',fail=True);sql(f"UPDATE public.partner_verifications SET status='approved' WHERE id='{altver}'");ok('revoked workshop cannot propose a date using an old request')
 r=action(other,'propose_slot',r,p_slot=slot,p_note='Synthetic mutually proposed time');assert r['status']=='appointment_proposed';ok('proposed future slot is not automatically booked')
 r=action(buyer,'confirm_slot',r,p_confirm=True);assert r['status']=='appointment_proposed';ok('buyer confirmation alone insufficient')
 r=action(seller,'confirm_slot',r,p_confirm=True);assert r['status']=='scheduled';ok('both seller and buyer acceptance required for booking')
 action(other,'complete',r,p_confirm=True,p_note='Synthetic inspection completed',fail=True);ok('future appointment cannot be prematurely completed')
 for uid in [buyer,seller,other]:assert len(action(uid,'list')['items'])==1
 ok('buyer, seller and selected workshop can access own request')
 assert not action(admin,'list')['items'];assert len(action(admin,'admin_list',p_note='Synthetic Admin Center review')['items'])==1;action(buyer,'admin_list',p_note='Synthetic forged Admin review',fail=True);ok('Admin review requires explicit logged Admin scope; personal inbox stays personal')
 outsider=str(uuid.uuid4());sql(f"INSERT INTO auth.users(id,email_confirmed_at)VALUES('{outsider}',now())")
 assert not action(outsider,'list')['items'];action(outsider,'cancel',r,p_note='Synthetic unauthorized cancel',fail=True);ok('unrelated customer isolated from reads and transitions')
 run(buyer,'SELECT * FROM public.luvipro_marketplace_buyer_checks',True);run(other,'SELECT * FROM public.luvipro_marketplace_buyer_check_events',True);ok('raw request and audit tables inaccessible to clients')
 sql('SET ROLE '+roles['anon']+";SELECT public.luvipro_marketplace_buyer_check_v1('list')",fail=True);ok('anonymous requests and reads denied')
 events=int(sql('SELECT count(*) FROM public.luvipro_marketplace_buyer_check_events'));assert events==6;assert len(action(buyer,'history',r)['items'])==6;action(outsider,'history',r,fail=True);ok('each successful transition audited exactly once')
 r=action(buyer,'cancel',r,p_note='Synthetic buyer cancellation');assert r['status']=='cancelled';action(other,'complete',r,p_confirm=True,p_note='Synthetic invalid completion',fail=True);ok('cancellation terminal, history retained')
 before=sql('SELECT count(*) FROM public.inspections');rollback=(ROOT/'docs/sql/marketplace-buyer-check-containment.sql').read_text(encoding='utf-8')
 for a,b in roles.items():rollback=re.sub(r'\b'+a+r'\b',b,rollback)
 sql(rollback);action(buyer,'list',fail=True);assert sql('SELECT count(*) FROM public.inspections')==before and sql('SELECT count(*) FROM public.luvipro_marketplace_buyer_checks')=='1';ok('containment disables new entry points without record loss')
 result={'passed':len(checks),'failed':0,'checks':checks,'scope':'Synthetic local PostgreSQL; no Auth emails, real appointment, payment, Storage or client runtime.'};Path(r'C:\LUVIPRO_Workspace\readiness\ux_marketplace_20261101\buyer_check_test_results.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
'''
cleanup='''
finally:
 if made:sql('DROP DATABASE '+db+' WITH(FORCE)',database='postgres')
 for r in created:sql('DROP ROLE '+r,database='postgres')
'''
exec(compile(prefix+test+cleanup,__file__,'exec'))
