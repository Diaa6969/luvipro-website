"use client";
export function AffiliateLogoutButton(){
 async function logout(){
  await fetch("/api/affiliate/session",{method:"DELETE",headers:{"Content-Type":"application/json"}}).catch(()=>{});
  window.location.assign("/affiliate/login");
 }
 return <button type="button" onClick={logout} className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10">Abmelden</button>;
}
