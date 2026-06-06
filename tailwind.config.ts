import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F7F3E7",
        ink: "#0E0E0D",
        lime: "#CCFF4D",
        coral: "#FF5436",
        plum: "#2A1740",
        mist: "#E5DFCB",
        stone: "#7A7664",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-bricolage)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "grain-shift": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "20%": { transform: "translate(-3%, -2%)" },
          "40%": { transform: "translate(2%, -4%)" },
          "60%": { transform: "translate(-1%, 3%)" },
          "80%": { transform: "translate(3%, 1%)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "grain": "grain-shift 8s steps(5) infinite",
        "marquee": "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
