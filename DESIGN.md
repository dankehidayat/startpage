# DESIGN

<!-- impeccable:design-schema 1 -->

## Visual World

**Homely-inspired cozy card.** Mode: Operate. The startpage is a single centered card — art on the left, work on the right — sitting on a cream puzzle-pattern field. Rejected worlds (anime game HUD, bubbly yui540) are anti-references; do not resurrect scan lines, neon glow, gradient text, or heavy glassmorphism.

## Thesis

Calm single-card command surface where the artwork isn't decoration — it drives the accent color of the interface.

## Layout

- **Desktop:** centered card, `max-width: 36rem` → flex row: art panel (~40%) + links panel. Fixed top-right controls (settings gear, theme toggle).
- **Mobile (<768px):** art stacks above links; card is `max-height: calc(100vh - 2rem)` with internal scroll; controls nudge inward; greeting drops to `1.125rem`.
- **Page:** full-viewport cream background (`--bg: #F5F0EB` light / `#111111` dark) with a puzzle-piece SVG pattern.

## Color Tokens

CSS custom properties in `globals.css`, themed via `.dark` class:

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#F5F0EB` | `#111111` |
| `--card-bg` | `#FFFFFF` | `#1A1A1A` |
| `--card-fg` | `#333333` | (near-white) |
| `--pill-bg` | `#F0F0F0` | `#2A2A2A` |
| `--pill-fg` | `#333333` | `#CCCCCC` |
| `--pill-border` | `#E0E0E0` | `#3A3A3A` |
| `--pill-hover` | `#D8D8D8` | `#404040` |
| `--pill-hover-fg` | `#1A1A1A` | `#FFFFFF` |
| `--muted` | `#777777` | — |

### Dynamic art accent (Material You style)

`extractDominantColor()` in `page.tsx` samples the active carousel image on a 64×64 canvas, quantizes, skips near-white (`luminance > 0.70`) and near-black (`< 0.08`), and publishes:

- `--art-primary`, `--art-primary-light`, `--art-primary-dark` — featured pill + puzzle tint
- `--art-primary-text` — WCAG luminance-based foreground (white or `#1A1A1A`)

Featured pills, puzzle background (via `mask-image`), and focus rings read these vars. They change with every carousel slide.

## Typography

- **DM Sans** — everything (body, greeting, pills). No Inter.
- Greeting: `ごきげんよう、{username}さん！` at ~1.5rem, `line-height: 1.3`
- Sub-line: time-based Japanese greeting + 24h clock (`tabular-nums`)
- Category labels: uppercase, `0.55` opacity, weight 600

## Components

### Main card
`.main-card` — rounded `1.25rem`, theme-adaptive background, soft shadow (deeper in dark), transitioned background-color.

### Art panel
`.art-panel` — absolute-positioned crossfade carousel (`.art-slide` / `.art-slide-active`, 10s default, configurable 5–30s). `next/image` with `fill unoptimized`. Bottom gradient fade carries `.art-credit` (0.8125rem, white 90%, link underlined at 0.6 opacity) → original artist's source URL.

### Link pills
`.link-pill` — rounded `0.5rem`, `0.4375rem 0.875rem` padding, 0.2s transition, lift 1px on hover. Hover uses `--pill-hover` / `--pill-hover-fg`: **soft darkening in light mode, gentle lightening in dark mode — never a high-contrast flip.** `:focus-visible` gets accent outline + glow.

`.link-pill-featured` — `var(--art-primary)` bg, `var(--art-primary-text)` fg; dark mode uses `--art-primary-light`. Featured set: GitHub, YouTube Music, Spotify, Miruro, Twitter, Google Drive.

### Search palette
Overlay (`backdrop-filter: blur`) + `.search-box`: input row with icon, debounced (200ms) DuckDuckGo autocomplete, vertical `.search-result` rows (command icon · label · domain · arrow), recent searches (localStorage, max 5), loading spinner, keyboard hints footer (`↑↓` `↵` `esc` `?`). Mobile: `padding-top: 10vh`, `max-height: 80vh`, scrollable.

### Settings panel
Modal with username text input, carousel-delay slider (5–30s), show-clock toggle. Persists to `localStorage` (`neon_username`, `neon_carousel_delay`, `neon_show_clock`). Opens via gear button or `Ctrl+,`.

### Puzzle background
Inline SVG puzzle pattern as `mask-image`, painted with `background-color: var(--art-primary)` — the field tints with the art. Opacity ~12% light / 15% dark.

## Motion

- Pill hover: `transform: translateY(-1px)` + color, `0.2s ease`; `:active` returns to 0
- Carousel: opacity crossfade
- Card/theme: `background-color 0.3s ease`
- No parallax, no floating loops, no glow pulses

## Accessibility floor

- 44px tap targets on toggle/settings
- focus-visible outlines on all pills and interactive elements
- Contrast: luminance-checked foregrounds on extracted accents
- Mobile scroll containment on card and search results
- Print: hide controls

## Don'ts

- Don't add gradient headline text, HUD corners, scan lines, or neon glow
- Don't force `#FFFFFF`/`#1A1A1A` text onto extracted accent colors — use `--art-primary-text`
- Don't use pure-black (`#1A1A1A`) hover fills on light-mode pills — hover stays soft
- Don't stack more than one card or reintroduce a link grid
