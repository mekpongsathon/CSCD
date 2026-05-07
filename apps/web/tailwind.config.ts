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
        // Brand & Accent (from design.md)
        "cohere-black": "#000000",
        "near-black": "#17171c",
        "enterprise-green": "#003c33",
        "dark-navy": "#071829",
        "action-blue": "#1863dc",
        "coral": "#ff7759",
        "soft-coral": "#ffad9b",
        // Surface & Background
        "canvas-white": "#ffffff",
        "soft-stone": "#eeece7",
        "pale-green": "#edfce9",
        "pale-blue": "#f1f5ff",
        "card-border": "#f2f2f2",
        // Text & Rules
        "ink": "#212121",
        "muted-slate": "#93939f",
        "slate-text": "#75758a",
        "hairline": "#d9d9dd",
        "border-light": "#e5e7eb",
        // Semantic
        "focus-blue": "#4c6ee6",
        "error-red": "#b30000",
      },
      fontFamily: {
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui"],
        body: ["Inter", "Arial", "ui-sans-serif", "system-ui"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "22px",
        xl: "30px",
        pill: "32px",
      },
      fontSize: {
        "hero": ["96px", { lineHeight: "1.00", letterSpacing: "-1.92px" }],
        "product": ["72px", { lineHeight: "1.00", letterSpacing: "-1.44px" }],
        "section-display": ["60px", { lineHeight: "1.00", letterSpacing: "-1.2px" }],
        "section-heading": ["48px", { lineHeight: "1.20", letterSpacing: "-0.48px" }],
        "card-heading": ["32px", { lineHeight: "1.20", letterSpacing: "-0.32px" }],
        "feature-heading": ["24px", { lineHeight: "1.30" }],
        "body-large": ["18px", { lineHeight: "1.40" }],
        "body": ["16px", { lineHeight: "1.50" }],
        "btn": ["14px", { lineHeight: "1.71", fontWeight: "500" }],
        "caption": ["14px", { lineHeight: "1.40" }],
        "mono-label": ["14px", { lineHeight: "1.40", letterSpacing: "0.28px" }],
        "micro": ["12px", { lineHeight: "1.40" }],
      },
    },
  },
  plugins: [],
};

export default config;
