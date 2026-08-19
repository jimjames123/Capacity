/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // CapacitySpot palette (from the product design)
        ink: "#263238",
        muted: "#546A6E",
        faint: "#8A9A9A",
        surface: "#F5F7F7",
        panel: "#FCFDFD",
        line: "#DDE5E5",
        "line-strong": "#CBD6D6",
        teal: {
          DEFAULT: "#00897B",
          dark: "#00695C",
          soft: "#B2DFDB",
        },
        green: {
          DEFAULT: "#2F7A55",
          soft: "#E6F1EB",
          line: "#cfe6da",
        },
        amber: {
          DEFAULT: "#9A6B12",
          strong: "#C79212",
          soft: "#F6EEDD",
          line: "#ecdcb8",
        },
        rust: {
          DEFAULT: "#A63A34",
          soft: "#F7E7E5",
          line: "#e6c9c6",
        },
      },
      fontFamily: {
        serif: ["Spectral", "Georgia", "serif"],
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(38,50,56,0.04), 0 8px 24px -16px rgba(38,50,56,0.25)",
        lift: "0 30px 70px -40px rgba(38,50,56,0.5)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};
