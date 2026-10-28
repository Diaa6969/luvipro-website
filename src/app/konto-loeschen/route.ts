// Same existing LUVIPRO site. No cookies, server credential handling or analytics.
export const dynamic = "force-static";
const html = String.raw`<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-QUxasIMDY71X9HUSejmkCF3RB9l/Sa2dIqy5s6Dl0JY='; style-src 'unsafe-inline'; connect-src https://nfjyxutozrbgkujedoke.supabase.co; base-uri 'none'; form-action 'self'">
<title>LUVIPRO – Konto löschen</title>
<style>body{font:16px system-ui;background:#f5f3fa;color:#0f172a;margin:0}main{max-width:520px;margin:40px auto;padding:24px;background:white;border-radius:16px}h1{color:#05091a}label{display:block;margin-top:18px}input:not([type=checkbox]){box-sizing:border-box;width:100%;padding:12px;font:inherit;color:#0f172a}button{margin-top:20px;padding:14px;width:100%;font:inherit;background:#7435d9;color:white;border:0;border-radius:10px}button:disabled{opacity:.5}a{color:#642fc0}#result{white-space:pre-line}</style></head>
<body><main><h1>LUVIPRO – Konto löschen</h1>
<p>Beantragen Sie hier die vollständige Löschung Ihres Kontos und der zugehörigen personenbezogenen Daten. Sie müssen die App dafür nicht installieren.</p>
<p>Der Antrag wird geprüft und anschließend bearbeitet. Es wird hier nichts automatisch gelöscht. Gesetzlich erforderliche Unterlagen werden nur im erforderlichen Umfang aufbewahrt; wir informieren Sie über die konkrete Aufbewahrung und den Abschluss.</p>
<form id="deletion-form"><label for="email">E-Mail-Adresse</label><input id="email" type="email" autocomplete="username" required maxlength="254">
<label for="password">Passwort zur Anmeldung</label><input id="password" type="password" autocomplete="current-password" required>
<label><input id="ack" type="checkbox" required> Ich beantrage die Löschung meines eigenen Kontos.</label>
<label for="confirmation">Zur Bestätigung: KONTO LOESCHEN</label><input id="confirmation" required autocomplete="off">
<button id="submit" type="submit">Löschung beantragen</button></form>
<p id="result" role="status" aria-live="polite"></p>
<p>Passwort vergessen? Nutzen Sie die Passwort-Wiederherstellung in LUVIPRO.</p>
<nav><a href="https://luvipro.de/datenschutz">Datenschutz</a> · <a href="https://luvipro.de/impressum">Impressum</a> · <a href="https://luvipro.de/">Startseite</a></nav></main>
<script>
'use strict';
const root='https://nfjyxutozrbgkujedoke.supabase.co';
const publicKey='sb_publishable_QmAHOldncjwn_IZGttAqRg_r-pDyGom';
const field=id=>document.getElementById(id);
let busy=false;
async function send(path,headers,body,readJson=true){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(root+path,{method:'POST',headers,body,signal:controller.signal,cache:'no-store',redirect:'error'});
  if(!response.ok)throw Error();
  return readJson?await response.json():null;
 }finally{clearTimeout(timer);}
}
field('deletion-form').addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 const result=field('result');
 if(!field('ack').checked||field('confirmation').value!=='KONTO LOESCHEN'){result.textContent='Bitte die Hinweise bestätigen und KONTO LOESCHEN eingeben.';return;}
 busy=true;field('submit').disabled=true;result.textContent='Antrag wird geprüft …';
 let token=null;
 try{
  const auth=await send('/auth/v1/token?grant_type=password',{apikey:publicKey,'Content-Type':'application/json'},JSON.stringify({email:field('email').value.trim().toLowerCase(),password:field('password').value}));
  field('password').value='';
  if(typeof auth.access_token!=='string'||!auth.user?.id||auth.user.is_anonymous)throw Error();token=auth.access_token;
  const saved=await send('/rest/v1/rpc/luvipro_request_account_deletion_v1',{apikey:publicKey,Authorization:'Bearer '+token,'Content-Type':'application/json'},JSON.stringify({p_confirmation:'KONTO LOESCHEN'}));
  // A freshly authenticated requester cannot prove identity erasure here.
  // Reject a contradictory completed status instead of announcing deletion.
  if(typeof saved.request_id!=='string'||!['pending_review','processing','cancelled'].includes(saved.status))throw Error();
  result.textContent=saved.status==='cancelled'?'Der gespeicherte Antrag wurde storniert. Bitte nutzen Sie die Kontaktangaben im Impressum.':'Ihr Löschantrag wurde gespeichert. Wiederholte Anfragen erzeugen keinen zweiten Antrag. Wir informieren Sie über Bearbeitung und Abschluss.';
  field('confirmation').value='';
 }catch{result.textContent='Der Antrag konnte nicht bestätigt werden. Bitte Anmeldung und Verbindung prüfen und erneut versuchen. Gespeicherte Anträge werden nicht dupliziert.';}
 finally{
  field('password').value='';
  if(token){try{await send('/auth/v1/logout?scope=local',{apikey:publicKey,Authorization:'Bearer '+token},undefined,false);}catch{}}
  token=null;busy=false;field('submit').disabled=false;
 }
});
</script></body></html>

`;
export function GET() {
 return new Response(html, {headers: {
  "Content-Type": "text/html; charset=utf-8",
  "Content-Security-Policy": "default-src 'none'; script-src 'sha256-QUxasIMDY71X9HUSejmkCF3RB9l/Sa2dIqy5s6Dl0JY='; style-src 'unsafe-inline'; connect-src https://nfjyxutozrbgkujedoke.supabase.co; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Robots-Tag": "noindex",
 }});
}
