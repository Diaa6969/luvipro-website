"""Atomic photo replacement only: synthetic local PostgreSQL, no live upload claim."""
from pathlib import Path
import ast
base=(Path(__file__).parent/'test-marketplace-operations-postgres.py').read_text(encoding='utf-8')
prefix=base.split(' vehicle=sql(')[0].replace('text=True,capture_output=True)',"text=True,encoding='utf-8',capture_output=True)")
tree=ast.parse((Path(__file__).parent/'test-marketplace-dealer.py').read_text(encoding='utf-8'))
t=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(x,ast.Name) and x.id=='test' for x in n.targets))
prefix+=t.split(' def public(')[0]
test=r'''
 old=sql(f"SELECT id FROM public.luvipro_marketplace_photos WHERE listing_id='{lid}'")
 new=sql(f"INSERT INTO public.luvipro_marketplace_photos(listing_id,object_path,category,position,mime_type,bytes) VALUES('{lid}','synthetic/replacement.jpg','front',1,'image/jpeg',123) RETURNING id").splitlines()[0]
 assert sql(f"SELECT count(*) FROM public.luvipro_marketplace_photos WHERE listing_id='{lid}' AND removed_at IS NULL")=='2';ok('original retained while confirmed replacement is appended')
 run(buyer,f"SELECT public.luvipro_marketplace_photos_v1('{lid}',ARRAY['{new}','{old}']::uuid[],'{old}')",True);ok('cross-user replacement denied')
 run(seller,f"SELECT public.luvipro_marketplace_photos_v1('{lid}',ARRAY['{new}']::uuid[],'{old}')",True)
 assert sql(f"SELECT removed_at IS NULL FROM public.luvipro_marketplace_photos WHERE id='{old}'")=='t';ok('incomplete current order fails atomically without removing original')
 run(seller,f"SELECT public.luvipro_marketplace_photos_v1('{lid}',ARRAY['{new}','{old}']::uuid[],'{old}')")
 assert sql(f"SELECT id FROM public.luvipro_marketplace_photos WHERE listing_id='{lid}' AND removed_at IS NULL ORDER BY position")==new;ok('complete order plus remove atomically replaces cover photo')
 assert sql(f"SELECT count(*) FROM public.luvipro_marketplace_photos WHERE listing_id='{lid}'")=='2';ok('original metadata retained; no Storage object or record deletion')
 assert sql(f"SELECT status FROM public.luvipro_marketplace_listings WHERE id='{lid}'")=='draft';ok('replacement requires moderation again, never silently updates published ad')
 rows=json.loads(run(seller,f"SELECT public.luvipro_marketplace_photos_v1('{lid}')"))['items'];assert [x['id'] for x in rows]==[new];ok('retry can recognize original already removed and confirmed replacement still active')
 result={'passed':len(checks),'failed':0,'checks':checks,'scope':'Local synthetic PostgreSQL execution roles. Not real Auth, mobile chooser, compression or upload verification.'}
 Path(r'C:\LUVIPRO_Workspace\readiness\ux_marketplace_20261101\photo_replacement_test_results.json').write_text(json.dumps(result,indent=2),encoding='utf-8');print(json.dumps(result))
'''
cleanup='''
finally:
 if made:sql('DROP DATABASE '+db+' WITH(FORCE)',database='postgres')
 for r in created:sql('DROP ROLE '+r,database='postgres')
'''
exec(compile(prefix+test+cleanup,__file__,'exec'))
