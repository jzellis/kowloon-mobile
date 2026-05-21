/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Editorial palette — mirrors frontend's kowloon theme.
        // Hex approximations of the OKLCH source values in frontend/src/index.css
        base: {
          100: "#FAF4E8", // warm cream paper
          200: "#EFE6D4",
          300: "#DDD0B5",
          content: "#1A1A20",
        },
        primary: {
          DEFAULT: "#5588B1", // desaturated steel blue
          content: "#F4F5F7",
        },
        secondary: {
          DEFAULT: "#393B7A", // medium navy
          content: "#FAF4E8",
        },
        accent: {
          DEFAULT: "#C0394A", // vermillion
          content: "#F7E8E8",
        },
        success: {
          DEFAULT: "#2F9956",
          content: "#F0F8F2",
        },
        warning: {
          DEFAULT: "#D9B038",
          content: "#1A1A20",
        },
        error: {
          DEFAULT: "#C0394A",
          content: "#F7E8E8",
        },
        info: {
          DEFAULT: "#3C8DB8",
          content: "#F0F6FA",
        },
        // Post type accents (light defaults)
        post: {
          note: "#B76C00",
          article: "#006893",
          media: "#009084",
          link: "#417843",
          event: "#CC272E",
        },
      },
      fontFamily: {
        // Replaced once we wire in actual font assets via expo-font.
        // For now these resolve to system fonts; class names stay stable.
        reading: ["serif"],
        ui: ["System"],
        mono: ["monospace"],
      },
      borderRadius: {
        // Editorial = no pill shapes anywhere.
        none: "0",
        DEFAULT: "0",
      },
    },
  },
  plugins: [],
};
