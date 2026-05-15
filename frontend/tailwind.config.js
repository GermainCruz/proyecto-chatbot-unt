/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        qb: {
          bg: "rgb(var(--qb-bg) / <alpha-value>)",
          surface: "rgb(var(--qb-surface) / <alpha-value>)",
          elevated: "rgb(var(--qb-surface-elevated) / <alpha-value>)",
          line: "rgb(var(--qb-border) / <alpha-value>)",
          text: "rgb(var(--qb-text) / <alpha-value>)",
          muted: "rgb(var(--qb-text-muted) / <alpha-value>)",
          accent: "rgb(var(--qb-accent) / <alpha-value>)",
        },
        chat: {
          primary: "#002570",
          primarySoft: "#0B3F9C",
          gold: "#D4960A",
          shell: "rgb(var(--qb-chat-shell) / <alpha-value>)",
          panel: "rgb(var(--qb-chat-panel) / <alpha-value>)",
          line: "rgb(var(--qb-chat-line) / <alpha-value>)",
        },
        unt: {
          blue: {
            50: "#EEF3FB",
            100: "#DDE7F7",
            200: "#B6CBEC",
            300: "#7DA0D8",
            400: "#4476C8",
            500: "#1E5BB8",
            600: "#1A4FA0",
            700: "#103E86",
            800: "#0A2A5E",
            900: "#061B40",
          },
          gold: {
            50: "#FBEFCB",
            100: "#F8E4A8",
            200: "#F0D27A",
            300: "#E8C25E",
            400: "#E0B341",
            500: "#C99A22",
            600: "#B8860B",
            700: "#8E6608",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 24px -8px rgba(16, 62, 134, 0.18)",
        "qb-dark": "0 1px 3px rgba(0, 0, 0, 0.35)",
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
