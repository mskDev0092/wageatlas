# Architecture

> **File:** `docs/architecture.md`
> **Audience:** AI agents and developers understanding the system design

---

## 1. Design Philosophy

WageAtlas is a **static-data SPA** built on Next.js. Despite using a full-stack framework, the app has zero runtime server dependencies:

- **No database queries** at runtime
- **No API routes** consumed by the app
- **No server-side rendering** of dynamic data
- **No authentication or user accounts**
- **No server-side AI calls**

All data lives in `src/lib/wage-data.ts` and is bundled into the client at build time. The Next.js server exists only to serve the static files and potentially support future API routes.

---

## 2. System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer (React)                         │
│  page.tsx → components (MarketHero, AIPanel, ExportMenu…)   │
├─────────────────────────────────────────────────────────────┤
│                   State Layer (React)                        │
│  useLocalStorage ←→ useState ←→ useCallback                  │
├─────────────────────────────────────────────────────────────┤
│                 Domain Logic Layer                          │
│  wage-utils.ts (normalizeWage, hoursToAfford)               │
│  ai-client.ts (streamChat, buildMarketContext)               │
│  export-utils.ts (buildCityCsv, downloadCsv)                │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                │
│  wage-data.ts (COUNTRIES_SORTED, COUNTRY_INDEX)             │
│  types.ts (CountryData, CityData, AISettings…)             │
├─────────────────────────────────────────────────────────────┤
│              Infrastructure (config/deploy)                  │
│  next.config.ts │ Caddyfile │ .zscripts/ │ prisma/          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Folder Structure — What Goes Where

### `src/app/` — Next.js App Router
```
src/app/
├── layout.tsx     # <html>, fonts (Geist), ThemeProvider, Toaster
├── page.tsx       # Main SPA: state, layout, all panels
├── globals.css    # CSS variables, tailwind layers, print styles
└── api/route.ts   # Placeholder — returns {"message":"Hello, world!"}
```

**Rule:** This directory should only contain route-related files. No business logic, no data definitions, no utility functions.

### `src/components/` — React Components
```
src/components/
├── ui/            # Generic, reusable UI primitives (shadcn/ui)
└── *.tsx          # App-specific composed components
```

**Rule:** Each file exports one component. Components in `ui/` are generic and reusable. Components at the top level are app-specific compositions with business logic.

### `src/hooks/` — Custom React Hooks
```
src/hooks/
├── use-localstorage.ts   # Generic localStorage persistence
├── use-mobile.ts         # Responsive breakpoint detection
└── use-toast.ts          # Toast notification system
```

**Rule:** Hooks encapsulate stateful logic. They do not render UI. They can be framework-agnostic.

### `src/lib/` — Pure Logic & Data
```
src/lib/
├── types.ts        # All TypeScript interfaces and types
├── wage-data.ts    # Static dataset (18 countries, 30+ cities)
├── wage-utils.ts   # Pure functions: normalizeWage, hoursToAfford
├── ai-client.ts    # AI streaming client (SSE, Wikipedia)
├── export-utils.ts # CSV/JSON builders, download helpers
├── db.ts           # Prisma client singleton (unused stub)
└── utils.ts        # cn() — Tailwind class merge utility
```

**Rule:** These files have zero React imports. They are pure TypeScript modules with no UI or hook dependencies.

---

## 4. Data Flow

### Unidirectional flow:

```
wage-data.ts (COUNTRIES_SORTED array + COUNTRY_INDEX Map)
      │
      ▼
page.tsx
  - Reads data via imports (no async fetching)
  - Stores user selections in useLocalStorage
  - Derives current country/city via useMemo
      │
      ├──► CountryCitySelector (dropdowns to pick country/city)
      ├──► MarketHero (displays wage stats for current city)
      ├──► CostOfLivingPanel (COL indexes as bar/radar charts)
      ├──► ConsumptionPanel (income vs. expense pie charts)
      ├──► CommodityBasket (prices + hours-to-afford table)
      ├──► AIPanel (chat with AI analyst)
      ├──► ExportMenu (CSV/PDF download)
      ├──► MarketComparison (side-by-side comparison)
      └──► SavedSnapshotsDrawer (browser localStorage snapshots)
```

### State changes flow back up via callbacks:

```
User clicks country → onCountryChange(id)
    → page.tsx setCountryId(id) → city resets → components re-render
```

---

## 5. When to Add New Files

| You need to… | Add it to… |
|---|---|
| Define a new data type | `src/lib/types.ts` |
| Add/change market data | `src/lib/wage-data.ts` |
| Write a math/transform function | `src/lib/wage-utils.ts` or new file in `src/lib/` |
| Create a reusable UI component | `src/components/ui/` (if generic) or `src/components/` (if app-specific) |
| Write a hook | `src/hooks/` |
| Add a new page/route | `src/app/` |
| Add an API endpoint | `src/app/api/` |
| Change styling/theme | `src/app/globals.css` |
| Change build/deploy config | Root config files (`next.config.ts`, `Caddyfile`, `.zscripts/`) |
