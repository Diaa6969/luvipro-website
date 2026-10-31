// Preview gate: never report "real video is working" when hosted media links are broken.
// Range GET checks real MP4 headers with minimal download, not a full stock-video download.
const urls = [
  "https://assets.mixkit.co/videos/preview/mixkit-parked-red-sports-car-66-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-closeup-of-red-sports-car-49-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-rear-view-of-a-car-through-the-city-42033-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-closeup-of-sports-car-engine-65-large.mp4",
];

let failed = false;
for (const url of urls) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Range: "bytes=0-63",
        "User-Agent": "Mozilla/5.0 (compatible; LUVIPRO preview media verification)",
      },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok || !/video\/mp4|application\/octet-stream/.test(res.headers.get("content-type") || "")) {
      failed = true;
      console.error("BAD VIDEO SOURCE:", res.status, res.headers.get("content-type"), url);
      await res.body?.cancel();
      continue;
    }
    const reader = res.body?.getReader();
    const first = await reader?.read();
    await reader?.cancel();
    const b=first?.value ?? new Uint8Array(0);
    const startsWithFtyp=b.length >= 12 && String.fromCharCode(...b.slice(4,8))==="ftyp";
    if (!startsWithFtyp && res.status===206) {
      failed=true; console.error("NOT AN MP4 HEADER:",url); continue;
    }
    console.log("OK authentic video MP4:", res.status, url);
  } catch (e) {
    failed=true;
    console.error("VIDEO UNREACHABLE:",url,String(e));
  }
}
if(failed)process.exit(1);
