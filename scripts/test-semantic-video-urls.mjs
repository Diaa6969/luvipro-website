// Network smoke-test exactly the media URLs deployed in the preview.
import {readFileSync} from "node:fs";
const source=readFileSync("src/lib/semantic-film-clips.ts","utf8");
const urls=[...source.matchAll(/src: "(https:\/\/videos\.pexels\.com\/video-files\/[^"]+\.mp4)"/g)].map(m=>m[1]);
if(urls.length!==17)throw Error("Expected 17 object-only unique stock videos, got "+urls.length);
if(new Set(urls).size !== urls.length)throw Error("A video source is repeated; every visible clip must be unique");
let failed=false;
const checks=await Promise.all(urls.map(async(url)=>{
 try{
  const res=await fetch(url,{headers:{"Range":"bytes=0-255"},signal:AbortSignal.timeout(15000)});
  const reader=res.body?.getReader();
  const chunks=[];let total=0;
  while(reader && total<12){
    const chunk=await reader.read();
    if(chunk.done)break;
    chunks.push(Buffer.from(chunk.value));total+=chunk.value.length;
  }
  await reader?.cancel();
  const bytes=Buffer.concat(chunks);
  const validMagic=bytes.length>=8&&bytes.toString("ascii",4,8)==="ftyp";
  if(!res.ok||!res.headers.get("content-type")?.includes("video/mp4")||!validMagic)
    throw Error("HTTP "+res.status+" content-type="+res.headers.get("content-type")+" magic="+validMagic);
  console.log("VERIFIED_MP4",url);
  return true;
 }catch(err){console.error("BROKEN_MP4",url,String(err));failed=true;return false;}
}));
if(failed||checks.some(x=>!x))process.exit(1);
console.log("All seventeen unique people-free candidate car-object MP4 sources have valid headers.");
