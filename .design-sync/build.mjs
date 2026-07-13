// Kowloon Mobile -> Claude Design (claude.ai/design) bundle generator.
//
// This repo is a React Native app: its components (View/Text + NativeWind, plus
// native-only deps) do not render in Claude Design's browser runtime, so there
// is NO component bundle. Instead we sync the design-system FOUNDATIONS the
// design agent can build on-brand with: color/typography/spacing/border tokens
// (as CSS custom properties + a DTCG copy), the five bundled reading fonts (as
// real @font-face files), and the DESIGN_SYSTEM.md guidelines.
//
// design-tokens.json is the source of truth. Re-run: `node .design-sync/build.mjs`.

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "ds-bundle");
const tokens = JSON.parse(readFileSync(join(ROOT, "design-tokens.json"), "utf8"));

// ---- helpers ---------------------------------------------------------------
const write = (rel, data) => {
  const p = join(OUT, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, data);
};
const INK = "26, 26, 32"; // #1A1A20 as rgb channels for opacity steps

// ---- clean -----------------------------------------------------------------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// ---- tokens/colors.css -----------------------------------------------------
const c = tokens.color;
const colorLines = [
  ":root {",
  "  /* Surfaces & ink -- warm paper, cool ink */",
  `  --color-base-100: ${c.base["100"]};   /* warm cream paper -- default canvas/card fill */`,
  `  --color-base-200: ${c.base["200"]};   /* deeper paper -- dividers, placeholders, hover */`,
  `  --color-base-300: ${c.base["300"]};   /* deepest paper -- quiet 2px borders */`,
  `  --color-base-content: ${c.base.content};   /* near-black ink -- primary text, loud borders */`,
  "",
  "  /* Brand roles (use sparingly, with intent) */",
  `  --color-primary: ${c.primary.default};`,
  `  --color-primary-content: ${c.primary.content};`,
  `  --color-secondary: ${c.secondary.default};`,
  `  --color-secondary-content: ${c.secondary.content};`,
  `  --color-accent: ${c.accent.default};`,
  `  --color-accent-content: ${c.accent.content};`,
  "",
  "  /* Status */",
  `  --color-success: ${c.status.success.default};`,
  `  --color-success-content: ${c.status.success.content};`,
  `  --color-warning: ${c.status.warning.default};`,
  `  --color-warning-content: ${c.status.warning.content};`,
  `  --color-error: ${c.status.error.default};`,
  `  --color-error-content: ${c.status.error.content};`,
  `  --color-info: ${c.status.info.default};`,
  `  --color-info-content: ${c.status.info.content};`,
  "",
  "  /* Post-type accents -- one color per content type (icon tint + eyebrow + accent) */",
  `  --color-post-note: ${c.post.note};`,
  `  --color-post-article: ${c.post.article};`,
  `  --color-post-media: ${c.post.media};`,
  `  --color-post-link: ${c.post.link};`,
  `  --color-post-event: ${c.post.event};`,
  "",
  "  /* Klein blue app header (white sans) + near-white field surface */",
  `  --color-header: ${c.header.default};`,
  `  --color-header-content: ${c.header.content};`,
  `  --color-field: ${c.field};`,
  "",
  "  /* Ink at opacity steps -- text hierarchy on paper (never below /40 for readable text) */",
];
for (const [k, v] of Object.entries(tokens.ink.opacity)) {
  colorLines.push(`  --ink-${k}: rgba(${INK}, ${v});`);
}
colorLines.push("}", "");
write("tokens/colors.css", colorLines.join("\n"));

// ---- tokens/typography.css -------------------------------------------------
const t = tokens.typography;
const typeLines = [
  ":root {",
  "  /* Chrome fonts (static). UI sans is used LIGHT (300) for all chrome labels. */",
  `  --font-ui: "Inter", system-ui, sans-serif;`,
  `  --font-reading: "Lora", Georgia, serif;   /* editorial display serif -- headings */`,
  `  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;`,
  "",
  "  /* Reading-body font families (user-selectable on reading surfaces) */",
  `  --font-inter: "Inter", system-ui, sans-serif;`,
  `  --font-atkinson: "Atkinson Hyperlegible", system-ui, sans-serif;`,
  `  --font-lora: "Lora", Georgia, serif;`,
  `  --font-merriweather: "Merriweather", Georgia, serif;`,
  `  --font-opendyslexic: "OpenDyslexic", system-ui, sans-serif;`,
  "",
  "  /* Stepped reading font sizes (px) -- default is m */",
];
for (const k of t.fontSizeOrder) typeLines.push(`  --text-${k}: ${t.fontSize[k]}px;`);
typeLines.push("", "  /* Stepped line spacing (unitless multiplier) -- default is normal */");
for (const k of t.lineSpacingOrder) typeLines.push(`  --leading-${k}: ${t.lineSpacing[k]};`);
typeLines.push(
  "",
  "  /* Letter-spacing -- the signature of every non-content label (upper + tracked) */"
);
const kebab = (k) => k.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
for (const [k, v] of Object.entries(t.letterSpacing))
  typeLines.push(`  --tracking-${kebab(k)}: ${v};`);
