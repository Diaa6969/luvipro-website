# LUVIPRO authentic automotive video preview — licence and validation

This remains a **Vercel preview-only branch**; it has NOT been merged into production main.

The original stylized SVG car was replaced with actual footage captured by cameras. Footage depicts real automobiles/traffic, not LUVIPRO UV inspections. The purple lighting effect is a CSS post-production illustration only.

## Stock media under the Pexels License (commercial use)

Pexels expressly permits using its licensed videos for commercial websites without attribution; do not imply any car manufacturer, driver or filmmaker endorses LUVIPRO.

Sources:

- **Night traffic/hero**: [Night traffic](https://www.pexels.com/video/night-traffic-5258413/) — `https://videos.pexels.com/video-files/5258413/5258413-hd_1920_1080_25fps.mp4`
- **City junction/cinematic cards**: [Night traffic on a junction](https://www.pexels.com/video/night-traffic-on-junction-in-city-10433645/) — `https://videos.pexels.com/video-files/10433645/10433645-hd_1920_1080_25fps.mp4`
- **Real traffic video**: [Pexels traffic video 1192116](https://www.pexels.com/video/1192116/) — `https://videos.pexels.com/video-files/1192116/1192116-sd_640_360_30fps.mp4`

Official licence: https://www.pexels.com/license/ (also https://www.pexels.com/legal-pages/license/).

The previous Mixkit MP4 candidate links all returned **403** from GitHub CI and have been removed from the site code. Actual Pexels MP4 candidates listed here were verified as HTTP **206 video/mp4** with correct MP4 file headers in GitHub Actions 2026-10-31.

**Caveats before approval:** Footage is generic automotive ambience, NOT genuine LUVIPRO device use, UV fluorescence, mechanical diagnostics or a workshop. To feature authentic UV scans we need first-party footage or rights-cleared real footage from an actual inspection. The Pexels CDN introduces an external request on playback; for long-term production use, retain asset licence records, self-host compressed video files or a trusted video CDN, check privacy disclosures, and perform visual playback checks on Safari/Android. No automatic sound, no 4K streams, media lazy-loaded only when in viewport, pauses offscreen and disables with reduced-motion preference.

## Visual coverage

- DE, EN, AR, European translated hero videos.
- Standard and Premium price cards with distinct visible video loops.
- Six German benefit cards and core translated feature cards with video crops.
- Remaining cards gain a stronger visible UV light sheen and hover/focus motion.
- This branch is a **draft PR** and production main remains unchanged until explicitly approved by the user.
