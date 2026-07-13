# Kowloon Mobile — Design System

Extracted from the current mobile app (`~/Projects/kowloon/mobile`). This is the
canonical reference for the editorial aesthetic shared with the web frontend.
Tokens live in `tailwind.config.js`; the typography engine lives in
`src/lib/typography.js`. When those files change, update this doc.

---

## 1. Design principles

1. **Editorial, not social-app.** The feel is a printed magazine, not a chat
   client. Serious typography, generous whitespace, restrained color.
2. **Hard edges everywhere.** No rounded corners on chrome. `borderRadius`
   default is `0` in the theme. The *only* rounded shape is the round user
   avatar (person = circle is a universal convention). Circles and Groups use a
   flat-top **hexagon** (`HexAvatar`), never a rounded square.
3. **Structure by rule, not by shadow.** Hierarchy comes from 2px borders,
   hairline dividers, and uppercase eyebrows — not drop shadows or elevation.
   There are effectively no shadows in the system.
4. **Type carries the brand.** A display serif (Lora) for headings, a light sans
   (Inter) for chrome, and a user-selectable reading font for body content.
   Uppercase + wide letter-spacing is the signature of every label and button.
5. **Reading is a first-class feature.** Body text on reading surfaces is driven
   by per-account typography prefs (font, size, line-height, column width), not
   hardcoded. Chrome fonts never change; reading fonts always defer to the user.
6. **Warm paper, cool ink.** The canvas is a warm cream, the ink near-black. Accent
   color is used sparingly and with intent.

---

## 2. Color

Defined under `theme.extend.colors` in `tailwind.config.js`. Historically these
were hex approximations of the OKLCH values in `frontend/src/index.css`; as of
2026-07 the mobile paper is **desaturated** (less yellow) and a **Klein blue
header** + a **near-white field surface** were added as mobile-first decisions,
so mobile now diverges from the web theme until the frontend is updated to match.

### Surfaces & ink (`base`)
| Token | Hex | Role |
|---|---|---|
| `base-100` | `#F7F3EC` | Warm paper (desaturated) — the default canvas / card fill |
| `base-200` | `#EAE4D8` | Slightly deeper paper — dividers, image placeholders, hover |
| `base-300` | `#D8CFBD` | Deepest paper — 2px borders on inputs/images |
| `base-content` | `#1A1A20` | Near-black ink — all primary text, strong borders |

Ink is used at opacity steps for hierarchy: `/70` (secondary labels), `/60`
(eyebrows), `/50` (timestamps, handles), `/45`–`/40` (tertiary/meta), `/35`
(placeholder text).

### Brand roles
| Token | Hex | Content-on | Role |
|---|---|---|---|
| `primary` | `#5588B1` | `#F4F5F7` | Desaturated steel blue — primary actions, active states, focus |
| `secondary` | `#393B7A` | `#FAF4E8` | Medium navy — secondary actions, avatar fallbacks, selected rows |
| `accent` | `#C0394A` | `#F7E8E8` | Vermillion — sparingly, for emphasis |

### Status
| Token | Hex | Content-on |
|---|---|---|
| `success` | `#2F9956` | `#F0F8F2` |
| `warning` | `#D9B038` | `#1A1A20` |
| `error` | `#C0394A` | `#F7E8E8` |
| `info` | `#3C8DB8` | `#F0F6FA` |

### Post-type accents
Each post type owns one color, used consistently for the icon tint, the type
picker underline, and the feed-card accent (eyebrow label). Also duplicated in
`src/lib/postTypes.js` for use in inline styles.

| Type | Token | Hex |
|---|---|---|
| Note | `post-note` | `#B76C00` |
| Article | `post-article` | `#006893` |
| Media | `post-media` | `#009084` |
| Link | `post-link` | `#417843` |
| Event | `post-event` | `#CC272E` |

> NativeWind needs full class names at build time — you cannot interpolate
> `text-post-${type}`. Use a static lookup map (see `TYPE_META` in `PostCard.jsx`).

### App header & input surface
| Token | Hex | Content-on | Role |
|---|---|---|---|
| `header` | `#002FA7` | `#FFFFFF` | Yves Klein blue — the app top header / masthead. Title set in white **sans** (Inter), not the display serif, and the blue extends up through the status-bar area. |
| `field` | `#FCFBF7` | — | Near-white surface for all text inputs and the composer editor — lifts off the paper so an input reads as editable. Applied via `bg-field`. |

---

## 3. Typography

### Chrome fonts (static, Tailwind tokens)
Bundled via `expo-font`; declared in `theme.fontFamily`.