typeLines.push("}", "");
write("tokens/typography.css", typeLines.join("\n"));

// ---- tokens/spacing.css ----------------------------------------------------
const s = tokens.spacing;
const spaceLines = [":root {", "  /* Base-4 spacing scale (px) */"];
for (const [k, v] of Object.entries(s.scale)) {
  spaceLines.push(`  --space-${String(k).replace(".", "_")}: ${v}px;`);
}
spaceLines.push(
  "",
  `  --gutter: ${s.gutter}px;   /* standard horizontal content inset (px-5) */`,
  `  --card-pad-x: ${s.cardPadding.x}px;`,
  `  --card-pad-y: ${s.cardPadding.y}px;`,
  `  --field-stack-gap: ${s.fieldStackGap}px;`,
  `  --image-grid-gap: ${s.imageGridGap}px;`,
  "}",
  ""
);
write("tokens/spacing.css", spaceLines.join("\n"));

// ---- tokens/borders.css ----------------------------------------------------
const b = tokens.border;
write(
  "tokens/borders.css",
  [
    ":root {",
    "  /* Editorial = hard edges. Radius is 0 EVERYWHERE except the round user",
    "     avatar and the flat-top hexagon circle/group avatar. No shadows. */",
    `  --radius: ${b.radius.default}px;`,
    `  --border-hairline: ${b.width.hairline}px;   /* row dividers */`,
    `  --border-strong: ${b.width.strong}px;       /* structural frames (the primary device) */`,
    "  --border-loud: var(--border-strong) solid var(--color-base-content);   /* buttons, controls */",
    "  --border-quiet: var(--border-strong) solid var(--color-base-300);      /* inputs, images */",
    "  --border-divider: var(--border-hairline) solid var(--color-base-200);  /* feed-card rows */",
    "}",
    "",
  ].join("\n")
);

// ---- fonts/fonts.css + font files -----------------------------------------
// (weight 300 = Light, 400 = Regular, 700 = Bold; italic where shipped)
const FONT_SRC = join(ROOT, "assets/fonts");
const faces = [
  // Inter: ships Light(300)/Regular(400)/Bold(700)/Italic. Chrome uses 300.
  { fam: "Inter", file: "Inter-Light.ttf", weight: 300, style: "normal" },
  { fam: "Inter", file: "Inter-Regular.ttf", weight: 400, style: "normal" },
  { fam: "Inter", file: "Inter-Bold.ttf", weight: 700, style: "normal" },
  { fam: "Inter", file: "Inter-Italic.ttf", weight: 400, style: "italic" },
  { fam: "Atkinson Hyperlegible", file: "AtkinsonHyperlegible-Regular.ttf", weight: 400, style: "normal" },
  { fam: "Atkinson Hyperlegible", file: "AtkinsonHyperlegible-Bold.ttf", weight: 700, style: "normal" },
  { fam: "Atkinson Hyperlegible", file: "AtkinsonHyperlegible-Italic.ttf", weight: 400, style: "italic" },
  { fam: "Lora", file: "Lora-Regular.ttf", weight: 400, style: "normal" },
  { fam: "Lora", file: "Lora-Bold.ttf", weight: 700, style: "normal" },
  { fam: "Lora", file: "Lora-Italic.ttf", weight: 400, style: "italic" },
  { fam: "Merriweather", file: "Merriweather-Regular.ttf", weight: 400, style: "normal" },
  { fam: "Merriweather", file: "Merriweather-Bold.ttf", weight: 700, style: "normal" },
  { fam: "Merriweather", file: "Merriweather-Italic.ttf", weight: 400, style: "italic" },
  { fam: "OpenDyslexic", file: "OpenDyslexic-Regular.otf", weight: 400, style: "normal" },
  { fam: "OpenDyslexic", file: "OpenDyslexic-Bold.otf", weight: 700, style: "normal" },
  { fam: "OpenDyslexic", file: "OpenDyslexic-Italic.otf", weight: 400, style: "italic" },
];
mkdirSync(join(OUT, "fonts"), { recursive: true });
const fmt = (f) => (f.endsWith(".otf") ? "opentype" : "truetype");
const faceCss = faces
  .map((f) => {
    copyFileSync(join(FONT_SRC, f.file), join(OUT, "fonts", f.file));
    return [
      "@font-face {",
      `  font-family: "${f.fam}";`,
      `  font-style: ${f.style};`,
      `  font-weight: ${f.weight};`,
      "  font-display: swap;",
      `  src: url("./${f.file}") format("${fmt(f.file)}");`,
      "}",
    ].join("\n");
  })
  .join("\n\n");
