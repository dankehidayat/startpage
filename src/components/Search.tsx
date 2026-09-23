"use client";

import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { COMMANDS, ALIAS_MAP, CONFIG, FOURCHAN_BOARDS } from "@/lib/commands";
import {
  escapeRegexCharacters,
  formatSearchUrl,
  isUrl,
  hasProtocol,
} from "@/lib/utils";

interface SearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (url: string) => void;
  initialInput?: string;
}

interface Suggestion {
  text: string;
  commandId?: string;
  isSearch?: boolean;
  url?: string;
  icon?: string;
  domain?: string;
}

interface ParsedQuery {
  query: string;
  url?: string;
  key?: string;
  search?: string;
  splitBy?: string;
  path?: string;
}

interface DuckDuckGoSuggestion {
  phrase: string;
}

declare global {
  interface Window {
    autocompleteCallback?: (res: DuckDuckGoSuggestion[]) => void;
  }
}

const RECENT_KEY = "startpage_recent_searches";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  try {
    const recent = getRecentSearches().filter((r) => r !== query);
    recent.unshift(query);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {}
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch {
    return "";
  }
}

function getCommandIcon(commandId: string): string {
  const icons: Record<string, string> = {
    github: "M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z",
    youtube: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    ytmusic: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 17.568A.672.672 0 0 1 17 18c-.24 0-.456-.096-.624-.264L12 14.28l-4.368 3.456A.672.672 0 0 1 7 17.016c0-.24.096-.456.264-.624L12 12l4.752 4.392c.168.168.264.384.264.624a.672.672 0 0 1-.448.552zM17 6H7a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1zm-5 10.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z",
    spotify: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z",
    miruro: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
    twitter: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
    drive: "M7.71 3.5L1.15 15l3.435 6L11.145 9.5zm.582 0L12.86 9.5h6.29L13.582 3.5zM12.86 11L9.145 17.5h6.29L12.86 11zM16.27 17.5L22.85 9.5h-3.435z",
    chatgpt: "M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z",
    claude: "M4.709 15.955l4.397-10.986c.2-.499.349-.873.549-.873.2 0 .349.374.549.873l4.397 10.986h-2.018l-1.003-2.645H7.73l-1.003 2.645H4.709zm3.62-4.526h3.214L9.926 6.682h-.044L8.33 11.429z",
    gemini: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  };
  return icons[commandId] || "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z";
}

function CommandIcon({ commandId, className }: { commandId: string; className?: string }) {
  const path = getCommandIcon(commandId);
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d={path} />
    </svg>
  );
}