| Token | Font | Use |
|---|---|---|
| `font-reading` | Lora Regular | Editorial display serif — headings, title cards |
| `font-ui` | Inter Light (300) | Labels, buttons, eyebrows, timestamps, all chrome |
| `font-mono` | monospace | Code / rare technical strings |
| `inter-medium` | Inter Regular (400) | Applied inline for display names where Light reads too thin and Bold too heavy |

### Reading fonts (dynamic, inline styles)
The user picks from five bundled families via settings. **Never** apply these as
Tailwind classes — resolve through `useTypography()` and spread onto the surface.

- Inter (default), Atkinson Hyperlegible, Lora, Merriweather, OpenDyslexic
- Each ships Regular / Bold / Italic.
- Single source of truth: the `FONTS` array in `src/lib/typography.js`. Adding a
  font = one entry + its files; the picker, asset map, and resolver all derive
  from it.

### Stepped scales (`src/lib/typography.js`)
```
FONT_SIZES     xs 10 · s 14 · m 16 (default) · l 18 · xl 21
LINE_SPACINGS  compact 1.3 · normal 1.55 (default) · relaxed 1.8
COLUMN_WIDTHS  narrow 36 · normal 22 (default) · wide 12   (horizontal padding, px)
```
Reading defaults: `{ fontFamily: inter, fontSize: m, lineSpacing: normal, columnWidth: normal }`.
`resolveTypography(prefs)` returns concrete `{ regularFamily, boldFamily,
italicFamily, fontSize, lineHeight, paddingHorizontal }` to spread onto reading
surfaces.

### Type roles as used in chrome
| Role | Recipe |
|---|---|
| Screen / card title | `font-ui text-xl text-base-content leading-tight` (serif `font-reading` for display cards) |
| Display name (author) | `inter-medium`, `text-sm`, `text-base-content` |
| Handle / timestamp | `font-ui text-xs text-base-content/50` |
| **Eyebrow / kicker** | `font-ui uppercase tracking-[0.25em] text-[10px] text-base-content/60` |
| **Button label** | `font-ui uppercase tracking-[0.18em] text-sm` |
| **Field label** | `font-ui uppercase tracking-[0.22em] text-[11px] text-base-content/70` |
| **Segmented / picker label** | `font-ui uppercase tracking-[0.12em] text-xs` |
| Type accent label | `font-ui text-[10px] uppercase tracking-[0.16em] {post-color}` |

**Signature rule:** every non-content label is `font-ui`, `uppercase`, and
letter-spaced. Tracking scales loosely with size — smaller text gets wider
tracking (`0.25em` at 10px down to `0.12em` at 12px+).

---

## 4. Shape, border & elevation

- **Radius:** `0` everywhere (`borderRadius.none` and `.DEFAULT` both `"0"`).
  Exceptions: round `Avatar` (people), hexagonal `HexAvatar` (circles/groups).
- **Borders are the primary structural device:**
  - `border-2 border-base-content` — strong frame (buttons, segmented control,
    pickers, checkboxes). The "loud" border.
  - `border-2 border-base-300` — soft frame (inputs, images, avatars). The "quiet" border.
  - `border-b border-base-200` — hairline row divider (feed cards).
  - `border-t border-base-300` / `border-b-2 border-base-300` — section rules.
- **No shadows / elevation.** Depth is communicated by border weight and paper tone.
- **Android ripple** is the standard press feedback: `rgba(0,0,0,0.04–0.08)` on
  dark-on-light surfaces (lighter for larger tap targets).

---

## 5. Spacing & layout

- **Screen gutter:** `px-5` (20px) is the standard horizontal content inset
  (feed cards, headers, sheet rows).
- **Card padding:** `px-5 py-5`. Internal vertical rhythm uses `mb-1` to `mb-3`
  between stacked elements; `mt-3 pt-3` above a bordered action bar.
- **Control padding:** buttons `py-3 px-5`; inputs `px-3 py-3`; pickers
  `px-3 py-2.5`; sheet rows `px-5 py-3`.
- **Row gaps:** author row uses `ml-3` between avatar and text; image grids use
  a literal `gap: 4`.
- **Field stack:** `mb-4` between form fields; label `mb-1` above input; error/hint `mt-1`.
- Follow the base-4 scale (Tailwind default). Favor `2 / 3 / 5` step values as
  seen throughout.

---

## 6. Iconography

- **`lucide-react-native`** is the icon set. Default `strokeWidth` is thin
  (`1.75`) to match the light Inter chrome. Sizes: 18 inside inputs, ~20–24 in bars.
- Icon color follows ink opacity (`rgba(26,26,32,0.55)` for muted inline icons)
  or the relevant post-type / brand token.
