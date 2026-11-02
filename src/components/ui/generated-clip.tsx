"use client";

import { useEffect, useRef } from "react";
import type { GeneratedTheme } from "@/lib/semantic-film-clips";

/**
 * Eight ORIGINAL silent motion-graphic videos for VIN, PDF, privacy and data.
 * These do not contain people, trademarks, brand names, vehicle badges,
 * borrowed stock, letters, numbers or copyrighted UI. Every visual is drawn
 * live to a tiny canvas and delivered to a genuine <video> via captureStream.
 */
export function GeneratedClip({ theme }: { theme: GeneratedTheme }) {
  const node = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = node.current;
    if (!v || typeof document === "undefined") return;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const variants: GeneratedTheme[] = [
      "vinPulse","reportLayers","documentVeil","vinOrbit","pdfCascade",
      "privacyShield","ocrSweep","accessGate",
    ];
    const index = variants.indexOf(theme);
    const seeds = [
      [0.13,0.29,0.48,0.76],[0.21,0.47,0.59,0.83],
      [0.18,0.42,0.64,0.91],[0.08,0.33,0.61,0.72],
      [0.22,0.38,0.68,0.95],[0.15,0.35,0.56,0.86],
      [0.12,0.44,0.63,0.82],[0.17,0.31,0.55,0.78],
    ][Math.max(index,0)];
    let raf = 0;
    let last = 0;
    const draw = (time: number) => {
      if (time-last<65) { raf=requestAnimationFrame(draw);return; }
      last=time;
      const t=time/1000;
      const background=ctx.createLinearGradient(0,0,W,H);
      background.addColorStop(0,"#090f23");
      background.addColorStop(.52,index%2===0?"#211637":"#12203b");
      background.addColorStop(1,"#050c1c");
      ctx.fillStyle=background;ctx.fillRect(0,0,W,H);
      const glow=ctx.createRadialGradient(W*(.28+.32*Math.sin(t*.27)),H*.51,4,W*.53,H*.52,180);
      glow.addColorStop(0,"rgba(149,76,247,0.28)");
      glow.addColorStop(.45,"rgba(58,119,232,0.11)");
      glow.addColorStop(1,"rgba(9,11,30,0)");
      ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
      ctx.save();
      ctx.lineWidth=1.8;
      ctx.strokeStyle="rgba(133,176,248,.48)";
      ctx.fillStyle="rgba(92,93,204,.10)";
      if (theme==="vinPulse" || theme==="vinOrbit" || theme==="ocrSweep") {
        const yy=theme==="vinOrbit"?92:78;
        const drift=Math.sin(t*.65)*7;
        ctx.beginPath();ctx.roundRect(43,yy-25,235,69,16);ctx.stroke();
        for(let n=0;n<17;n++){
          const x=56+n*12.3;
          ctx.fillStyle=n===Math.floor((t*2)%17)?"rgba(74,228,255,.89)":"rgba(144,120,250,.25)";
          ctx.fillRect(x,yy-10+drift*.15,7,27);
        }
        if(theme==="vinOrbit"){
          ctx.beginPath();ctx.ellipse(160,91,123,62,0,0,Math.PI*2);ctx.stroke();
          ctx.strokeStyle="rgba(37,220,255,.60)";
          ctx.beginPath();ctx.arc(160,91,69,-t*.45,-t*.45+1.8);ctx.stroke();
        }
        if(theme==="ocrSweep"){
          const y=50+((t*18)%80);
          ctx.strokeStyle="rgba(79,224,253,.75)";
          ctx.beginPath();ctx.moveTo(33,y);ctx.lineTo(287,y);ctx.stroke();
        }
      } else if (theme==="reportLayers" || theme==="documentVeil" || theme==="pdfCascade") {
        for(let i=0;i<3;i++){
          const dx=81+i*10,dy=30+i*7+Math.sin(t*.75+i)*4;
          ctx.fillStyle="rgba(38,38,94,.32)";
          ctx.strokeStyle=i===2?"rgba(52,219,252,.68)":"rgba(151,118,253,.40)";
          ctx.beginPath();ctx.roundRect(dx,dy,136,112,9);ctx.fill();ctx.stroke();
          for(let j=0;j<4;j++){
            ctx.fillStyle=j===Math.floor((t*.9+i)%4)?"rgba(72,223,250,.65)":"rgba(150,152,225,.20)";
            ctx.fillRect(dx+17,dy+23+j*17,74+(j%2)*20,4);
          }
        }
        if(theme==="documentVeil"){
          ctx.save();ctx.translate(160,94);ctx.rotate(Math.sin(t*.4)*.12);
          ctx.strokeStyle="rgba(201,103,254,.42)";
          ctx.strokeRect(-104,-48,208,96);ctx.restore();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(160,26);ctx.bezierCurveTo(120,48,113,51,119,102);
        ctx.quadraticCurveTo(130,136,160,147);
        ctx.quadraticCurveTo(195,127,203,103);
        ctx.bezierCurveTo(208,48,199,47,160,26);ctx.closePath();
        ctx.fill();ctx.stroke();
        const pulse=0.25+.60*(.5+.5*Math.sin(t*2+index));
        ctx.strokeStyle=`rgba(44,221,247,${pulse})`;
        ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(160,93,31,-Math.PI*.7,Math.PI*.48);ctx.stroke();
        if(theme==="accessGate"){
          ctx.beginPath();ctx.arc(160,87,11,Math.PI,0);ctx.lineTo(171,108);ctx.lineTo(149,108);ctx.closePath();ctx.stroke();
        }
      }
      ctx.restore();
      for(let i=0;i<seeds.length;i++){
        const x=W*seeds[i], y=25+((i*37+t*7*(i%2?1:-1))%145+145)%145;
        ctx.fillStyle=i%2?"rgba(142,103,252,.55)":"rgba(49,206,248,.47)";
        ctx.beginPath();ctx.arc(x,y,1.6,0,Math.PI*2);ctx.fill();
      }
      const sweepX=(t*29+index*37)%420-70;
      const beam=ctx.createLinearGradient(sweepX-34,0,sweepX+34,0);
      beam.addColorStop(0,"rgba(123,42,214,0)");
      beam.addColorStop(.5,"rgba(152,113,251,.14)");
      beam.addColorStop(1,"rgba(48,219,250,0)");
      ctx.fillStyle=beam;ctx.fillRect(sweepX-34,0,68,H);
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    let stream: MediaStream | null = null;
    if (typeof canvas.captureStream === "function") {
      stream=canvas.captureStream(12);
      v.srcObject=stream;
      void v.play().catch(() => {});
    }
    return () => {
      cancelAnimationFrame(raf);
      v.pause();
      if(stream){stream.getTracks().forEach(track=>track.stop());v.srcObject=null;}
    };
  }, [theme]);

  return <video ref={node} className="semantic-film-video" autoPlay muted playsInline loop aria-hidden="true" tabIndex={-1} disablePictureInPicture />;
}
