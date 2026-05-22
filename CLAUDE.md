@AGENTS.md

# Kowloon Mobile

React Native client for Kowloon, built with **Expo Router** (file-based routing) and plain **JavaScript** (no TypeScript — matches the rest of the codebase).

## Stack

- Expo SDK 55 (managed workflow + EAS Build — no Xcode required for iOS builds)
- React Native 0.83 / React 19
- `expo-router` for navigation (file-based — every file under `app/` is a route)
- `@kowloon/client` (linked from `../client`, sibling repo) — same isomorphic library the web frontend uses, gives us auth, activities, feeds, files, search, notifications for free

## File layout

```
app/                — Expo Router routes (every .js file is a screen)
  _layout.js        — root layout: GestureHandlerRootView + SafeAreaProvider + Stack
  index.js          — root screen (currently a placeholder)
assets/             — icons, splash, etc.
app.json            — Expo config (name, slug, bundle IDs)
.npmrc              — pins `legacy-peer-deps=true` (expo-router pulls in transitive
                      deps that conflict with React 19's strict peer resolution;
                      every `npm install` in this project needs this)
```

## Design decisions — DO NOT silently change

- **Multi-account from day one.** Architecture treats account as a primary key on every per-user piece of state (auth token, drafts, prefs, notification subscription). Initial UX may only expose a single account, but the data model is multi-tenant from the first commit. See `[[project-mobile-strategy]]` in memory.
- **Plain JS, not TS.** The server, frontend, and client lib are all JS. Mobile follows suit for consistency.
- **`@kowloon/client` is the only network layer.** Never call `fetch` directly — go through the client's auth/activities/feeds/etc. modules. Storage adapter auto-detects AsyncStorage on RN.
- **Editorial design heritage.** Same magazine-y aesthetic as the web frontend: hard edges (no rounded corners), strong typography, theme tokens from the kowloon theme. Styling is via **NativeWind** (`className`); theme tokens live in `tailwind.config.js`.

## Typography system

Reading typography is a first-class feature, not a stylesheet detail — the user is a writer and cares about editorial elegance. Modelled on the Kindle's reading settings: a small curated set of good choices.

- **Five bundled fonts** (`assets/fonts/`, loaded via `expo-font`): Inter (default), Atkinson Hyperlegible, Lora, Merriweather, OpenDyslexic. Regular / Bold / Italic each.
- **`src/lib/typography.js` is the single source of truth.** Adding a font = one entry in the `FONTS` array (plus its files). The `useFonts()` asset map, the settings picker, and the resolver all derive from it.
- **Four stepped preferences**: `fontFamily`, `fontSize` (xs–xl), `lineSpacing` (compact/normal/relaxed), `columnWidth` (narrow/normal/wide). The client owns the px / multiplier / padding mapping; the server stores only the string keys.
- **Account-level, server-synced.** Stored at `user.prefs.typography` (a real subschema in `server/schema/User.js` — *not* an open object, so new fields there need a schema change). `TypographyProvider` hydrates on account change and writes back debounced via `@kowloon/client` `updateProfile`. The whole `typography` object is sent on every change — the server's Update handler replaces the subdocument wholesale.
- **Applied via inline styles** on reading surfaces (post body, article view) through `useTypography()` — NOT via Tailwind classes, since the values are dynamic. The static `font-reading` / `font-ui` Tailwind tokens are chrome fonts only (Lora display serif / Inter sans).
- **Settings UI** at `app/settings/typography.js`: live preview + horizontal typeface picker + segmented controls. No save button — changes apply and sync immediately.

### Known gap — non-Western scripts

The bundled fonts cover Latin only. Users writing in non-Roman scripts fall back to the device system font (the automatic behaviour when a glyph isn't in the loaded font). Adding non-Roman font support is a self-contained contribution: add entries to `FONTS` in `src/lib/typography.js` and the files to `assets/fonts/` — the picker renders dynamically, no component changes needed. Good first contribution for the community.

## Running

```bash
npm install --legacy-peer-deps   # only needed if .npmrc gets removed
npm start                        # Expo Dev Tools (scan QR or open in simulator)
npm run ios                      # iOS simulator (needs Xcode locally; or use Expo Go)
npm run android                  # Android emulator (or use Expo Go)
npm run web                      # browser preview via react-native-web — NOT for production
```

The `web` target is useful for quick previewing but is not the production web frontend. The real web app lives at `../frontend`.

## Related repos

- Server: `../server` (Node/Express, Mongo, ActivityPub)
- Web frontend: `../frontend` (Vite + React + Tailwind v4 + DaisyUI)
- Client lib: `../client` (linked into this app as `@kowloon/client`)
