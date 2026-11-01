import {NextRequest,NextResponse} from 'next/server';
import {AFFILIATE_COOKIE} from '@/lib/affiliate/account';
import {isSameOrigin} from '@/lib/accounting/admin-auth';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 if(!isSameOrigin(req))return NextResponse.json({error:'Forbidden origin'},{status:403});
 const size=Number(req.headers.get('content-length')||0);
 if(size>4259840)return NextResponse.json({error:'Im Web maximal 4 MB je verarbeitetem Foto.'},{status:413});
 try{
  const reader=req.body?.getReader();if(!reader)throw Error('empty');let n=0;const parts:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>4259840){await reader.cancel();return NextResponse.json({error:'Im Web maximal 4 MB je verarbeitetem Foto.'},{status:413});}parts.push(value);}
  const body=new Uint8Array(n);let at=0;for(const p of parts){body.set(p,at);at+=p.length;}
  const token=req.cookies.get(AFFILIATE_COOKIE)?.value;
  const upstream=(authorization:string|undefined)=>fetch(process.env.SUPABASE_URL+'/functions/v1/marketplace-v1',{method:'POST',headers:{apikey:process.env.SUPABASE_ANON_KEY!,Authorization:'Bearer '+authorization,'Content-Type':req.headers.get('content-type')||'application/json'},body,cache:'no-store',signal:AbortSignal.timeout(60000)});
  let response=await upstream(token||process.env.SUPABASE_ANON_KEY);
  // A stale account cookie must not block the already-public catalog. Never
  // retry private reads, uploads or writes anonymously; the same live Edge/RPC
  // authorization still filters published eligible listings and their photos.
  if(response.status===401&&token&&(req.headers.get('content-type')||'').startsWith('application/json')){
   let publicRead=false;
   try{const request=JSON.parse(new TextDecoder().decode(body));publicRead=(request.action==='read'&&['search','detail'].includes(request.mode))||['report_offer','photo'].includes(request.action);}catch{/* Invalid input retains its original rejection. */}
   if(publicRead){await response.body?.cancel();response=await upstream(process.env.SUPABASE_ANON_KEY);}
  }
  return new NextResponse(await response.text(),{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Verbindung fehlgeschlagen. Bitte erneut versuchen.'},{status:503});}
}
