import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        line: "var(--line)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          soft: "var(--primary-soft)",
        },
        accent: {
          teal: "#0f6c7c",
          cobalt: "#3067ea",
          indigo: "#6657f6",
          plum: "#8646cc",
          berry: "#bd315f",
          graphite: "#334155",
          amber: "#d97706"
        }
      },
      boxShadow: {
        "soft-xl": "0 30px 80px rgba(48, 103, 234, 0.14)",
        "soft-card": "0 18px 40px rgba(15, 23, 42, 0.07)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)"
        ],
        display: [
          "var(--font-display)"
        ],
        mono: [
          "var(--font-mono)"
        ]
      },
      backgroundImage: {
        "hero-grid": "radial-gradient(circle at top left, rgba(48,103,234,0.2), transparent 30%), radial-gradient(circle at bottom right, rgba(15,108,124,0.14), transparent 28%)",
      }
    },
  },
  plugins: [],
};

export default config;
