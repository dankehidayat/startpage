# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personal browser startpage for a single user. The visitor arrives in a new tab and immediately needs to navigate to a service, search the web, or access a bookmarked resource. The primary use case is quick navigation and search — not browsing or content consumption.

## Product Purpose

Replace the browser's default new-tab page with a keyboard-first command surface wrapped in a cozy, art-forward card. Success is speed: the user types a few characters, selects a suggestion or command, and is on their destination in under two seconds — while the page itself feels personal and pleasant to return to dozens of times a day.

## Positioning

A Homely-inspired startpage: a single dark/light-adaptive card centered on a cream puzzle-pattern background, anime art carousel on the left, categorized link pills on the right. Alias-based shortcuts (e.g. `gh` → GitHub, `yt` → YouTube), DuckDuckGo autocomplete, and a command palette that opens on any keypress. The differentiators are the alias system, the art-driven dynamic accent color, and the calm single-card layout.

## Operating Context

- Opened as the browser's new tab or pinned startpage
- Keyboard-first: any key opens search, Escape closes, arrow keys navigate suggestions
- DuckDuckGo JSONP for autocomplete suggestions with debounced fetching
- Commands organized by category (AI & Chat, Development, Media, Tools)
- Art carousel cycles local ikizulive artwork every 5–30 seconds (user-configurable)
- Featured links tint themselves with the dominant color extracted from the current art
- Dark/light theme toggle persisted in localStorage
- Settings panel (Ctrl+,) for username, carousel delay, and clock visibility — persisted in localStorage

## Capabilities and Constraints

- Single-page Next.js application (React 19, Tailwind CSS v4, next/image)
- Search with command list, recent searches, and DuckDuckGo JSONP autocomplete
- Command aliases with configurable delimiters (` ` for search, category-aware navigation)
- 4chan board shortcuts, Reddit subreddit shortcuts, Nyaa search
- Featured-first visual hierarchy on link pills (GitHub, YouTube Music, Spotify, Miruro, Twitter, Google Drive)
- Live clock with Japanese time-based greetings (おはよう / こんにちは / おやすみなさい)
- Dynamic color extraction from carousel art (canvas sampling, luminance-filtered, WCAG-aware text color)
- Settings: custom username, carousel interval (min 5s), show/hide clock
- Responsive: art panel + links panel on desktop, stacked column on mobile
- No authentication, no server-side logic, no database — all preferences in localStorage

## Brand Commitments

- Product name in UI: "Neon"; README project name: "Startpage"
- Voice: quiet, personal, polite — Japanese greeting as the human touch
- Art is decorative, always credited to the original artist with source link
- No external dependencies beyond React, Tailwind, next/image, and standard Next.js

## Evidence on Hand

- Working codebase at `/Users/ltna01/Developer/Neon`
- Command definitions in `src/lib/commands.ts` (featured flags, aliases, search templates)
- Visual implementation in `src/app/globals.css` (~815 lines, CSS custom-property theming)
- Page shell and carousel in `src/app/page.tsx` (clock, color extraction, settings panel)
- Search component: `src/components/Search.tsx` (~774 lines, command palette UX)
- Commands component: `src/components/Commands.tsx` (category groups + pills)
- Local artwork in `public/art/` (13 pieces by carskey1120, ikizulive / Love Live Bluebird)

## Product Principles

1. Speed over beauty — every millisecond between keypress and destination matters
2. Keyboard-first — mouse is optional, touch is secondary
3. Alias power — a two-character shortcut should replace three clicks
4. One card, calm surface — the whole startpage lives in a single centered container
5. Art that participates — the current artwork colors the UI, not just decorates it
6. Personal but simple — greeting, clock, and preferences adapt without accounts

## Accessibility & Inclusion

- Keyboard navigation for all interactive elements with visible focus-visible outlines
- ARIA labels on search input, suggestions, settings, and icon-only buttons
- 44px minimum tap targets (theme toggle, settings, pills)
- WCAG-aware contrast: extracted accent colors get luminance-based foreground selection
- Search modal scroll containment on small viewports
