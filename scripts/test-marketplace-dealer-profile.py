from pathlib import Path
import ast
base=(Path(__file__).parent/'test-marketplace-buyer-check.py').read_text(encoding='utf-8');ns={'__file__':str(Path(__file__).parent/'test-marketplace-buyer-check.py')};exec(base.split("test=r")[0],ns)
t=next(ast.literal_eval(n.value) for n in ast.parse(base).body if isinstance(n,ast.Assign) and any(isinstance(x,ast.Name) and x.id=='test' for x in n.targets));prefix=ns['prefix']+t.split(' def action(')[0]
test=r'''
 q=(ROOT/'supabase/migrations/20261102072813_marketplace_dealer_profile_v1.sql').read_text(encoding='utf-8')
 for a,b in roles.items():q=re.sub(r'\b'+a+r'\b',b,q)
 sql(q);ok('additive profile migration applies to existing Dealer/Partner/Buyer schema')
 def profile(uid,kind,rev=None,data=None,confirm=False,fail=False):
  q=f"SELECT public.luvipro_marketplace_dealer_profile_v1('{kind}','{location}',{j(data) if data is not None else 'NULL'},{rev if rev is not None else 'NULL'},'SYNTHETIC reviewed business publication',{'NULL' if confirm is None else 'true' if confirm else 'false'})"
  result=run(uid,q,fail);return result if fail else json.loads(result)
 def public():return json.loads(sql('SET ROLE '+roles['anon']+f";SELECT public.luvipro_marketplace_dealer_v1('{location}')").splitlines()[-1])
 assert len(profile(seller,'mine')['items'])==1 and not profile(buyer,'mine')['items'];ok('only current approved Partner gets own location editor')
 d={'business_description':'SYNTHETIC public workshop biography','website_url':'https://example.com/workshop','logo_url':'https://example.com/logo.png','public_consent':False}
 r=profile(seller,'save',0,d);assert r['status']=='draft' and public()['business_description'] is None;ok('draft public fields stay private')
 profile(buyer,'save',r['revision'],d,fail=True);profile(seller,'submit',r['revision'],d,fail=True);ok('other user edits and publication without explicit consent rejected')
 for u in ['https://example.supabase.co/storage/v1/object/public/inspection-photos/x.png','https://example.com/logo.png?token=secret','http://example.com/logo.png','https://127.0.0.1/x.png','https://private.local/x.png','https://example.com/logo.svg']:
  profile(seller,'save',r['revision'],dict(d,logo_url=u),fail=True)
 ok('private/signed/Supabase/internal/non-HTTPS/non-raster logo references denied')
 profile(seller,'save',r['revision'],dict(d,inspectors_notes='FORGED'),fail=True);ok('field allowlist cannot import private verification/report metadata')
 d['public_consent']=True;r=profile(seller,'submit',r['revision'],d);assert r['status']=='pending' and public()['logo_url'] is None;ok('submission remains private until separate Admin review')
 profile(seller,'approve',r['revision'],confirm=True,fail=True);profile(admin,'approve',r['revision'],confirm=False,fail=True);profile(admin,'approve',r['revision'],confirm=None,fail=True);ok('only Admin with actual explicit confirmation can approve; NULL cannot bypass')
 oldrev=r['revision'];r=profile(admin,'approve',r['revision'],confirm=True);p=public();assert p['business_description']==d['business_description'] and p['website_url']==d['website_url'] and p['logo_url']==d['logo_url'];assert 'review_note' not in p and 'owner_uid' not in p;ok('approved public projection exposes only consented business fields, not review identity/notes')
 profile(seller,'save',oldrev,d,fail=True);ok('stale owner edit cannot overwrite a reviewed revision')
 r=profile(seller,'save',r['revision'],dict(d,business_description='SYNTHETIC edited draft'));assert public()['business_description'] is None;ok('editing approved content requires reapproval, old approval not silently reused')
 r=profile(seller,'submit',r['revision'],d);r=profile(admin,'approve',r['revision'],confirm=True);r=profile(admin,'suspend',r['revision'],confirm=True);assert public()['logo_url'] is None;ok('Admin suspension removes public extras without deleting business/history')
 sql('SET ROLE '+roles['authenticated']+';SELECT * FROM public.luvipro_marketplace_dealer_profiles',fail=True);sql('SET ROLE '+roles['anon']+f";SELECT public.luvipro_marketplace_dealer_profile_v1('mine')",fail=True);ok('raw table and private editor inaccessible to anon/other client grants')
 q=(ROOT/'docs/sql/marketplace-dealer-profile-containment.sql').read_text(encoding='utf-8')
 for a,b in roles.items():q=re.sub(r'\b'+a+r'\b',b,q)
 sql(q);profile(seller,'mine',fail=True);assert sql('SELECT count(*) FROM public.luvipro_marketplace_dealer_profiles')=='1';assert 'business_description' not in public();ok('containment restores original public projection and retains submissions/history')
 result={'passed':len(checks),'failed':0,'checks':checks,'scope':'Local synthetic PostgreSQL roles/public URLs only; no real Partner content or external images published.'};Path(r'C:\LUVIPRO_Workspace\readiness\ux_marketplace_20261101\dealer_profile_test_results.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
'''
cleanup='''
finally:
 if made:sql('DROP DATABASE '+db+' WITH(FORCE)',database='postgres')
 for r in created:sql('DROP ROLE '+r,database='postgres')
'''
exec(compile(prefix+test+cleanup,__file__,'exec'))
