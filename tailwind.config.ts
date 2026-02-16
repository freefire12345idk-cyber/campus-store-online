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
        campus: {
          primary: "#0f766e",
          secondary: "#0d9488",
          accent: "#14b8a6",
          dark: "#134e4a",
          light: "#ccfbf1",
        },
      },
    },
  },
  plugins: [],
};
export default config;
