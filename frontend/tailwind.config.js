/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        blue: {
          50:  '#EBF5FF',
          100: '#D6ECFF',
          200: '#ADDBFF',
          300: '#7FC5FF',
          400: '#60B1FF',
          500: '#319AFF',
          600: '#0084FF',
          700: '#006DD4',
          800: '#0055A8',
          900: '#003D7A',
        },
        navy: '#0D1F3C',
        slate: {
          400: '#4A6080',
          500: '#64748b',
          600: '#334155',
        },
        orange: '#FF801E',
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "float-a": "floatA 14s ease-in-out infinite",
        "float-b": "floatB 10s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s ease-out",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "slide-right": "slideRight 0.3s ease-out",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        floatA: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(40px,-30px) scale(1.04)" },
          "66%": { transform: "translate(-25px,20px) scale(0.97)" },
        },
        floatB: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(-30px,35px) scale(1.03)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        slideRight: {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,132,255,0.1), inset 0 1px 0 rgba(255,255,255,0.9)",
        "glass-lg": "0 16px 48px rgba(0,132,255,0.14), inset 0 1px 0 rgba(255,255,255,0.9)",
        "blue-glow": "0 0 40px rgba(96,177,255,0.4)",
        "card": "0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
}
