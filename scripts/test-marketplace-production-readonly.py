"""Read-only negative production checks. No credentials, account creation, or payments."""
import json,urllib.request,urllib.error
from pathlib import Path
url='https://nfjyxutozrbgkujedoke.supabase.co/functions/v1/marketplace-v1'
results=[]
for name,body,expected in [('anonymous_search',{'action':'read','mode':'search'},200),('anonymous_admin',{'action':'admin'},401),('anonymous_save',{'action':'save','data':{}},401),('unknown_private_photo',{'action':'photo','id':'33333333-3333-4333-8333-333333333333'},404),('arbitrary_rpc_denied',{'action':'execute_sql'},400),('anonymous_mandate_revocation',{'action':'authority','revoke':'33333333-3333-4333-8333-333333333333','evidence':'SYNTHETIC negative test'},401)]:
 request=urllib.request.Request(url,data=json.dumps(body).encode(),headers={'Content-Type':'application/json'},method='POST')
 try:
  with urllib.request.urlopen(request,timeout=30) as r:status=r.status;data=json.load(r);cache=r.headers.get('Cache-Control')
 except urllib.error.HTTPError as e:status=e.code;data=json.load(e);cache=e.headers.get('Cache-Control')
 assert status==expected,(name,status,data)
 if name=='anonymous_search':assert isinstance(data.get('items'),list) and 'total' in data,data
 assert cache=='no-store'
 results.append({'name':name,'status':status,'expected':expected,'cache':cache,'pass':True})
Path(r'C:\LUVIPRO_Workspace\readiness\marketplace_20261030\edge_v2_production_http_results.json').write_text(json.dumps(results,indent=2),encoding='utf8')
print(json.dumps({'passed':len(results),'failed':0,'scope':'Actual production HTTP; anonymous and denial scenarios only'}))
