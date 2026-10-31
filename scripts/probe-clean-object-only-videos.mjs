// Candidate-only probe: DO NOT display unverified automotive media on the website.
// Videos selected by *subject description*: object-only engine, headlight, paint,
// wheel and vehicle components. Final review must also check for visible people,
// writing, logos and brand marks before any production deployment.
const videoIds = {
  tailRed:9737964,
  carExhaust:5611523,
  garageTail:6159285,
  smokeExhaust:6160051,
  exhaustSports:5309321,
  rainWindow:19662487,
  raindropWindow:10541023,
  exhaustInGarage:8078914,
  windshieldDrive:15660166,
  carWindshieldRain:9101557,
  closePaintwork:6159183,
  polishPaint:4822920,
  carMirror:8033487,
  roadMirror:5446259,
  desertMirror:11169164,
  chromeMirror:3066465,
  rainyCarWindow:34796494,
};
const patterns = [
 "hd_1920_1080_30fps","hd_1920_1080_25fps","hd_1920_1080_24fps",
 "hd_1280_720_30fps","hd_1280_720_25fps","hd_1280_720_24fps",
 "sd_640_360_30fps","sd_640_360_25fps","sd_640_360_24fps",
 "hd_1080_1920_30fps","hd_1080_1920_25fps","hd_1080_1920_24fps",
];
const results=[];
async function probeOne(label,id){
  for(let i=0;i<patterns.length;i+=4){
    const p=patterns.slice(i,i+4);
    const v=await Promise.all(p.map(async variant=>{
      const url=`https://videos.pexels.com/video-files/${id}/${id}-${variant}.mp4`;
      try {
        const res=await fetch(url,{headers:{"Range":"bytes=0-63"},signal:AbortSignal.timeout(8000)});
        const reader=res.body?.getReader();const b=(await reader?.read())?.value||new Uint8Array(0);await reader?.cancel();
        if(res.ok && res.headers.get("content-type")?.includes("video/mp4") && b.length>=8 && String.fromCharCode(...b.slice(4,8))==="ftyp"){
          return {id,label,url,bytes:res.headers.get("content-range")?.split("/")?.[1]||"unknown"};
        }
      } catch {} return null;
    }));
    if(v.some(Boolean)){results.push(v.find(Boolean));return;}
  }
  console.log("UNAVAILABLE",label,id);
}
const items=Object.entries(videoIds);
for(let i=0;i<items.length;i+=5)await Promise.all(items.slice(i,i+5).map(([label,id])=>probeOne(label,id)));
console.log("VIDEO_RESULTS="+JSON.stringify(results));
if(results.length<9)process.exit(1);
