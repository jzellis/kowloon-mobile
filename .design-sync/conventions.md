# Building on-brand with Kowloon

This is a **token + guidelines** design system (no component library — the source
app is React Native, so there are no browser-renderable components to compose).
Build with your own web components, but style them entirely from the tokens and
rules below so the result matches the Kowloon editorial aesthetic.

## Setup

Import `styles.css` once at the root. It pulls in every token file and the five
bundled fonts, and sets an editorial base layer (warm-paper background, ink text,
light UI sans, radius 0). No provider or wrapper is needed. Style everything with
the `var(--*)` custom properties it defines — do not hardcode hex or px that a
token already covers.

## The idiom: CSS custom properties, hard edges, tracked labels

No utility-class framework and no component props carry the design language — the
vocabulary is **CSS variables**. The signature moves:

- **Warm paper, cool ink.** Canvas `var(--color-base-100)` (`#FAF4E8`), text
  `var(--color-base-content)` (`#1A1A20`). Text hierarchy is ink at opacity steps:
  `var(--ink-label)` /70, `var(--ink-eyebrow)` /60, `var(--ink-muted)` /50,
  `var(--ink-meta)` /45. Never below /40 for readable text.
- **Structure by border, never shadow.** There are no shadows. Depth comes from
  2px frames: `var(--border-loud)` (ink, on buttons/controls), `var(--border-quiet)`
  (base-300, on inputs/images), `var(--border-divider)` (hairline, on rows).
- **Radius 0 everywhere.** `var(--radius)` is 0. The only round shapes are the
  circular user avatar and the flat-top hexagon circle/group avatar.
- **Every non-content label is UI sans, UPPERCASE, and letter-spaced.** Use
  `var(--font-ui)` at weight 300, `text-transform: uppercase`, and a tracking
  token: `var(--tracking-eyebrow)` 0.25em (eyebrows), `var(--tracking-button)`
  0.18em (buttons), `var(--tracking-field-label)` 0.22em (field labels). The
  `.eyebrow` class in `styles.css` bundles this for kickers.
- **Type carries the brand.** Headings use the display serif `var(--font-reading)`
  (Lora); chrome uses the light sans `var(--font-ui)` (Inter 300). Body/reading
  text uses one of the five reading families (`--font-inter`, `--font-atkinson`,
  `--font-lora`, `--font-merriweather`, `--font-opendyslexic`) at a stepped size
  (`--text-xs`..`--text-xl`, default `--text-m` 16px) and line-height
  (`--leading-compact|normal|relaxed`).
- **Brand color, sparingly.** `var(--color-primary)` (steel blue) for primary
  actions/active states; `var(--color-secondary)` (navy) for selected rows and
  avatar fallbacks; `var(--color-accent)` (vermillion) for rare emphasis. Content
  types own an accent: `var(--color-post-note|article|media|link|event)`.
- **Gutter.** Standard content inset is `var(--gutter)` (20px); card padding
  `var(--card-pad-x/y)`.

## Where the truth lives

Read `styles.css` and its imports (`tokens/colors.css`, `tokens/typography.css`,
`tokens/spacing.css`, `tokens/borders.css`) for the full token set, and
`guidelines/design-system.md` for the complete editorial guide — principles,
type roles, component patterns (Button/Field/SegmentedControl/PostCard), and
accessibility notes. When in doubt, read those before inventing a value.

## One idiomatic snippet

```html
<article style="background: var(--color-base-100); border-bottom: var(--border-divider);
                padding: var(--card-pad-y) var(--card-pad-x);">
  <p class="eyebrow" style="color: var(--color-post-article);">Article</p>
  <h2 style="font-family: var(--font-reading); color: var(--color-base-content);">
    The quiet edge of the city
  </h2>
  <button style="border: var(--border-loud); background: var(--color-primary);
                 color: var(--color-primary-content); font-family: var(--font-ui);
                 font-weight: 300; text-transform: uppercase;
                 letter-spacing: var(--tracking-button); padding: 12px 20px;">
    Read
  </button>
</article>
```
