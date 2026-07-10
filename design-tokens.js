// Ergonomic ESM wrapper around design-tokens.json for JS/TS consumers.
// The JSON is the source of truth; this file just re-exports it with named
// bindings so callers can `import { color, typography } from "./design-tokens.js"`.
//
// For tooling that expects the W3C Design Tokens (DTCG) format — Penpot,
// Figma Tokens Studio, Style Dictionary — use design-tokens.dtcg.json instead.

import tokens from "./design-tokens.json" assert { type: "json" };

export const meta = tokens.$meta;
export const color = tokens.color;
export const ink = tokens.ink;
export const typography = tokens.typography;
export const border = tokens.border;
export const elevation = tokens.elevation;
export const spacing = tokens.spacing;
export const iconography = tokens.iconography;
export const motion = tokens.motion;
export const componentVariants = tokens.componentVariants;

export default tokens;
