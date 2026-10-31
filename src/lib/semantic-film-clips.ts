/** LUVIPRO preview: each visual card has ONE uniquely assigned scene.
 * 17 people-free automotive close-ups licensed for commercial use via Pexels,
 * plus 8 original, locally generated browser video streams for abstract data
 * concepts that cannot truthfully be illustrated by vehicle stock footage.
 * No clip IDs reused on a landing page. No Audi grille / hazard-light hero.
 * Full rights/trademark checks remain required before long-term media use.
 */
export const CLIPS = {
  ambient: { kind: "stock", src: "https://videos.pexels.com/video-files/10541023/10541023-hd_1280_720_25fps.mp4", source: "https://www.pexels.com/video/10541023/", description: "Close-up of rain on a windshield, no vehicle badge" },
  hero: { kind: "stock", src: "https://videos.pexels.com/video-files/8033487/8033487-hd_1920_1080_24fps.mp4", source: "https://www.pexels.com/video/8033487/", description: "Side of a blue car and mirror; no turn signal motif" },
  statUV: { kind: "stock", src: "https://videos.pexels.com/video-files/6873506/6873506-hd_1920_1080_25fps.mp4", source: "https://www.pexels.com/video/6873506/", description: "Detailed cleaning of automotive headlamp" },
  problemPaint: { kind: "stock", src: "https://videos.pexels.com/video-files/6159202/6159202-hd_1920_1080_30fps.mp4", source: "https://www.pexels.com/video/6159202/", description: "Close-up of reflective paint surface" },
  problemChain: { kind: "stock", src: "https://videos.pexels.com/video-files/12680275/12680275-hd_1920_1080_30fps.mp4", source: "https://www.pexels.com/video/12680275/", description: "Obscured view through raindrops" },
  ecoPaint: { kind: "stock", src: "https://videos.pexels.com/video-files/6159204/6159204-hd_1920_1080_30fps.mp4", source: "https://www.pexels.com/video/6159204/", description: "Detailed paintwork in professional lighting" },
  ecoInspection: { kind: "stock", src: "https://videos.pexels.com/video-files/13643108/13643108-hd_1920_1080_24fps.mp4", source: "https://www.pexels.com/video/13643108/", description: "Car wheel close-up at night" },
  ecoPartner: { kind: "stock", src: "https://videos.pexels.com/video-files/6685034/6685034-hd_1920_1080_30fps.mp4", source: "https://www.pexels.com/video/6685034/", description: "Workshop/vehicle wheel close-up" },
  ecoTrust: { kind: "stock", src: "https://videos.pexels.com/video-files/5446259/5446259-hd_1920_1080_30fps.mp4", source: "https://www.pexels.com/video/5446259/", description: "Clean mirror reflection and road" },
  priceStandard: { kind: "stock", src: "https://videos.pexels.com/video-files/6157864/6157864-hd_1920_1080_30fps.mp4", source: "https://www.pexels.com/video/6157864/", description: "Body panel and finish closeup" },
  pricePremium: { kind: "stock", src: "https://videos.pexels.com/video-files/8104040/8104040-hd_1920_1080_25fps.mp4", source: "https://www.pexels.com/video/8104040/", description: "Rotating wheel close-up" },
  uvSection: { kind: "stock", src: "https://videos.pexels.com/video-files/5309342/5309342-hd_1920_1080_25fps.mp4", source: "https://www.pexels.com/video/5309342/", description: "Automotive lamp and metallic detail" },
  howBuyer: { kind: "stock", src: "https://videos.pexels.com/video-files/5419070/5419070-hd_1920_1080_25fps.mp4", source: "https://www.pexels.com/video/5419070/", description: "Car headlamp at sunset" },
  howSeller: { kind: "stock", src: "https://videos.pexels.com/video-files/9737964/9737964-hd_1920_1080_24fps.mp4", source: "https://www.pexels.com/video/9737964/", description: "Elegant red tail light detail" },
  howWorkshop: { kind: "stock", src: "https://videos.pexels.com/video-files/4157778/4157778-hd_1920_1080_24fps.mp4", source: "https://www.pexels.com/video/4157778/", description: "Rolling heavy vehicle tire" },
  trustIntegrity: { kind: "stock", src: "https://videos.pexels.com/video-files/6160051/6160051-hd_1920_1080_24fps.mp4", source: "https://www.pexels.com/video/6160051/", description: "Tailpipe and exhaust flow closeup" },
  trustPartner: { kind: "stock", src: "https://videos.pexels.com/video-files/5309321/5309321-hd_1920_1080_25fps.mp4", source: "https://www.pexels.com/video/5309321/", description: "Exhaust pipe metal detail" },
  statVIN: { kind: "generated", theme: "vinPulse" },
  statPDF: { kind: "generated", theme: "reportLayers" },
  problemDocs: { kind: "generated", theme: "documentVeil" },
  ecoVIN: { kind: "generated", theme: "vinOrbit" },
  ecoPDF: { kind: "generated", theme: "pdfCascade" },
  trustPrivacy: { kind: "generated", theme: "privacyShield" },
  ocrVIN: { kind: "generated", theme: "ocrSweep" },
  ocrAccess: { kind: "generated", theme: "accessGate" },
} as const;
export type FilmScene = keyof typeof CLIPS;
export type GeneratedTheme = typeof CLIPS[keyof typeof CLIPS] extends never ? never :
  | "vinPulse"
  | "reportLayers"
  | "documentVeil"
  | "vinOrbit"
  | "pdfCascade"
  | "privacyShield"
  | "ocrSweep"
  | "accessGate";
