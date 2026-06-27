/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#030a1a",
        surface: "#0a1628",
        "surface-2": "#0f1d38",
        "ir-indigo": "#6366f1",
        "ir-indigo-light": "#818cf8",
        "ir-cyan": "#22d3ee",
        "ir-emerald": "#34d399",
        "ir-amber": "#fbbf24",
        "ir-slate": "#94a3b8",
        "ir-border": "rgba(99,102,241,0.15)",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "float-a": "floatA 14s ease-in-out infinite",
        "float-b": "floatB 10s ease-in-out infinite",
        "float-c": "floatC 18s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow": "spin 4s linear infinite",
        "fade-slide": "fadeSlide 0.35s ease-out",
      },
      keyframes: {
        floatA: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(40px,-30px) scale(1.05)" },
          "66%": { transform: "translate(-25px,25px) scale(0.96)" },
        },
        floatB: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(-35px,40px) scale(1.04)" },
        },
        floatC: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "40%": { transform: "translate(20px,30px) scale(1.03)" },
          "70%": { transform: "translate(-15px,-20px) scale(0.98)" },
        },
        fadeSlide: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