write(
  "fonts/fonts.css",
  "/* Five bundled reading families, Latin-only (non-Roman scripts fall back to\n" +
    "   system font -- a known, documented gap). Inter also serves as the UI chrome\n" +
    "   font at weight 300. */\n\n" +
    faceCss +
    "\n"
);

// ---- styles.css (the entry -- designs receive only its @import closure) -----
write(
  "styles.css",
  [
    "/* Kowloon editorial design system -- entry stylesheet.",
    "   Claude Design hands each rendered design ONLY the transitive @import",
    "   closure of this file, so every token, font, and base rule lives here. */",
    "",
    '@import "./fonts/fonts.css";',
    '@import "./tokens/colors.css";',
    '@import "./tokens/typography.css";',
    '@import "./tokens/spacing.css";',
    '@import "./tokens/borders.css";',
    "",
    "/* Editorial base layer: warm paper, cool ink, light UI sans, hard edges.",
    "   Low-specificity so the design agent's own component styles win easily. */",
    ":where(html) {",
    "  background-color: var(--color-base-100);",
    "  color: var(--color-base-content);",
    "  font-family: var(--font-ui);",
    "  font-weight: 300;",
    "  -webkit-font-smoothing: antialiased;",
    "}",
    "",
    ":where(h1, h2, h3, h4) {",
    "  font-family: var(--font-reading);",
    "  font-weight: 400;",
    "  line-height: 1.15;",
    "}",
    "",
    "/* Hard edges everywhere (radius 0) except round/hex avatars, which opt back in. */",
    ":where(button, input, textarea, select, img, .card) {",
    "  border-radius: var(--radius);",
    "}",
    "",
    "/* Signature label: every non-content label is UI sans, uppercase, tracked. */",
    ".eyebrow {",
    "  font-family: var(--font-ui);",
    "  text-transform: uppercase;",
    "  letter-spacing: var(--tracking-eyebrow);",
    "  font-size: 10px;",
    "  color: var(--ink-eyebrow);",
    "}",
    "",
  ].join("\n")
);

// ---- tokens DTCG copy (reference for Figma/Penpot/Style Dictionary) ---------
copyFileSync(join(ROOT, "design-tokens.dtcg.json"), join(OUT, "tokens/design-tokens.dtcg.json"));

// ---- guidelines ------------------------------------------------------------
mkdirSync(join(OUT, "guidelines"), { recursive: true });
copyFileSync(join(ROOT, "DESIGN_SYSTEM.md"), join(OUT, "guidelines/design-system.md"));

// ---- README (conventions header prepended, if present) ---------------------
let readme = "";
try {
  readme = readFileSync(join(ROOT, ".design-sync/conventions.md"), "utf8").trimEnd() + "\n\n---\n\n";
} catch {}
readme +=
  "# Kowloon Design Tokens\n\n" +
  "Foundations of the Kowloon editorial aesthetic, synced from the React Native\n" +
  "app. No component bundle (the components are React Native and do not render in\n" +
  "the browser); this project provides tokens, fonts, and guidelines so designs\n" +
  "come out on-brand.\n\n" +
  "- `styles.css` -- entry; @imports all tokens + fonts. Every design gets this closure.\n" +
  "- `tokens/*.css` -- CSS custom properties (colors, typography, spacing, borders).\n" +
  "- `tokens/design-tokens.dtcg.json` -- W3C DTCG copy for Figma / Penpot / Style Dictionary.\n" +
  "- `fonts/` -- the five bundled reading families as real @font-face files.\n" +
  "- `guidelines/design-system.md` -- the full editorial design guide.\n";
write("README.md", readme);

console.log("Built ds-bundle/ from design-tokens.json");
