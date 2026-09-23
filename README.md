# Startpage

A cozy, keyboard-first browser startpage. One centered card: anime art carousel on the left, your most-used links on the right, command palette on any keypress.

## Features

### Command palette search

- Press any letter (or `Space`) to open the search modal
- Alias navigation: `gh` → GitHub, `yt` → YouTube, `rd` → Reddit, `ai` → ChatGPT
- DuckDuckGo autocomplete with debounced suggestions
- Recent searches remembered locally (last 5)
- Domain previews, keyboard hints, and full arrow-key navigation

### Organized link pills

- Categories: **AI & Chat**, **Development**, **Media**, **Tools**
- Featured links (GitHub, YouTube Music, Spotify, Miruro, Twitter, Google Drive) render as accent-colored pills
- Search-enabled commands: `yt linux tutorial`, `rd programming`, `ny torrent`, `4c fit`

### Art-driven design

- Local art carousel (13 pieces by [carskey1120](https://x.com/carskey1120)) crossfading every 5–30 seconds
- Dominant color extracted from the current art tints the featured pills, focus rings, and puzzle background
- Contrast-safe: text color is chosen per-accent with luminance checks
- Every artwork is credited to its original artist with a source link

### Personal settings (`Ctrl+,`)

- Custom username for the greeting (`ごきげんよう、{name}さん！`)
- Carousel interval slider (5s – 30s)
- Show / hide the clock
- All preferences persist in `localStorage` — no accounts

### Theme system

- Light (cream) and dark themes, toggle persisted
- 44px touch targets, visible focus outlines, mobile scroll containment

## Quick start

```bash
git clone https://github.com/dankehidayat/neon.git
cd neon-startpage
npm install
npm run dev
```

Production build:

```bash
npm run build
npm start
```

## Keyboard shortcuts

| Key | Action |
|---|---|
| Any letter / `Space` | Open search |
| `Escape` | Close search / modals |
| `↑` `↓` | Navigate suggestions |
| `Enter` | Execute selection |
| `Ctrl/Cmd + T` | Toggle theme |
| `Ctrl + ,` | Open settings |
| `?` | Show help |

## Tech stack

- **Next.js 15** (App Router) + **React 19**
- **Tailwind CSS v4** with CSS custom-property theming
- **next/image** for the art carousel
- **TypeScript** throughout
- DuckDuckGo JSONP autocomplete — no backend

## Configuration

Add commands in `src/lib/commands.ts`:

```typescript
{
  id: "example",
  name: "Example Service",
  url: "https://example.com",
  category: "tools",
  aliases: ["ex", "example"],
  searchTemplate: "https://example.com/search?q={}", // optional
  featured: true, // optional accent pill
}
```

Search behavior lives in the `CONFIG` export of the same file (default engine, delimiters, suggestion limit).

### Artwork

Drop images into `public/art/` and register them in the `ARTWORKS` array in `src/app/page.tsx` with `src`, `alt`, `artist`, and `source` — the credit link and color extraction pick them up automatically.

## Project structure

```
src/
├── app/
│   ├── page.tsx        # Card layout, carousel, clock, color extraction, settings
│   ├── layout.tsx      # Font + metadata
│   └── globals.css     # Themed tokens + all component styles
├── components/
│   ├── Commands.tsx    # Category groups + link pills
│   └── Search.tsx      # Command palette, autocomplete, help modal
└── lib/
    └── commands.ts     # Command list + config
public/
└── art/                # Local artwork (credited)
```

## License

MIT
