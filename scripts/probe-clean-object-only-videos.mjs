// Candidate-only probe: DO NOT display unverified automotive media on the website.
// Videos selected by *subject description*: object-only engine, headlight, paint,
// wheel and vehicle components. Final review must also check for visible people,
// writing, logos and brand marks before any production deployment.
const videoIds = {
  nightHeadlight:28866453, tireCloseup:27668872, vintageEngine:31220517,
  darkEngine:25397914, engineDetails:31220643, palmHeadlight:5309342,
  headlightOn:4707143, sunsetHeadlight:11901729,
  beachHeadlight:5419070, movingWheel:8104040,
  gravelTire:29902177, cleanPaint:6157864,
  paintSurface:6157786, paintCloseup:6159202,
  paintGloss:6159204, paintDetailing:6157904,
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
