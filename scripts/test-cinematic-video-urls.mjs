// Probe alternative authentic Pexels commercial-stock MP4 URLs.
// This step never downloads more than the first chunk per video.
const candidates = {
  "garage-existing": "https://videos.pexels.com/video-files/857267/857267-hd_1920_1080_24fps.mp4",
  "detail-garage": "https://videos.pexels.com/video-files/32010526/32010526-hd_1080_1920_30fps.mp4",
  "night-traffic": "https://videos.pexels.com/video-files/10433645/10433645-hd_1920_1080_25fps.mp4",
  "traffic-demo": "https://videos.pexels.com/video-files/5834623/5834623-hd_1920_1080_25fps.mp4",
  "car-traffic": "https://videos.pexels.com/video-files/1192116/1192116-sd_640_360_30fps.mp4",
  "silver-car-garage": "https://videos.pexels.com/video-files/29498823/29498823-hd_1920_1080_24fps.mp4",
  "red-car-driveway": "https://videos.pexels.com/video-files/30763731/30763731-hd_1920_1080_30fps.mp4",
  "night-cars": "https://videos.pexels.com/video-files/5258413/5258413-hd_1920_1080_25fps.mp4",
};
let passed=0;
for (const [label,url] of Object.entries(candidates)) {
 try {
  const r=await fetch(url,{
    headers:{Range:"bytes=0-255","User-Agent":"Mozilla/5.0 (compatible; LUVIPRO media test)"},
    signal:AbortSignal.timeout(12000),
  });
  const t=r.headers.get("content-type")||"";
  const ok=r.ok&&(/video\/mp4|application\/octet-stream/i.test(t));
  const body=r.body?.getReader();
  const first=await body?.read();
  await body?.cancel();
  const b=first?.value||new Uint8Array(0);
  const ftyp=b.length>=8&&String.fromCharCode(...b.slice(4,8))==="ftyp";
  if(ok&&(ftyp||r.status===200)){
   passed++;console.log("PASS",label,r.status,t,url);
  }else console.error("FAIL",label,r.status,t,ftyp,url);
 } catch(e){console.error("FAIL",label,String(e).slice(0,90),url);}
}
console.log("Reachable authentic Pexels MP4 candidates:",passed,"/",Object.keys(candidates).length);
if(passed<4)process.exit(1);
