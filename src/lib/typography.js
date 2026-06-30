// Typography system — single source of truth.
//
// Adding a new font means adding one entry to FONTS (with its files) and
// nothing else: the useFonts() asset map, the settings-screen picker, and
// the resolver all derive from this array. Adding non-Roman fonts later is
// the same one-entry change — see mobile/CLAUDE.md.
//
// Reading preferences are stored per-account at `user.prefs.typography` on
// the server (string-keyed, stepped scales). The px / multiplier / padding
// mappings live here on the client — the server only stores the keys.

// ---- Fonts -----------------------------------------------------------------

// `classification` is informational (used to group/label in the picker).
// `files` are the static font assets, bundled via expo-font.
export const FONTS = [
  {
    key: "inter",
    label: "Inter",
    classification: "sans",
    files: {
      regular: require("../../assets/fonts/Inter-Light.ttf"),
      bold: require("../../assets/fonts/Inter-Bold.ttf"),
      italic: require("../../assets/fonts/Inter-Italic.ttf"),
    },
  },
  {
    key: "atkinson",
    label: "Atkinson Hyperlegible",
    classification: "sans",
    files: {
      regular: require("../../assets/fonts/AtkinsonHyperlegible-Regular.ttf"),
      bold: require("../../assets/fonts/AtkinsonHyperlegible-Bold.ttf"),
      italic: require("../../assets/fonts/AtkinsonHyperlegible-Italic.ttf"),
    },
  },
  {
    key: "lora",
    label: "Lora",
    classification: "serif",
    files: {
      regular: require("../../assets/fonts/Lora-Regular.ttf"),
      bold: require("../../assets/fonts/Lora-Bold.ttf"),
      italic: require("../../assets/fonts/Lora-Italic.ttf"),
    },
  },
  {
    key: "merriweather",
    label: "Merriweather",
    classification: "serif",
    files: {
      regular: require("../../assets/fonts/Merriweather-Regular.ttf"),
      bold: require("../../assets/fonts/Merriweather-Bold.ttf"),
      italic: require("../../assets/fonts/Merriweather-Italic.ttf"),
    },
  },
  {
    key: "opendyslexic",
    label: "OpenDyslexic",
    classification: "accessibility",
    files: {
      regular: require("../../assets/fonts/OpenDyslexic-Regular.otf"),
      bold: require("../../assets/fonts/OpenDyslexic-Bold.otf"),
      italic: require("../../assets/fonts/OpenDyslexic-Italic.otf"),
    },
  },
];

// Registration name for a given font key + variant. This is the string that
// gets passed to expo-font and used as `fontFamily` in styles.
export function fontName(key, variant = "regular") {
  return `${key}-${variant}`;
}

// The asset map passed to useFonts() in app/_layout.js — derived from FONTS so
// there's exactly one place that lists font files.
// `inter-medium` is registered separately — it's Inter Regular (400), used for
// UI display names where Light (300) reads too thin but Bold is too heavy.
export const FONT_ASSETS = {
  ...FONTS.reduce((acc, font) => {
    acc[fontName(font.key, "regular")] = font.files.regular;
    acc[fontName(font.key, "bold")] = font.files.bold;
    acc[fontName(font.key, "italic")] = font.files.italic;
    return acc;
  }, {}),
  "inter-medium": require("../../assets/fonts/Inter-Regular.ttf"),
};

// ---- Stepped scales --------------------------------------------------------

export const FONT_SIZES = { xs: 10, s: 14, m: 16, l: 18, xl: 21 };
export const FONT_SIZE_ORDER = ["xs", "s", "m", "l", "xl"];

export const LINE_SPACINGS = { compact: 1.3, normal: 1.55, relaxed: 1.8 };
export const LINE_SPACING_ORDER = ["compact", "normal", "relaxed"];

// Horizontal padding (px) applied to reading surfaces. Larger = narrower text.
export const COLUMN_WIDTHS = { narrow: 36, normal: 22, wide: 12 };
export const COLUMN_WIDTH_ORDER = ["narrow", "normal", "wide"];

export const DEFAULT_TYPOGRAPHY = {
  fontFamily: "inter",
  fontSize: "m",
  lineSpacing: "normal",
  columnWidth: "normal",
};

// ---- Resolver --------------------------------------------------------------

// Normalize a possibly-partial / possibly-absent prefs object (new accounts,
// accounts from servers that predate the typography schema) into a complete,
// valid typography preference object.
export function normalizeTypography(prefs) {
  const p = prefs && typeof prefs === "object" ? prefs : {};
  const has = (val, table) => typeof val === "string" && val in table;
  const fontTable = Object.fromEntries(FONTS.map((f) => [f.key, true]));
  return {
    fontFamily: has(p.fontFamily, fontTable)
      ? p.fontFamily
      : DEFAULT_TYPOGRAPHY.fontFamily,
    fontSize: has(p.fontSize, FONT_SIZES)
      ? p.fontSize
      : DEFAULT_TYPOGRAPHY.fontSize,
    lineSpacing: has(p.lineSpacing, LINE_SPACINGS)
      ? p.lineSpacing
      : DEFAULT_TYPOGRAPHY.lineSpacing,
    columnWidth: has(p.columnWidth, COLUMN_WIDTHS)
      ? p.columnWidth
      : DEFAULT_TYPOGRAPHY.columnWidth,
  };
}

// Turn a typography preference object into concrete style values that screens
// can spread onto reading surfaces.
export function resolveTypography(prefs) {
  const t = normalizeTypography(prefs);
  const fontSize = FONT_SIZES[t.fontSize];
  return {
    ...t,
    regularFamily: fontName(t.fontFamily, "regular"),
    boldFamily: fontName(t.fontFamily, "bold"),
    italicFamily: fontName(t.fontFamily, "italic"),
    fontSize,
    lineHeight: Math.round(fontSize * LINE_SPACINGS[t.lineSpacing]),
    paddingHorizontal: COLUMN_WIDTHS[t.columnWidth],
  };
}
