/** Carefully matched, verified real-life videos, NOT generic street footage.
 * Every MP4 returned HTTP 206 + valid ISO-BMFF ftyp header in GitHub CI on 2026-10-31.
 * Stock recordings are licensed under the Pexels License. No UI should imply
 * that these clips depict a real LUVIPRO inspection or its actual UV device.
 */
export const CLIPS = {
  paint: {
    src: "https://videos.pexels.com/video-files/6159202/6159202-hd_1920_1080_30fps.mp4",
    page: "https://www.pexels.com/video/close-up-video-of-a-car-paint-6159202/",
    subject: "Close-up of vehicle paint and reflective finish",
  },
  inspection: {
    src: "https://videos.pexels.com/video-files/8470382/8470382-hd_1280_720_25fps.mp4",
    page: "https://www.pexels.com/video/mechanic-checking-under-the-car-8470382/",
    subject: "Mechanic inspecting a car with a light in a garage",
  },
  diagnostic: {
    src: "https://videos.pexels.com/video-files/6870334/6870334-hd_1920_1080_30fps.mp4",
    page: "https://www.pexels.com/video/mechanic-using-obd-scanner-tablet-6870334/",
    subject: "Mechanic using a diagnostic tablet",
  },
  digital: {
    src: "https://videos.pexels.com/video-files/6870341/6870341-hd_1920_1080_30fps.mp4",
    page: "https://www.pexels.com/video/a-man-using-ipad-6870341/",
    subject: "Mechanic reviewing a digital tablet in a workshop",
  },
  workshop: {
    src: "https://videos.pexels.com/video-files/20693173/20693173-hd_1920_1080_25fps.mp4",
    page: "https://www.pexels.com/video/a-man-is-standing-next-to-a-car-in-a-garage-20693173/",
    subject: "Automotive repair shop and a person by a vehicle",
  },
  documents: {
    src: "https://videos.pexels.com/video-files/6637310/6637310-hd_1920_1080_30fps.mp4",
    page: "https://www.pexels.com/video/a-man-reading-a-document-6637310/",
    subject: "Person examining paperwork inside a vehicle",
  },
  bodywork: {
    src: "https://videos.pexels.com/video-files/6157904/6157904-hd_1920_1080_30fps.mp4",
    page: "https://www.pexels.com/video/close-up-video-of-a-car-6157904/",
    subject: "Professional detailing and surface work on vehicle paint",
  },
} as const;

export type FilmScene = keyof typeof CLIPS;