const Search = forwardRef<HTMLInputElement, SearchProps>(function Search(
  { open, onOpenChange, onSearch, initialInput = "" },
  ref
) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [focusedSuggestion, setFocusedSuggestion] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setRefs = useCallback(
    (el: HTMLInputElement | null) => {
      inputRef.current = el;
      if (typeof ref === "function") {
        ref(el);
      } else if (ref) {
        ref.current = el;
      }
    },
    [ref]
  );

  const parseQuery = useCallback((raw: string): ParsedQuery => {
    const q = raw.trim();

    if (isUrl(q)) {
      const url = hasProtocol(q) ? q : `https://${q}`;
      return { query: q, url };
    }

    const fourchanMatch = q.match(/^(4c|chan)\s+([a-z0-9]+)$/i);
    if (fourchanMatch) {
      const [, , board] = fourchanMatch;
      const normalizedBoard = board.toLowerCase();
      if (FOURCHAN_BOARDS[normalizedBoard]) {
        const url = `https://boards.4chan.org/${FOURCHAN_BOARDS[normalizedBoard]}/`;
        return { query: q, key: `4chan-${normalizedBoard}`, url };
      }
    }

    const redditMatch = q.match(
      /^(rd|r)\s+(r\/[a-zA-Z0-9_]+|[a-zA-Z0-9_]+)$/i
    );
    if (redditMatch) {
      const [, , subreddit] = redditMatch;
      const cleanSubreddit = subreddit.startsWith("r/")
        ? subreddit.substring(2)
        : subreddit;
      const url = `https://www.reddit.com/r/${cleanSubreddit}/`;
      return { query: q, key: "reddit", url };
    }

    const commandId = ALIAS_MAP[q.toLowerCase()];
    if (commandId) {
      const command = COMMANDS.find((c) => c.id === commandId);
      if (command) {
        return { query: q, key: commandId, url: command.url };
      }
    }

    let splitBy = CONFIG.commandSearchDelimiter;
    const [searchKey, rawSearch] = q.split(new RegExp(`${splitBy}(.*)`));

    if (searchKey && rawSearch) {
      const searchCommandId = ALIAS_MAP[searchKey.toLowerCase()];
      if (searchCommandId) {
        const command = COMMANDS.find((c) => c.id === searchCommandId);
        if (command && command.searchTemplate) {
          const search = rawSearch.trim();
          const url = formatSearchUrl(command.searchTemplate, search);
          return { query: q, key: searchCommandId, search, splitBy, url };
        }
      }
    }

    splitBy = CONFIG.commandPathDelimiter;
    const [pathKey, path] = q.split(new RegExp(`${splitBy}(.*)`));

    if (pathKey && path) {
      const pathCommandId = ALIAS_MAP[pathKey.toLowerCase()];
      if (pathCommandId) {
        const command = COMMANDS.find((c) => c.id === pathCommandId);
        if (command) {
          const url = `${new URL(command.url).origin}/${path}`;
          return { query: q, key: pathCommandId, path, splitBy, url };
        }
      }
    }

    const url = formatSearchUrl(CONFIG.defaultSearchTemplate, q);
    return { query: q, search: q, url };
  }, []);

  const fetchSearchSuggestions = useCallback(
    (search: string): Promise<string[]> => {
      return new Promise((resolve) => {
        if (window.autocompleteCallback) {
          delete window.autocompleteCallback;
        }

        window.autocompleteCallback = (res: DuckDuckGoSuggestion[]) => {
          const searchSuggestions: string[] = [];
          for (const item of res) {
            if (item.phrase === search.toLowerCase()) continue;
            searchSuggestions.push(item.phrase);
          }
          resolve(searchSuggestions);
          delete window.autocompleteCallback;
        };

        const script = document.createElement("script");
        script.src = `https://duckduckgo.com/ac/?callback=autocompleteCallback&q=${encodeURIComponent(
          search
        )}`;
        script.onload = () => script.remove();
        script.onerror = () => {
          resolve([]);
          script.remove();
        };

        document.head.appendChild(script);
      });
    },
    []
  );

  const handleInputChange = useCallback(
    async (value: string) => {
      setQuery(value);
      setFocusedSuggestion(-1);

      if (!value.trim()) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      const parsed = parseQuery(value);
      let newSuggestions: Suggestion[] = [];

      // Exact command matches
      const exactCommandMatches = COMMANDS.flatMap((command) =>
        (command.aliases || [])
          .filter((alias) => alias.toLowerCase() === value.toLowerCase())
          .map((alias) => ({
            text: alias,
            commandId: command.id,
            url: command.url,
            domain: extractDomain(command.url),
          }))
      );

      // Partial command matches
      const partialCommandMatches = COMMANDS.flatMap((command) =>
        (command.aliases || [])
          .filter(
            (alias) =>
              alias.toLowerCase().includes(value.toLowerCase()) &&
              alias.toLowerCase() !== value.toLowerCase()
          )
          .map((alias) => ({
            text: alias,
            commandId: command.id,
            url: command.url,
            domain: extractDomain(command.url),
          }))
      );

      // 4chan board matches
      if (
        value.toLowerCase().startsWith("4c ") ||
        value.toLowerCase().startsWith("chan ")
      ) {
        const prefix = value.toLowerCase().startsWith("4c ") ? "4c " : "chan ";
        const boardPrefix = value.slice(prefix.length).toLowerCase();

        const boardMatches = Object.keys(FOURCHAN_BOARDS)
          .filter((board) => board.startsWith(boardPrefix))
          .slice(0, 3)
          .map((board) => ({
            text: `${prefix.trim()} ${board}`,
            commandId: `4chan-${board}`,
            url: `https://boards.4chan.org/${FOURCHAN_BOARDS[board]}/`,
            domain: "4chan.org",
          }));

        newSuggestions = [...newSuggestions, ...boardMatches];
      }

      // Reddit subreddit matches
      if (
        value.toLowerCase().startsWith("rd ") ||
        value.toLowerCase().startsWith("r ")
      ) {
        const prefix = value.toLowerCase().startsWith("rd ") ? "rd " : "r ";
        const subredditPrefix = value.slice(prefix.length).toLowerCase();

        const popularSubreddits = [
          "programming",
          "gaming",
          "movies",
          "music",
          "news",
          "askscience",
          "todayilearned",
        ];
        const subredditMatches = popularSubreddits
          .filter((sub) => sub.startsWith(subredditPrefix))
          .slice(0, 3)
          .map((sub) => ({
            text: `${prefix.trim()} ${sub}`,
            commandId: "reddit",
            url: `https://www.reddit.com/r/${sub}/`,
            domain: "reddit.com",
          }));

        newSuggestions = [...newSuggestions, ...subredditMatches];
      }

      newSuggestions = [
        ...exactCommandMatches,
        ...partialCommandMatches,
        ...newSuggestions,
      ].slice(0, CONFIG.suggestionLimit);

      // Fetch DuckDuckGo suggestions (debounced)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (parsed.key && parsed.search) {
        setIsLoading(true);
        debounceRef.current = setTimeout(async () => {
          try {
            const command = COMMANDS.find((c) => c.id === parsed.key);
            if (command) {
              const searchResults = await fetchSearchSuggestions(parsed.search!);
              const commandSearchSuggestions = searchResults
                .slice(0, CONFIG.suggestionLimit - newSuggestions.length)
                .map((text) => ({
                  text: `${parsed.key}${CONFIG.commandSearchDelimiter}${text}`,
                  isSearch: true,
                  domain: extractDomain(command.url),
                }));

              setSuggestions([...newSuggestions, ...commandSearchSuggestions]);
            }
          } catch (error) {
            console.error("Failed to fetch command search suggestions:", error);
            setSuggestions(newSuggestions);
          } finally {
            setIsLoading(false);
          }
        }, 200);
      } else if (newSuggestions.length < CONFIG.suggestionLimit) {
        setIsLoading(true);
        debounceRef.current = setTimeout(async () => {
          try {
            const searchResults = await fetchSearchSuggestions(value);
            const generalSearchSuggestions = searchResults
              .slice(0, CONFIG.suggestionLimit - newSuggestions.length)
              .map((text) => ({
                text,
                isSearch: true,
                domain: "search",
              }));

            setSuggestions([...newSuggestions, ...generalSearchSuggestions]);
          } catch (error) {
            console.error("Failed to fetch search suggestions:", error);
            setSuggestions(newSuggestions);
          } finally {
            setIsLoading(false);
          }
        }, 200);
      } else {
        setSuggestions(newSuggestions);
      }
    },
    [parseQuery, fetchSearchSuggestions]
  );

  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
      if (initialInput) {
        setQuery(initialInput);
      } else {
        setQuery("");
      }
      setSuggestions([]);
      setFocusedSuggestion(-1);
      setIsLoading(false);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (inputRef.current) {
        inputRef.current.focus();
        if (initialInput) {
          inputRef.current.value = initialInput;
          inputRef.current.setSelectionRange(
            initialInput.length,
            initialInput.length
          );
          handleInputChange(initialInput);
        }
      }
    } else {
      setQuery("");
      setSuggestions([]);
      setIsLoading(false);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    }
  }, [open, initialInput, handleInputChange]);

  const executeSearch = (searchQuery: string) => {
    const parsed = parseQuery(searchQuery);
    if (parsed.url) {
      saveRecentSearch(searchQuery);
      onSearch(parsed.url);
      onOpenChange(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (focusedSuggestion >= 0 && suggestions[focusedSuggestion]) {
      executeSearch(suggestions[focusedSuggestion].text);
    } else {
      executeSearch(query);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    executeSearch(suggestion.text);
  };

  const handleRecentClick = (recent: string) => {
    setQuery(recent);
    handleInputChange(recent);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onOpenChange(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedSuggestion((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
      return;
    }

    if (e.key === "Enter" && focusedSuggestion >= 0) {
      e.preventDefault();
      if (suggestions[focusedSuggestion]) {
        executeSearch(suggestions[focusedSuggestion].text);
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      if (suggestions.length > 0) {
        if (focusedSuggestion >= 0) {
          executeSearch(suggestions[focusedSuggestion].text);
        } else {
          setFocusedSuggestion(0);
        }
      }
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showHelp) {
        setShowHelp(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showHelp]);

  const searchCommands = COMMANDS.filter(
    (command) =>
      command.searchTemplate ||
      command.id === "4chan" ||
      command.id === "reddit"
  );

  const showRecent = !query.trim() && recentSearches.length > 0;
  const showSuggestions = suggestions.length > 0 || isLoading;

  if (!open) return null;

  return (
    <>
      {/* Search Modal */}
      <div
        className="search-overlay"
        onClick={() => onOpenChange(false)}
      >
        <div
          className="search-box"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="search-input-row">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={setRefs}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or type a command..."
              className="search-input"
              autoComplete="off"
              spellCheck="false"
            />
            <div className="search-input-hints">
              <kbd className="search-kbd">esc</kbd>
            </div>
          </form>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="search-loading">
              <div className="search-loading-spinner" />
            </div>
          )}

          {/* Recent Searches */}
          {showRecent && !isLoading && (
            <>
              <div className="search-divider" />
              <div className="search-section">
                <div className="search-section-label">Recent</div>
                {recentSearches.map((recent, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentClick(recent)}
                    className="search-result"
                  >
                    <svg className="search-result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="search-result-text">{recent}</span>
                    <svg className="search-result-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Suggestions */}
          {showSuggestions && (
            <>
              <div className="search-divider" />
              <div className="search-section">
                {suggestions.length > 0 && (
                  <div className="search-section-label">
                    {suggestions.some((s) => s.commandId) ? "Commands" : "Suggestions"}
                  </div>
                )}
                {suggestions.map((suggestion, index) => {
                  const escapedQuery = escapeRegexCharacters(query);
                  const matched = suggestion.text.match(
                    new RegExp(escapedQuery, "i")
                  );
                  const isFocused = focusedSuggestion === index;

                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setFocusedSuggestion(index)}
                      className={`search-result ${isFocused ? "search-result-focused" : ""}`}
                    >
                      {suggestion.commandId ? (
                        <CommandIcon
                          commandId={suggestion.commandId}
                          className="search-result-icon"
                        />
                      ) : (
                        <svg className="search-result-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                      <span className="search-result-text">
                        {matched ? (
                          <>
                            {suggestion.text.slice(0, matched.index!)}
                            <span className="search-result-highlight">
                              {matched[0]}
                            </span>
                            {suggestion.text.slice(
                              matched.index! + matched[0].length
                            )}
                          </>
                        ) : (
                          suggestion.text
                        )}
                      </span>
                      {suggestion.domain && (
                        <span className="search-result-domain">
                          {suggestion.domain}
                        </span>
                      )}
                      <svg className="search-result-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Keyboard Shortcuts Footer */}
          {!showRecent && !showSuggestions && !query.trim() && (
            <>
              <div className="search-divider" />
              <div className="search-footer">
                <div className="search-footer-hint">
                  <kbd className="search-kbd">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="search-footer-hint">
                  <kbd className="search-kbd">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="search-footer-hint">
                  <kbd className="search-kbd">esc</kbd>
                  <span>Close</span>
                </div>
                <button
                  onClick={() => setShowHelp(true)}
                  className="search-footer-help"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Help
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div
          className="help-overlay"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="help-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>
                Search Help
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-full transition-colors"
                style={{ color: "var(--muted)" }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5 text-sm" style={{ color: "var(--card-fg)" }}>
              <div>
                <h4 className="font-semibold mb-2" style={{ color: "var(--fg)" }}>Basic</h4>
                <ul className="space-y-1" style={{ color: "var(--muted)" }}>
                  <li>Type any URL to go directly to a website</li>
                  <li>Type any text for web search</li>
                  <li>Use command aliases for quick access</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2" style={{ color: "var(--fg)" }}>Command Search</h4>
                <ul className="space-y-1" style={{ color: "var(--muted)" }}>
                  <li><code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--pill-bg)", color: "var(--pill-fg)" }}>yt linux</code> → YouTube search</li>
                  <li><code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--pill-bg)", color: "var(--pill-fg)" }}>mi one piece</code> → Miruro search</li>
                  <li><code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--pill-bg)", color: "var(--pill-fg)" }}>ny torrent</code> → Nyaa search</li>
                  <li><code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--pill-bg)", color: "var(--pill-fg)" }}>rd programming</code> → Reddit search</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2" style={{ color: "var(--fg)" }}>Shortcuts</h4>
                <ul className="space-y-1" style={{ color: "var(--muted)" }}>
                  <li><kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--pill-bg)", color: "var(--pill-fg)" }}>Enter</kbd> — Execute search</li>
                  <li><kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--pill-bg)", color: "var(--pill-fg)" }}>Escape</kbd> — Close search</li>
                  <li><kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--pill-bg)", color: "var(--pill-fg)" }}>↑↓</kbd> — Navigate suggestions</li>
                  <li><kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--pill-bg)", color: "var(--pill-fg)" }}>Tab</kbd> — Autocomplete</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2" style={{ color: "var(--fg)" }}>Supported Commands</h4>
                <div className="space-y-2">
                  {searchCommands.map((command) => (
                    <div
                      key={command.id}
                      className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ background: "var(--pill-bg)", border: "1px solid var(--pill-border)" }}
                    >
                      <div>
                        <span className="font-medium block" style={{ color: "var(--fg)" }}>{command.name}</span>
                        {command.description && (
                          <span className="text-xs block mt-0.5" style={{ color: "var(--muted)" }}>{command.description}</span>
                        )}
                      </div>
                      <div className="flex gap-1.5 ml-3">
                        {command.aliases?.slice(0, 2).map((alias) => (
                          <code
                            key={alias}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ background: "var(--pill-bg)", color: "var(--pill-fg)" }}
                          >
                            {alias}
                          </code>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default Search;