- Simple glyphs (`▾`, `✓`) are set in text rather than iconized where a Lucide
  icon would be overkill.

---

## 7. Component patterns

All live under `src/components/ui/` (primitives) and feature folders
(`posts/`, `circles/`, `groups/`, `bookmarks/`).

### Button (`ui/Button.jsx`)
Hard-edged, `border-2`, uppercase tracked label, `py-3 px-5`. Variants:
- `primary` — `bg-primary`, primary border, `text-primary-content`
- `secondary` — `bg-secondary`, secondary border, `text-secondary-content`
- `ghost` — transparent, `border-base-content`, `text-base-content`
- `disabled`/`loading` → `/60` fill + `ActivityIndicator` swaps the label.

### Field (`ui/Field.jsx`)
Uppercase tracked label above; `border-2 border-base-300 bg-base-100 px-3 py-3`
input; `font-ui`. Placeholder ink `rgba(26,26,32,0.35)`. Optional secure-entry
reveal (eye icon), and mutually-exclusive `error` (in `text-error`) / `hint`
(`/50`) line below.

### SegmentedControl (`ui/SegmentedControl.jsx`)
Row of segments sharing one `border-2 border-base-content` frame; `border-l-2`
between segments; active segment `bg-primary` + `text-primary-content`. Discrete
steps, no slider.

### Checkbox (`ui/Checkbox.jsx`)
24px (`w-6 h-6`) hard-edged box, `border-2 border-base-content`, `bg-primary`
when checked with a text `✓`. Multi-line label allowed.

### BottomSheetPicker (`ui/BottomSheetPicker.jsx`)
Trigger: bordered row with uppercase label + `▾`. Sheet: `Modal` with
`bg-black/40` scrim, bottom-anchored `bg-base-100` panel, `border-t-2
border-base-content`, optional grouped sections, selected row `bg-secondary`.
This is the canonical selection pattern (AudienceSelector, FeedViewSelector all
share the shape).

### Avatars
- `posts/Avatar.jsx` — **round** user avatar, `border-2 border-base-300`,
  falls back to a `bg-secondary` block with the uppercased initial.
- `ui/HexAvatar.jsx` — **flat-top hexagon** (SVG ClipPath) for circles/groups,
  `fallbackColor` navy `#393B7A`.

### PostCard (`posts/PostCard.jsx`)
The reference composition. `border-b border-base-200 bg-base-100`, `px-5 py-5`.
Structure: author row (round avatar + `inter-medium` name + `/50` handle | right
column with uppercase type accent + timestamp) → type-specific body → action bar
above a `border-t border-base-300`. Body text uses the resolved reading
typography; titles/labels stay in chrome fonts. Images are `border-2
border-base-300 bg-base-200`, no radius.

### Headers (`posts/FeedHeader.jsx`)
Single-line bars, `border-b-2 border-base-300`, `px-5 py-2`, control on the left
and filters on the right.

---

## 8. Motion

Minimal and functional. `Modal` sheets use `animationType="fade"`. Press states
are Android ripple + iOS default `Pressable` opacity. No decorative animation —
the aesthetic is print-static.

---

## 9. Accessibility

- **OpenDyslexic** and **Atkinson Hyperlegible** ship as first-class reading
  fonts; the whole reading stack is user-tunable (size, spacing, column width).
- Interactive controls carry `accessibilityRole` / `accessibilityLabel`
  (e.g. the password reveal toggle) — continue this on new controls.
- `hitSlop` on small tap targets (e.g. `8` on the eye toggle).
- Ink-on-paper contrast (`#1A1A20` on `#F7F3EC`) is high; muted text stops at
  `/45`–`/50` to stay legible. Avoid going below `/40` for anything readable.

### Known gap
Bundled fonts are Latin-only; non-Roman scripts fall back to the device system
font. Adding non-Roman support is a self-contained change (`FONTS` array +
files).

---

## 10. Quick token reference (for new components)

```
Canvas         bg-base-100        (#F7F3EC)
Ink            text-base-content  (#1A1A20)
App header     bg-header / text-header-content   (Klein blue #002FA7, white sans)
Text input     bg-field           (#FCFBF7 near-white)
Loud frame     border-2 border-base-content
Quiet frame    border-2 border-base-300
Row divider    border-b border-base-200
Primary action bg-primary / text-primary-content
Selected row   bg-secondary / text-secondary-content
Gutter         px-5
Any label      font-ui uppercase tracking-[0.12em–0.25em]
Radius         0 (round Avatar / hex HexAvatar are the only exceptions)
Shadows        none
```
