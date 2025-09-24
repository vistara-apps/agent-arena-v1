import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        bg: "hsl(210 20% 15%)",
        fg: "hsl(0 0% 95%)",
        accent: "hsl(40 90% 50%)",
        border: "hsl(210 20% 30%)",
        primary: "hsl(200 90% 30%)",
        surface: "hsl(210 20% 20%)",
        "text-muted": "hsl(0 0% 70%)",
        destructive: "hsl(0 84.2% 60.2%)",
        muted: {
          DEFAULT: "hsl(210 20% 25%)",
          foreground: "hsl(0 0% 70%)",
        },
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
        xl: "16px",
      },
      spacing: {
        lg: "20px",
        md: "12px",
        sm: "8px",
        xl: "24px",
        xs: "4px",
      },
      fontSize: {
        body: ["1rem", { lineHeight: "1.75" }],
        caption: ["0.875rem", { lineHeight: "1.25" }],
        display: ["3rem", { lineHeight: "1", letterSpacing: "-0.025em" }],
        heading: ["1.875rem", { lineHeight: "1.2" }],
      },
      boxShadow: {
        card: "0 4px 12px hsla(0 0% 0% / 0.1)",
        modal: "0 12px 32px hsla(0 0% 0% / 0.2)",
      },
      transitionTimingFunction: {
        "ease-out-cubic": "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      transitionDuration: {
        base: "200ms",
        fast: "100ms",
        slow: "300ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
