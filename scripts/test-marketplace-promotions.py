"""Promotion state/money/visibility only; synthetic disposable PostgreSQL, no real payments."""
from pathlib import Path
import ast
def literal_test(name):
 tree=ast.parse((Path(__file__).parent/name).read_text(encoding='utf-8'))
 return next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='test' for t in n.targets))
base=(Path(__file__).parent/'test-marketplace-operations-postgres.py').read_text(encoding='utf-8')
prefix=base.split(' vehicle=sql(')[0].replace('text=True,capture_output=True)',"text=True,encoding='utf-8',capture_output=True)")
prefix+=literal_test('test-marketplace-dealer.py').split(' def public(')[0]
prefix+=literal_test('test-marketplace-buyer-check.py').split(' def action(')[0]
test=r'''
 sql("CREATE SCHEMA luvipro_security;CREATE FUNCTION luvipro_security.phase2_can_read(i uuid)RETURNS boolean LANGUAGE sql AS $$SELECT false$$")
 for filename in ['20261101142825_marketplace_assist_and_offers_v1.sql','20261102053405_marketplace_promotions_v1.sql']:
  q=(ROOT/'supabase/migrations'/filename).read_text(encoding='utf-8')
  for a,b in roles.items():q=re.sub(r'\b'+a+r'\b',b,q)
  sql(q)
 ok('promotion migration applies after current Dealer/Buyer/settings without record rewrite')
 def promo(uid,kind,record=None,**kw):
  fail=kw.pop('fail',False);params=dict(p_action=kind,**kw)
  if record:params.update(p_id=record['id'],p_revision=record['revision'])
  if kind=='create':
   catalog=promo(seller,'catalog',p_listing=lid);quoted=next((x for x in catalog['items'] if x['id']==params.get('p_product')),{});params.setdefault('p_revision',catalog['revision']);params.setdefault('p_amount',quoted.get('gross_cents'))
  args=[]
  for k,v in params.items():
   value='NULL' if v is None else 'true' if v is True else 'false' if v is False else str(v) if isinstance(v,int) else j(v) if isinstance(v,dict) else "'"+str(v).replace("'","''")+"'"
   args.append(k+'=>'+value)
  query='SELECT public.luvipro_marketplace_promotion_v1('+','.join(args)+')'
  value=sql('SET ROLE '+roles['anon']+';'+query,fail=True) if uid is None and fail else sql('SET ROLE '+roles['anon']+';'+query).splitlines()[-1] if uid is None else run(uid,query,fail)
  return value if fail else json.loads(value)
 catalog=promo(seller,'catalog',p_listing=lid);assert catalog['price_basis']=='unapproved' and not catalog['commercial_enabled'] and len(catalog['items'])==3 and not any(x['available']for x in catalog['items']);ok('candidate prices explicitly provisional, all commercial sales inactive')
 sql('UPDATE public.luvipro_marketplace_settings SET promotions_enabled=true',fail=True);ok('commercial flag cannot enable without approved tax basis and evidence')
 request=str(uuid.uuid4());promo(seller,'create',p_listing=lid,p_product='boost',p_request=request,p_external_confirmed=True,fail=True);ok('no live order/obligation even with client payment assertion while globally disabled')
 assert promo(None,'public')['items']==[];promo(None,'list',fail=True);promo(None,'catalog',p_listing=lid,fail=True);ok('public gets no private orders or catalog, inactive ads empty')
 run(seller,'SELECT * FROM public.luvipro_marketplace_promotions',True);run(seller,'SELECT * FROM public.luvipro_marketplace_promotion_events',True);ok('raw financial/audit tables client-inaccessible')
 run(admin,f"SELECT public.luvipro_marketplace_config_v1({j({'promotions_enabled':True})},1,'Synthetic unauthorized gate change')",True);ok('normal Admin configuration RPC cannot activate commercial gate')
 # Only this disposable fixture approves a fake tax policy and payment evidence.
 sql("UPDATE public.luvipro_marketplace_settings SET promotions_enabled=true,promotion_price_basis='gross',promotion_vat_bps=1900,promotion_approval_reference='SYNTHETIC LOCAL TEST APPROVAL ONLY',boost_products=jsonb_set(boost_products,'{0,enabled}','true')")
 promo(seller,'create',p_listing=lid,p_product='boost',p_request=request,p_amount=1,fail=True);promo(seller,'create',p_listing=lid,p_product='boost',p_request=request,p_revision=999,fail=True);ok('client cannot accept a forged or stale server price/configuration')
 order=promo(seller,'create',p_listing=lid,p_product='boost',p_request=request,p_external_confirmed=True)
 assert promo(seller,'catalog',p_listing=lid)['items'][0]['gross_cents']==1349
 assert order['status']=='pending_payment' and not order['payment_verified'] and order['gross_cents']==1349 and order['net_cents']==1134 and order['vat_cents']==215;ok('exact approved gross-inclusive tax split, order/client claim never grants activation')
 assert promo(seller,'create',p_listing=lid,p_product='boost',p_request=request)['id']==order['id'];ok('same order request idempotent')
 promo(seller,'create',p_listing=lid,p_product='turbo',p_request=request,fail=True);promo(seller,'create',p_listing=lid,p_product='boost',p_request=str(uuid.uuid4()),fail=True);ok('conflicting idempotency payload and duplicate pending order rejected')
 promo(buyer,'create',p_listing=lid,p_product='boost',p_request=str(uuid.uuid4()),fail=True);ok('only exact listing owner may order promotion')
 assert not promo(None,'public')['items'];ok('pending unpaid order never appears in sponsored slots')
 today=sql('SELECT current_date::text');reference='SYNTHETIC-BANK-ONE'
 evidence=dict(p_payment_date=today,p_reference=reference,p_amount=1349,p_external_confirmed=True,p_note='Synthetic external transfer evidence')
 promo(seller,'confirm_payment',order,**evidence,fail=True);ok('seller cannot self-confirm payment')
 for change in [dict(p_external_confirmed=False),dict(p_amount=1),dict(p_payment_date='2099-01-01'),dict(p_reference='x')]:
  promo(admin,'confirm_payment',order,**(evidence|change),fail=True)
 ok('Admin payment requires real-confirmation checkbox, exact amount, date and unique reference shape')
 order=promo(admin,'confirm_payment',order,**evidence);assert order['payment_verified'] and order['status']=='active' and order['paid_by']==admin;ok('manual verified confirmation activates exactly one dated interval')
 assert promo(admin,'history',order)['items'][-1]['actor_uid']==admin and promo(seller,'history',order)['items'][-1]['actor_uid'] is None;assert promo(seller,'list')['summary']['gross_received_cents']==1349;ok('Admin audit identifies operator; receipt summary is server-calculated and owner-scoped')
 events=sql('SELECT count(*) FROM public.luvipro_marketplace_promotion_events');again=promo(admin,'confirm_payment',order,**evidence);assert again['id']==order['id'] and sql('SELECT count(*) FROM public.luvipro_marketplace_promotion_events')==events;ok('payment confirmation retry has no duplicate financial/audit effect')
 overlap=promo(seller,'create',p_listing=lid,p_product='boost',p_request=str(uuid.uuid4()));promo(admin,'confirm_payment',overlap,**(evidence|{'p_reference':'SYNTHETIC-OVERLAP-TWO'}),fail=True);promo(seller,'cancel',overlap,p_note='Synthetic overlap order cancellation');ok('overlapping paid intervals cannot double-charge for the same placement')
 otherdata=dict(d,price_cents='10000');otherlisting=json.loads(run(seller,f"SELECT public.luvipro_marketplace_save_v1(NULL,NULL,'{vehicle}','{report}',{j(otherdata)})"));otherid=otherlisting['id'];sql(f"INSERT INTO public.luvipro_marketplace_photos(listing_id,object_path,category,position,mime_type,bytes) VALUES('{otherid}','synthetic/unpaid.jpg','front',0,'image/jpeg',100)");otherlisting=json.loads(run(seller,f"SELECT public.luvipro_marketplace_state_v1('{otherid}',{otherlisting['revision']},'submit')"));run(admin,f"SELECT public.luvipro_marketplace_state_v1('{otherid}',{otherlisting['revision']},'approve','Synthetic other listing approval')")
 assert promo(None,'public',p_filters={'sort':'price_asc'})['items'][0]['id']==lid;assert not promo(None,'public',p_filters={'listing_id':otherid})['items'];ok('sponsored projection matches actual paid listing, not first unrelated organic result')
 sponsored=promo(None,'public');assert len(sponsored['items'])==1 and sponsored['items'][0]['id']==lid and sponsored['items'][0]['sponsored'];assert not any(x in json.dumps(sponsored)for x in ['bank_reference','seller_uid','SECRET','report_url']);ok('actual separate sponsored placement exposes only safe listing projection')
 assert not promo(None,'public',p_filters={'max_price':1})['items'];ok('sponsored vehicles honor the same buyer price filters')
 publication=sql(f"SELECT published_at FROM public.luvipro_marketplace_listings WHERE id='{lid}'")
 order=promo(admin,'suspend',order,p_note='Synthetic reviewed suspension');assert not promo(None,'public')['items'];ok('Admin suspension immediately stops sponsored visibility')
 start=order['starts_at'];end=order['ends_at'];order=promo(admin,'resume',order,p_note='Synthetic reviewed resumption');assert order['starts_at']==start and order['ends_at']==end;ok('resume does not fake publication or restart paid duration')
 for status in ['paused','sold','archived']:
  sql(f"SELECT set_config('request.jwt.claim.sub','{admin}',false);UPDATE public.luvipro_marketplace_listings SET status='{status}' WHERE id='{lid}'");assert not promo(None,'public')['items'];sql(f"SELECT set_config('request.jwt.claim.sub','{admin}',false);UPDATE public.luvipro_marketplace_listings SET status='published' WHERE id='{lid}'")
 ok('paused/sold/archived listing immediately loses sponsorship')
 sql(f"UPDATE public.vehicles SET user_id='{buyer}' WHERE id='{vehicle}'");assert not promo(None,'public')['items'];sql(f"UPDATE public.vehicles SET user_id='{seller}' WHERE id='{vehicle}'");ok('lost seller authorization/report eligibility immediately stops paid placement')
 order=promo(admin,'suspend',order,p_note='Synthetic temporary package hold')
 sql("UPDATE public.luvipro_marketplace_settings SET boost_products=jsonb_set(boost_products,'{0,enabled}','false')");assert not promo(None,'public')['items'];promo(admin,'resume',order,p_note='Synthetic disabled package resume',fail=True);sql("UPDATE public.luvipro_marketplace_settings SET boost_products=jsonb_set(boost_products,'{0,enabled}','true')");order=promo(admin,'resume',order,p_note='Synthetic restored package resume');ok('package deactivation prevents resumed placement and retains financial history')
 sql(f"UPDATE public.luvipro_marketplace_promotions SET starts_at=now()-interval '2 days',ends_at=now()-interval '1 day' WHERE id='{order['id']}'")
 assert not promo(None,'public')['items'] and next(x for x in promo(seller,'list')['items'] if x['id']==order['id'])['effective_status']=='expired';ok('server-clock expiry automatic on read, no cron/manual action needed for visibility')
 sql(f"UPDATE public.luvipro_marketplace_promotions SET starts_at=now()+interval '1 day',ends_at=now()+interval '8 days' WHERE id='{order['id']}'")
 assert not promo(None,'public')['items'] and next(x for x in promo(seller,'list')['items'] if x['id']==order['id'])['effective_status']=='scheduled';ok('future scheduled interval does not display early')
 sql(f"UPDATE public.luvipro_marketplace_promotions SET starts_at=now(),ends_at=now()+interval '7 days' WHERE id='{order['id']}'")
 assert sql(f"SELECT published_at FROM public.luvipro_marketplace_listings WHERE id='{lid}'")==publication;ok('all promotion changes preserve original publication date and organic sorting')
 assert not promo(buyer,'list')['items'] and len(promo(seller,'list')['items'])==2;promo(buyer,'history',order,fail=True);ok('financial history remains owner-isolated')
 assert not promo(admin,'list')['items'] and len(promo(admin,'admin_list',p_note='Synthetic Admin financial review')['items'])==2;promo(buyer,'admin_list',p_note='Synthetic forged Admin financial review',fail=True);ok('Admin finance is explicit authorized/audited scope, personal inbox stays personal')
 promo(admin,'reverse',order,p_payment_date=today,p_reference='SYNTHETIC-REFUND-ONE',p_amount=1349,p_external_confirmed=False,p_note='Synthetic actual refund evidence',fail=True);ok('refund state cannot be invented without explicit external confirmation')
 order=promo(admin,'reverse',order,p_payment_date=today,p_reference='SYNTHETIC-REFUND-ONE',p_amount=1349,p_external_confirmed=True,p_note='Synthetic actual refund evidence');assert order['status']=='reversed' and order['bank_reference']==reference and not promo(None,'public')['items'];ok('externally recorded reversal stops ads and preserves original payment record')
 second=promo(seller,'create',p_listing=lid,p_product='boost',p_request=str(uuid.uuid4()));promo(admin,'confirm_payment',second,**evidence,fail=True);ok('same bank reference cannot confirm a second order')
 # Net-based approval is separate and explicitly tested; never silently add VAT to gross candidates.
 second=promo(seller,'cancel',second,p_note='Synthetic unpaid cancellation')
 sql("UPDATE public.luvipro_marketplace_settings SET promotion_price_basis='net'")
 third=promo(seller,'create',p_listing=lid,p_product='boost',p_request=str(uuid.uuid4()));assert promo(seller,'catalog',p_listing=lid)['items'][0]['gross_cents']==1605
 assert third['net_cents']==1349 and third['vat_cents']==256 and third['gross_cents']==1605;ok('net-approved configuration computes VAT once; original gross orders unchanged')
 before=sql('SELECT count(*) FROM public.luvipro_marketplace_promotions');rollback=(ROOT/'docs/sql/marketplace-promotions-containment.sql').read_text(encoding='utf-8')
 for a,b in roles.items():rollback=re.sub(r'\b'+a+r'\b',b,rollback)
 sql(rollback);promo(None,'public',fail=True);assert sql('SELECT count(*) FROM public.luvipro_marketplace_promotions')==before;ok('containment stops new entry points without deleting paid/order/audit records')
 result={'passed':len(checks),'failed':0,'checks':checks,'scope':'Synthetic PostgreSQL with simulated external bank evidence only. No real payment, bank transfer, invoice, Auth session or client runtime.'};Path(r'C:\LUVIPRO_Workspace\readiness\ux_marketplace_20261101\promotion_test_results.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
'''
cleanup='''
finally:
 if made:sql('DROP DATABASE '+db+' WITH(FORCE)',database='postgres')
 for r in created:sql('DROP ROLE '+r,database='postgres')
'''
exec(compile(prefix+test+cleanup,__file__,'exec'))
