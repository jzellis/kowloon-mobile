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
          100: "#FFFFFF", // white app background (was warm paper; experiment 2026-07)
          200: "#F4F4F4", // neutral light surface (cards / sheets)
          300: "#E7E7E7", // neutral hairline / placeholder fill
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
        // Klein blue app header (white sans on Yves Klein blue)
        header: {
          DEFAULT: "#002FA7",
          content: "#FFFFFF",
        },
        // Near-white surface for text inputs / editors
        field: "#FCFBF7",
      },
      fontFamily: {
        // Static chrome fonts — bundled via expo-font (see src/lib/typography.js).
        // `reading` is the editorial display serif used for headings; `ui` is
        // the sans used for labels, buttons, eyebrows. The user-selectable
        // *reading-body* font is applied via inline styles on reading surfaces
        // (post body, article view) through useTypography(), NOT these tokens.
        reading: ["lora-regular"],
        ui: ["inter-regular"],
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
