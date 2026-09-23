"use client";

import { useState, useCallback, useEffect } from "react";
import NextImage from "next/image";
import Search from "@/components/Search";
import Commands from "@/components/Commands";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "おやすみなさい";
  if (hour < 12) return "おはようございます";
  if (hour < 17) return "こんにちは";
  if (hour < 21) return "こんばんは";
  return "おやすみなさい";
}

function Clock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span className="clock-display">{time}</span>;
}

/** Calculate relative luminance (0–1) per WCAG 2.x */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function extractDominantColor(img: HTMLImageElement): {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  primaryText: string;
} {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  // Color frequency buckets
  const buckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
  const step = 16;

  for (let i = 0; i < data.length; i += 4) {
    const r = Math.round(data[i] / step) * step;
    const g = Math.round(data[i + 1] / step) * step;
    const b = Math.round(data[i + 2] / step) * step;
    const a = data[i + 3];
    if (a < 128) continue;

    // Skip colors that are too light or too dark (use luminance, not per-channel)
    const lum = luminance(r, g, b);
    if (lum > 0.70) continue; // near-white — unreliable as an accent
    if (lum < 0.08) continue; // near-black — invisible on dark bg

    const key = `${r}-${g}-${b}`;
    if (!buckets[key]) buckets[key] = { r, g, b, count: 0 };
    buckets[key].count++;
  }

  const sorted = Object.values(buckets).sort((a, b) => b.count - a.count);
  if (sorted.length === 0) {
    return {
      primary: "#8B9A7B",
      primaryLight: "#A8B89A",
      primaryDark: "#6B7A5B",
      accent: "#E8C4A0",
      primaryText: "#FFFFFF",
    };
  }

  const top = sorted[0];
  const r = top.r, g = top.g, b = top.b;

  const toHex = (r: number, g: number, b: number) =>
    `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  // Lighten / darken
  const lr = Math.min(255, r + 30);
  const lg = Math.min(255, g + 30);
  const lb = Math.min(255, b + 30);
  const dr = Math.max(0, r - 40);
  const dg = Math.max(0, g - 40);
  const db = Math.max(0, b - 40);

  // Accent (shift hue slightly toward warm)
  const ar = Math.min(255, r + 20);
  const ag = Math.min(255, g + 10);
  const ab = Math.max(0, b - 20);

  // Determine readable text color based on luminance
  const bgLum = luminance(r, g, b);
  const whiteLum = luminance(255, 255, 255);
  const blackLum = luminance(0, 0, 0);
  const whiteContrast = (whiteLum + 0.05) / (bgLum + 0.05);
  const blackContrast = (bgLum + 0.05) / (blackLum + 0.05);
  // Use whichever gives better contrast; require at least 3:1 for featured pills
  const primaryText = whiteContrast >= blackContrast ? "#FFFFFF" : "#1A1A1A";

  return {
    primary: toHex(r, g, b),
    primaryLight: toHex(lr, lg, lb),
    primaryDark: toHex(dr, dg, db),
    accent: toHex(ar, ag, ab),
    primaryText,
  };
}

const ARTWORKS = [
  {
    src: "/art/komagata_hanabi.jpg",
    alt: "Komagata Hanabi",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/2064985514273607758",
  },
  {
    src: "/art/chofu_noriko.jpg",
    alt: "Chofu Noriko",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/2040276099738096098",
  },
  {
    src: "/art/chofu_noriko-1.jpg",
    alt: "Chofu Noriko",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/2030568894277222883",
  },
  {
    src: "/art/momogose_ginko.jpg",
    alt: "Momogose Ginko",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/1959152220043420035",
  },
  {
    src: "/art/ceras_ginko.jpg",
    alt: "Ceras & Ginko",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/1977625933055135881",
  },
  {
    src: "/art/sasaki_shion.jpg",
    alt: "Sasaki Shion",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/1984168008571613580",
  },
  {
    src: "/art/ceras_yanagida.jpg",
    alt: "Ceras Yanagida",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/1955197496701096398",
  },
  {
    src: "/art/kuwayama_chiyuki.jpg",
    alt: "Kuwayama Chiyuki",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/1931190098298802238",
  },
  {
    src: "/art/goto_akira.jpg",
    alt: "Goto Akira",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/2033538867127808459",
  },
  {
    src: "/art/kamiina_botan.jpg",
    alt: "Kamiina Botan",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/2055674831195300062",
  },
  {
    src: "/art/amaori_renako.jpg",
    alt: "Amaori Renako",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/2006267483339235641",
  },
  {
    src: "/art/komagata_hanabi-1.jpg",
    alt: "Komagata Hanabi",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/2074525839337922672",
  },
  {
    src: "/art/chofu_noriko-2.jpg",
    alt: "Chofu Noriko",
    artist: "carskey1120",
    source: "https://x.com/carskey1120/status/2055674130054381777",
  },
];

export default function Home() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [initialInput, setInitialInput] = useState("");
  const [isDark, setIsDark] = useState(false);
  const [currentArt, setCurrentArt] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // Settings state (from localStorage)
  const [username, setUsername] = useState("西宮");
  const [carouselDelay, setCarouselDelay] = useState(10);
  const [showClock, setShowClock] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("neon_username");
    const savedDelay = localStorage.getItem("neon_carousel_delay");
    const savedClock = localStorage.getItem("neon_show_clock");

    if (savedUsername !== null) setUsername(savedUsername);
    if (savedDelay !== null) setCarouselDelay(Number(savedDelay));
    if (savedClock !== null) setShowClock(savedClock === "true");
  }, []);

  // Theme init
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // Carousel: rotate at user-configured interval
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentArt((prev) => (prev + 1) % ARTWORKS.length);
    }, carouselDelay * 1000);
    return () => clearInterval(interval);
  }, [carouselDelay]);

  // Extract dominant color and determine readable text color
  useEffect(() => {
    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.src = ARTWORKS[currentArt].src;
    img.onload = () => {
      try {
        const colors = extractDominantColor(img);
        const root = document.documentElement;
        root.style.setProperty("--art-primary", colors.primary);
        root.style.setProperty("--art-primary-light", colors.primaryLight);
        root.style.setProperty("--art-primary-dark", colors.primaryDark);
        root.style.setProperty("--art-accent", colors.accent);
        root.style.setProperty("--art-primary-text", colors.primaryText);
      } catch {
        // Canvas tainted — keep defaults
      }
    };
  }, [currentArt]);

  const toggleTheme = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const newDark = !isDark;
      setIsDark(newDark);
      if (newDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    },
    [isDark]
  );

  const handleSearch = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const handleCommandClick = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  // Save settings to localStorage
  const saveUsername = useCallback((name: string) => {
    setUsername(name);
    localStorage.setItem("neon_username", name);
  }, []);

  const saveCarouselDelay = useCallback((delay: number) => {
    setCarouselDelay(delay);
    localStorage.setItem("neon_carousel_delay", String(delay));
  }, []);

  const saveShowClock = useCallback((show: boolean) => {
    setShowClock(show);
    localStorage.setItem("neon_show_clock", String(show));
  }, []);

  // Global keyboard: any letter opens search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (
        !searchOpen &&
        e.key.length === 1 &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        setInitialInput(e.key);
        setSearchOpen(true);
        e.preventDefault();
      }

      if (!searchOpen && e.key === " ") {
        setInitialInput("");
        setSearchOpen(true);
        e.preventDefault();
      }

      if (searchOpen && e.key === "Escape") {
        setSearchOpen(false);
        e.preventDefault();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "t") {
        e.preventDefault();
        toggleTheme();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        setShowSettings((s) => !s);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, toggleTheme]);

  return (
    <>
      {/* Puzzle pattern background */}
      <div className="puzzle-bg" aria-hidden="true" />

      {/* Top-right controls */}
      <div className="top-controls">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSettings(true);
          }}
          className="top-btn"
          title="Settings (Ctrl+,)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button
          onClick={toggleTheme}
          className="top-btn"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Centered main card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div
          className="main-card"
          onClick={() => {
            setInitialInput("");
            setSearchOpen(true);
          }}
        >
          {/* Art panel carousel */}
          <div className="art-panel" onClick={(e) => e.stopPropagation()}>
            {ARTWORKS.map((art, i) => (
              <NextImage
                key={art.src}
                src={art.src}
                alt={art.alt}
                fill
                unoptimized
                className={`art-slide ${i === currentArt ? "art-slide-active" : ""}`}
              />
            ))}
            <div className="art-credit">
              Art by <a href={ARTWORKS[currentArt].source} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{ARTWORKS[currentArt].artist}</a>
            </div>
          </div>

          {/* Links */}
          <div className="links-panel">
            <div className="greeting-block">
              <div className="greeting-name">ごきげんよう、{username}さん！</div>
              <div className="greeting-sub">
                {getGreeting()}
                {showClock && <Clock />}
              </div>
            </div>

            <Commands onCommandClick={handleCommandClick} />

          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-card" onClick={(e) => e.stopPropagation()}>
            <div className="settings-header">
              <h2>Settings</h2>
              <button className="settings-close" onClick={() => setShowSettings(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="settings-body">
              {/* Username */}
              <div className="settings-group">
                <label className="settings-label">Username</label>
                <p className="settings-desc">Displayed in the greeting</p>
                <input
                  type="text"
                  className="settings-input"
                  value={username}
                  onChange={(e) => saveUsername(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              {/* Carousel delay */}
              <div className="settings-group">
                <label className="settings-label">Art rotation speed</label>
                <p className="settings-desc">Change how often the art rotates ({carouselDelay}s)</p>
                <div className="settings-slider-row">
                  <span className="settings-slider-label">5s</span>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={carouselDelay}
                    onChange={(e) => saveCarouselDelay(Number(e.target.value))}
                    className="settings-slider"
                  />
                  <span className="settings-slider-label">30s</span>
                </div>
              </div>

              {/* Show clock */}
              <div className="settings-group settings-toggle-row">
                <div>
                  <label className="settings-label">Show clock</label>
                  <p className="settings-desc">Display the time next to the greeting</p>
                </div>
                <button
                  className={`settings-toggle ${showClock ? "settings-toggle-on" : ""}`}
                  onClick={() => saveShowClock(!showClock)}
                >
                  <span className="settings-toggle-knob" />
                </button>
              </div>
            </div>

            <div className="settings-footer">
              <kbd className="search-kbd">Ctrl</kbd>
              <kbd className="search-kbd">,</kbd>
              <span className="settings-footer-text">to toggle settings</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <Search
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSearch={handleSearch}
        initialInput={initialInput}
      />
    </>
  );
}
