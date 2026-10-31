// Visual QA helper, preview only: downloads 9 CDN MP4s, extracts 2 actual video
// frames per asset, tiles a compact contact sheet, outputs short base64 chunks.
// Human reviewer must examine people, written overlays, third-party brand logos.
import {readFileSync,writeFileSync,mkdtempSync,rmSync,readFileSync as read,existsSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
const records = [
  {
    "name": "turboEngine",
    "url": "https://videos.pexels.com/video-files/4101732/4101732-hd_1920_1080_25fps.mp4"
  },
  {
    "name": "racingEngine",
    "url": "https://videos.pexels.com/video-files/13358202/13358202-hd_1080_1920_30fps.mp4"
  },
  {
    "name": "headlightCloseup",
    "url": "https://videos.pexels.com/video-files/11330902/11330902-sd_640_360_25fps.mp4"
  }
];
const dir=mkdtempSync(join(tmpdir(),"luvi-visual-audit-"));
function ff(args){
 const r=spawnSync("ffmpeg",["-hide_banner","-loglevel","error","-nostdin","-y",...args],{timeout:40000,encoding:"utf8"});
 if(r.status!==0)throw Error(("ffmpeg status="+r.status+" error="+String(r.error||"")+" stderr="+String(r.stderr||"")+" args="+args.join(" ")).slice(0,1100));
}
try{
 for(let i=0;i<records.length;i++){
   const {name,url}=records[i];
   const res=await fetch(url,{signal:AbortSignal.timeout(25000)});
   if(!res.ok)throw Error("Unavailable "+name+": "+res.status);
   const bytes=Buffer.from(await res.arrayBuffer());
   const infile=join(dir,"source-"+i+".mp4");
   writeFileSync(infile,bytes);
   for(let j=0;j<2;j++){
     const out=join(dir,`frame-${String(i*2+j).padStart(2,"0")}.jpg`);
     ff(["-ss",j===0?"0.45":"2.05","-i",infile,"-frames:v","1","-vf","scale=300:170:force_original_aspect_ratio=increase,crop=300:170","-q:v","5",out]);
     if(!existsSync(out))throw Error("Thumbnail missing "+name);
   }
   console.log("CANDIDATE_ORDER",i,name,bytes.length);
 }
 const out=join(dir,"contact.jpg");
 ff(["-framerate","1","-pattern_type","glob","-i",join(dir,"frame-*.jpg"),"-vf","tile=3x2:padding=3:margin=3:color=black","-frames:v","1","-q:v","8",out]);
 const b64=read(out).toString("base64");
 console.log("CANDIDATE_SHEET_BEGIN");
 for(let i=0;i<b64.length;i+=1600)console.log("CANDIDATE_CHUNK "+b64.slice(i,i+1600));
 console.log("CANDIDATE_SHEET_END");
}catch(e){console.error("AUDIT_FAILED",String(e));process.exitCode=1}
finally{rmSync(dir,{recursive:true,force:true})}
