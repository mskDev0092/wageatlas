# WageAtlas — AI Agent Guide

> **Purpose:** This is the entry point for any AI agent (LLM, coding assistant, automation tool) working with the WageAtlas codebase. Read this first to understand the project's structure, conventions, and key files.

---

## 1. Quick Facts

| Attribute | Value |
|---|---|
| **Stack** | Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4 |
| **UI Kit** | shadcn/ui (New York style) with Radix primitives |
| **State** | React state + `useLocalStorage` hook (no external store) |
| **Charts** | Recharts (Bar, Radar, Pie) |
| **AI** | Client-side streaming chat (OpenAI-compatible SSE) |
| **Build** | `output: "standalone"` — produces self-contained Node server |
| **Package Mgr** | Bun |
| **Database** | Prisma/SQLite (stub — not used at runtime; app is fully static) |
| **Testing** | None |

---

## 2. Project Map

```
wageatlas/
├── src/                           # All application code
│   ├── app/                       # Next.js App Router pages
│   │   ├── layout.tsx             # Root layout (fonts, theme, toaster)
│   │   ├── page.tsx               # Main SPA page (entry point)
│   │   ├── globals.css            # Global styles, theme vars, print CSS
│   │   └── api/route.ts           # Placeholder API (unused)
│   ├── components/                # All React components
│   │   ├── ui/                    # 47 shadcn/ui primitives (Radix-based)
│   │   └── *.tsx                  # 11 app-specific components
│   ├── hooks/                     # Custom React hooks (3 files)
│   └── lib/                       # Pure logic, types, data, utilities
├── prisma/                        # Prisma schema (boilerplate, unused)
├── db/                            # SQLite file (boilerplate, unused)
├── public/                        # Static assets (logo.svg, robots.txt)
├── .zscripts/                     # Build & deployment shell scripts
├── Caddyfile                      # Caddy reverse proxy config
└── docs/                          # ← You are here
```

---

## 3. Key Files for AI Agents

### When modifying the app, read these files first:

| File | Why |
|---|---|
| `src/app/page.tsx` | **Main entry point** — orchestrates all components, state, and layout |
| `src/lib/types.ts` | **All domain types** — CountryData, CityData, AISettings, etc. |
| `src/lib/wage-data.ts` | **Static dataset** — 18 countries, 30+ cities, commodities, consumption |
| `src/lib/wage-utils.ts` | **Wage math** — normalization, affordability calculations |
| `src/lib/ai-client.ts` | **AI streaming** — SSE chat, Wikipedia lookup, context builder |
| `src/hooks/use-localstorage.ts` | **Persistence pattern** — used by all persistent state |
| `src/components/ai-panel.tsx` | **AI chat UI** — streaming messages, analysis, actions |
| `src/app/globals.css` | **Design tokens** — CSS variables, print styles, theme |

### When adding shadcn/ui components:

```bash
bun x shadcn@latest add <component-name>
```

---

## 4. Conventions

### Code Style
- **No comments in application code** — let types and naming speak
- **`'use client'`** on every component that uses hooks, browser APIs, or state
- **Named exports** (not default exports) for all components and functions
- **PascalCase** for components, **camelCase** for functions/variables
- **Interfaces** for prop types inline or in `types.ts`

### State Management
- No Zustand, Redux, or external state — React state + localStorage only
- `useLocalStorage<T>(key, initialValue)` for persistent state
- `useState` for ephemeral UI state
- Props flow down; callbacks flow up

### File Organization
- One component per file in `src/components/`
- Pure utility functions in `src/lib/`
- Hooks in `src/hooks/`
- Types in `src/lib/types.ts`

---

## 5. Common Tasks

### "Add a new country/city"
Edit `src/lib/wage-data.ts`. Add a `CountryData` object to `COUNTRIES` array with all required fields including cities, commodities, and consumption profiles.

### "Add a new UI component"
Create a file in `src/components/`. If it's a generic UI primitive, place it in `src/components/ui/`. Follow the shadcn/ui pattern: `'use client'`, named export, `cn()` for class merging.

### "Fix a hydration error"
Search for browser-only APIs (`window`, `document`, `localStorage`, `Math.random`, `new Date()`) in JSX render paths. Move them into `useEffect`-initialized state.

### "Change the color scheme"
Edit CSS variables in `src/app/globals.css` under `:root` (light) and `.dark` (dark) selectors.

---

## 6. Data Flow Diagram

```
wage-data.ts (static) ──► page.tsx (state) ──► component props ──► UI
                              │
                         useLocalStorage
                         (persisted to browser)
```

**No runtime database queries. No API calls for market data. All data is embedded in the bundle.**

---

## 7. Deployment

```bash
bun run build        # Build standalone Next.js server
.zscripts/build.sh   # Full pipeline: install → build → package tar.gz
.zscripts/start.sh   # Production launch (Next.js + mini-services + Caddy)
```

The `.next/standalone/` directory contains a self-contained Node.js server. Copy it to any host with Node.js installed, set `DATABASE_URL` if needed, and run `node server.js`.

---

## 8. AI Integration

- **Client-side only** — the browser connects directly to the AI provider
- **OpenAI-compatible** — works with LM Studio, Ollama, OpenAI, or any `/v1/chat/completions` endpoint
- **Streaming** — SSE-based async generator yields text deltas
- **Context injection** — `buildMarketContext()` creates a detailed system prompt with all wage/COL data
- **Wikipedia research** — `fetchWikipediaSummary()` for country-level facts
- **No server-side AI** — zero AI calls happen on the server
