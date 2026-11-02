const videoIds={
  inspectionFlashlight:8470382,
  inspectionGarage:8986485,
  bodyPaintCloseup:6159202,
  bodyPaintPolish:6157904,
  bodyPaintSurface:6157786,
  mechanicTablet:6870341,
  obdDiagnostics:6870334,
  mechanicUnderCar:8987301,
  mechanicWorking:8986474,
  mechanicChecking:8986475,
  autoWorkshop:20693173,
  vehicleLift:6062877,
  carDocs:6637310,
  pdfDigitalTablet:32089998,
  servicePaint:6870338,
  carExterior:6159204,
};
const patterns=[
"hd_1920_1080_30fps","hd_1920_1080_25fps","hd_1920_1080_24fps",
"hd_1280_720_30fps","hd_1280_720_25fps","hd_1280_720_24fps",
"sd_640_360_30fps","sd_640_360_25fps","sd_640_360_24fps",
"hd_1080_1920_30fps","hd_1080_1920_25fps",
];
const results=[];
async function findVideo(label,id){
  const checked=[];
  for (let j=0;j<patterns.length;j+=4) {
    const group=patterns.slice(j,j+4);
    const matches=await Promise.all(group.map(async p=>{
      const url=`https://videos.pexels.com/video-files/${id}/${id}-${p}.mp4`;
      try{
        const r=await fetch(url,{method:"GET",headers:{"Range":"bytes=0-127"},
          signal:AbortSignal.timeout(7500)});
        const reader=r.body?.getReader();
        const chunk=await reader?.read();
        await reader?.cancel();
        const b=chunk?.value||new Uint8Array(0);
        const magic=b.length>=8 && String.fromCharCode(...b.slice(4,8))==="ftyp";
        if(r.ok && r.headers.get("content-type")?.includes("video/mp4") && magic){
          return {url,status:r.status,contentLength:r.headers.get("content-range")||r.headers.get("content-length")};
        }
        return null;
      }catch{return null;}
    }));
    const found=matches.find(Boolean);
    if(found){ console.log("VALID_VIDEO",label,JSON.stringify(found));results.push({label,...found});return; }
  }
  console.log("NO_VALID_CLIP",label,id);
}
const entries=Object.entries(videoIds);
for(let i=0;i<entries.length;i+=5) await Promise.all(entries.slice(i,i+5).map(([label,id])=>findVideo(label,id)));
console.log("CANDIDATE_RESULTS_JSON="+JSON.stringify(results));
if(results.length<4)process.exit(1);
