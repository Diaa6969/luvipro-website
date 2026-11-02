"""Read-only verification: existing paths stay in memory; HEAD requests download no media."""
import subprocess,json,os,urllib.request,urllib.error
from pathlib import Path
psql=r'C:\Program Files\PostgreSQL\17\bin\psql.exe'
q="""SELECT coalesce(jsonb_agg(x),'[]') FROM (
 SELECT b.id AS bucket,b.public,(SELECT o.name FROM storage.objects o WHERE o.bucket_id=b.id ORDER BY o.id LIMIT 1) AS name
 FROM storage.buckets b WHERE b.id IN('inspection-reports','inspection-videos','inspection-photos','inspection_photos') ORDER BY b.id)x;"""
env=dict(os.environ,PGSSLMODE='require')
r=subprocess.run([psql,'-X','-w','-h','aws-1-eu-central-1.pooler.supabase.com','-p','5432','-U','postgres.nfjyxutozrbgkujedoke','-d','postgres','-At','-v','ON_ERROR_STOP=1'],input=q,text=True,capture_output=True,env=env)
if r.returncode:raise RuntimeError('Read-only production metadata query failed; no credentials displayed')
rows=json.loads(r.stdout.strip());results=[]
from urllib.parse import quote
for x in rows:
 entry={'bucket':x['bucket'],'private':not x['public'],'legacy_head':'NOT TESTED: bucket empty'}
 if x['name']:
  url='https://nfjyxutozrbgkujedoke.supabase.co/storage/v1/object/public/'+quote(x['bucket'],safe='')+'/'+quote(x['name'],safe='/')
  try:
   with urllib.request.urlopen(urllib.request.Request(url,method='HEAD'),timeout=20) as response:status=response.status
  except urllib.error.HTTPError as error:status=error.code
  entry.update(legacy_status=status,legacy_head='PASS' if status in [400,401,403,404] else 'FAIL')
 results.append(entry)
out={'scope':'Actual production read-only metadata and anonymous HEAD to one existing object per populated bucket. No file bodies, signed URLs or credentials logged. Does not prove authorized retrieval or CDN-wide cache expiry.','results':results}
Path(r'C:\LUVIPRO_Workspace\readiness\ux_marketplace_20261101\private_legacy_media_results.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
print(json.dumps(out))
if any(x['legacy_head']=='FAIL' or not x['private'] for x in results):raise SystemExit(1)
