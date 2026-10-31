// Network smoke-test exactly the media URLs deployed in the preview.
import {readFileSync} from "node:fs";
const source=readFileSync("src/lib/semantic-film-clips.ts","utf8");
const urls=[...source.matchAll(/src: "(https:\/\/videos\.pexels\.com\/video-files\/[^"]+\.mp4)"/g)].map(m=>m[1]);
if(urls.length!==7)throw Error("Expected 7 semantically mapped stock videos, got "+urls.length);
let failed=false;
const checks=await Promise.all(urls.map(async(url)=>{
 try{
  const res=await fetch(url,{headers:{"Range":"bytes=0-255"},signal:AbortSignal.timeout(15000)});
  const reader=res.body?.getReader();
  const first=await reader?.read();
  await reader?.cancel();
  const bytes=first?.value||new Uint8Array(0);
  const validMagic=bytes.length>=8&&String.fromCharCode(...bytes.slice(4,8))==="ftyp";
  if(!res.ok||!res.headers.get("content-type")?.includes("video/mp4")||!validMagic)
    throw Error("HTTP "+res.status+" content-type="+res.headers.get("content-type")+" magic="+validMagic);
  console.log("VERIFIED_MP4",url);
  return true;
 }catch(err){console.error("BROKEN_MP4",url,String(err));failed=true;return false;}
}));
if(failed||checks.some(x=>!x))process.exit(1);
console.log("All seven semantic vehicle/inspection videos verified.");
