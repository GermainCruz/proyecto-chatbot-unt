/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
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
