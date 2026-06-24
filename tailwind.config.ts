import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#05060d",
        midnight: "#08111f",
        ultraviolet: "#8b5cf6",
        plasma: "#b026ff",
        pulse: "#20d6ff",
        frost: "#d9f7ff",
      },
      boxShadow: {
        glow: "0 0 32px rgba(32, 214, 255, 0.2)",
        purple: "0 0 42px rgba(139, 92, 246, 0.28)",
      },
      backgroundImage: {
        "radial-grid":
          "radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.18), transparent 26%), radial-gradient(circle at 80% 0%, rgba(32, 214, 255, 0.16), transparent 28%), linear-gradient(135deg, #05060d 0%, #08111f 46%, #02040a 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

