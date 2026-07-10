# design-sync notes

## Shape: off-script (tokens + guidelines only)

This repo is a **React Native / Expo** app. Its components (`src/components/**`)
are `View`/`Text` + NativeWind and depend on native-only libs (`react-native-svg`,
`react-native-webview`, `react-native-reanimated` worklets, `@10play/tentap-editor`,
`lucide-react-native`). They do **not** render in Claude Design's browser (React
DOM) runtime, and there is no `dist/` or Storybook. So this is NOT a component
sync — the standard converter (`package-build.mjs`) does not apply.

Instead we sync design-system **foundations**: CSS-variable tokens, the five
bundled fonts as `@font-face`, and the `DESIGN_SYSTEM.md` guidelines. The design
agent builds on-brand with its own web components.

## How it's built

`node .design-sync/build.mjs` reads `design-tokens.json` (source of truth,
mirrors `tailwind.config.js` + `src/lib/typography.js`) and emits `ds-bundle/`:
`styles.css` (entry) -> `@import`s `tokens/*.css` + `fonts/fonts.css`; DTCG copy
and `guidelines/design-system.md` alongside. `ds-bundle/` is gitignored (regen
from source). No `_ds_sync.json` anchor (off-script), so every re-sync rebuilds
and re-uploads in full — cheap here.

## To re-sync after tokens change

1. Edit `design-tokens.json` (and/or `DESIGN_SYSTEM.md`).
2. `node .design-sync/build.mjs`
3. Re-run `/design-sync` — it re-adopts the pinned project and re-uploads.

## Font weight note

`design-tokens.json` `chromeFonts.ui` says `inter-regular`, but `DESIGN_SYSTEM.md`
documents the UI chrome as Inter **Light (300)**. The web build ships Inter at
300/400/700 and the base layer + conventions use 300 for chrome, matching the doc.
