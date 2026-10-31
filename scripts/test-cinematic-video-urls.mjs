// Preview video smoke check. Verify exactly the unique licensed MP4 sources used by UI.
const urls=[
  "https://videos.pexels.com/video-files/5258413/5258413-hd_1920_1080_25fps.mp4",
  "https://videos.pexels.com/video-files/10433645/10433645-hd_1920_1080_25fps.mp4",
  "https://videos.pexels.com/video-files/1192116/1192116-sd_640_360_30fps.mp4",
];
let passed=0;
for(const url of urls){
 try {
   const res=await fetch(url,{
     headers:{Range:"bytes=0-255","User-Agent":"Mozilla/5.0 (compatible; LUVIPRO media test)"},
     signal:AbortSignal.timeout(15000),
   });
   const mime=res.headers.get("content-type")||"";
   const reader=res.body?.getReader();
   const chunk=await reader?.read();
   await reader?.cancel();
   const bytes=chunk?.value||new Uint8Array(0);
   const valid=bytes.length>=8&&String.fromCharCode(...bytes.slice(4,8))==="ftyp";
   if(!res.ok||!mime.includes("video/mp4")||!valid)throw Error("Bad MP4: HTTP "+res.status+" "+mime+" magic="+valid);
   console.log("VERIFIED",res.status,url);
   passed++;
 }catch(err){console.error("FAILED",url,String(err));}
}
if(passed!==urls.length)process.exit(1);
console.log("All real-video stock MP4 sources validated.");
