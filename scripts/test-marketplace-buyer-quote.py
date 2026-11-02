from pathlib import Path
import ast
base=(Path(__file__).parent/'test-marketplace-buyer-check.py').read_text(encoding='utf-8')
setup=base.split("test=r")[0]
ns={'__file__':str(Path(__file__).parent/'test-marketplace-buyer-check.py')};exec(setup,ns)
tree=ast.parse(base);t=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(x,ast.Name) and x.id=='test' for x in n.targets))
prefix=ns['prefix']+t.split(' partners=json.loads')[0]
test=r'''
 q=(ROOT/'supabase/migrations/20261102061240_marketplace_buyer_quote_context_v1.sql').read_text(encoding='utf-8')
 for a,b in roles.items():q=re.sub(r'\b'+a+r'\b',b,q)
 sql(q);ok('quote context migration applies without rewriting existing requests')
 r=action(buyer,'create',p_listing=lid,p_partner=other,p_request=request,p_product='inspection_premium')
 def context(uid=buyer,fail=False):
  result=run(uid,f"SELECT public.luvipro_marketplace_buyer_quote_v1('{r['id']}')",fail)
  return result if fail else json.loads(result)
 context(fail=True);ok('unaccepted request cannot start pricing handoff')
 r=action(seller,'seller_accept',r,p_confirm=True);context(fail=True);ok('seller consent alone cannot bypass workshop acceptance')
 r=action(other,'partner_accept',r,p_confirm=True);d=context();assert d['product']=='inspection_premium' and d['partner']['partner_user_id']==other and d['quote_only'] and not d['commercial_enabled'];ok('accepted request resolves exact existing product and current workshop, quote-only')
 assert 'PRIVATE' not in json.dumps(d);ok('no inspection findings, Partner documents or notes exposed')
 context(seller,True);context(admin,True);context(other,True);ok('only requesting buyer can access own checkout context, no implicit Admin/seller purchase')
 sql(f"UPDATE public.users SET status='suspended' WHERE id='{other}'");context(fail=True);sql(f"UPDATE public.users SET status='active' WHERE id='{other}'");ok('current workshop suspension blocks stale handoff')
 r=action(buyer,'cancel',r,p_note='SYNTHETIC cancellation evidence');context(fail=True);ok('cancelled request cannot be priced as accepted')
 sql('SET ROLE '+roles['anon']+f";SELECT public.luvipro_marketplace_buyer_quote_v1('{r['id']}')",fail=True);ok('anonymous access denied')
 before=sql('SELECT count(*) FROM public.luvipro_marketplace_buyer_checks');q=(ROOT/'docs/sql/marketplace-buyer-quote-containment.sql').read_text(encoding='utf-8')
 for a,b in roles.items():q=re.sub(r'\b'+a+r'\b',b,q)
 sql(q);context(fail=True);assert sql('SELECT count(*) FROM public.luvipro_marketplace_buyer_checks')==before;ok('containment removes only new handoff permission, preserves requests')
 result={'passed':len(checks),'failed':0,'checks':checks,'scope':'Synthetic PostgreSQL only; no real booking, order, quote-price/payment or mobile/web runtime verification.'};Path(r'C:\LUVIPRO_Workspace\readiness\ux_marketplace_20261101\buyer_quote_test_results.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
'''
cleanup='''
finally:
 if made:sql('DROP DATABASE '+db+' WITH(FORCE)',database='postgres')
 for r in created:sql('DROP ROLE '+r,database='postgres')
'''
exec(compile(prefix+test+cleanup,__file__,'exec'))
