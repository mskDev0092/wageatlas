# Component Tree

> **File:** `docs/component-tree.md`
> **Audience:** AI agents tracing UI rendering paths or adding new features

---

## 1. Full Component Hierarchy

```
layout.tsx
├── ThemeProvider (next-themes — dark/light mode)
│   └── children (page.tsx)
└── Toaster (shadcn/ui — toast notifications)

page.tsx (Home — the entire SPA)
│
├── <header> (sticky, backdrop-blur)
│   ├── Logo + Title ("WageAtlas — Minimum Wage Atlas")
│   ├── Button("Compare…") — toggles MarketComparison
│   ├── SavedSnapshotsDrawer
│   │   └── uses: vaul Drawer
│   │       ├── SnapshotList → SnapshotCard × N
│   │       └── SaveButton → onSave callback
│   ├── ExportMenu
│   │   ├── DropdownMenu
│   │   │   ├── "Download CSV" → buildCityCsv → downloadCsv
│   │   │   ├── "Download JSON" → downloadJson
│   │   │   └── "Print / PDF" → printToPdf
│   │   └── Button (trigger)
│   ├── ThemeToggle
│   │   └── useTheme() → Button with Moon/Sun icon
│   └── GitHub link (anchor → external)
│
├── <main>
│   │
│   ├── Print-only header (hidden, visible @media print)
│   │   └── Date, country, city
│   │
│   ├── CountryCitySelector
│   │   ├── uses: cmdk Command, Popover
│   │   └── Two dropdowns: country list → city list
│   │
│   ├── MarketHero (motion.div — framer-motion entry animation)
│   │   ├── Wage value (large display)
│   │   ├── Wage unit label
│   │   ├── USD equivalent
│   │   └── Data source + effective date
│   │
│   ├── MarketComparison (only when compareWith is set)
│   │   ├── Side-by-side wage comparison
│   │   └── Uses: normalizeWage, COUNTRY_INDEX
│   │
│   ├── CostOfLivingPanel
│   │   ├── Recharts BarChart (index comparison across cities)
│   │   └── Recharts RadarChart (multi-dimensional COL view)
│   │
│   ├── ConsumptionPanel
│   │   ├── Recharts PieChart (income breakdown)
│   │   └── Recharts PieChart (expense breakdown)
│   │   └── Tabs: Single | Couple | Family of 4
│   │
│   ├── CommodityBasket
│   │   ├── Table (shadcn/ui) with columns: Item, Price, USD, Hours to Afford
│   │   ├── Tabs: Food | Housing | Transport | Utility | Lifestyle
│   │   └── Hours-to-afford calculation via wage-utils
│   │
│   ├── AIPanel
│   │   ├── Chat messages (scrollable) — react-markdown rendering
│   │   ├── Input + Send button
│   │   ├── Action buttons: "Analyze", "Compare", "Research", "Livability"
│   │   └── AISettingsDialog (modal)
│   │       ├── Preset selector (LM Studio / Ollama / OpenAI / Custom)
│   │       ├── Base URL input
│   │       ├── API key input
│   │       ├── Model name input
│   │       ├── Temperature slider
│   │       └── "Test Connection" button
│   │
│   └── Footnote (text — data sources disclaimer)
│
└── <footer>
    ├── Tech stack attribution
    └── Data philosophy note
```

---

## 2. Component Responsibility Matrix

| Component | File | Reads | Renders | User Action |
|---|---|---|---|---|
| Home (page.tsx) | `src/app/page.tsx` | All state | Orchestrator layout | N/A — passes props |
| CountryCitySelector | `src/components/country-city-selector.tsx` | COUNTRY_SORTED, COUNTRY_INDEX | Searchable dropdowns | Select country/city |
| MarketHero | `src/components/market-hero.tsx` | normalizeWage, formatUsd, flagEmoji | Wage card | Read-only |
| MarketComparison | `src/components/saved-snapshots.tsx` | COUNTRY_INDEX, normalizeWage | Side-by-side table | Clear comparison |
| CostOfLivingPanel | `src/components/cost-of-living-panel.tsx` | city COL indexes | BarChart + RadarChart | Hover for values |
| ConsumptionPanel | `src/components/consumption-panel.tsx` | city consumption profiles | PieCharts, tabs | Switch profile type |
| CommodityBasket | `src/components/commodity-basket.tsx` | commodities, wage-utils | Table, tabs | Switch category |
| AIPanel | `src/components/ai-panel.tsx` | ai-client, wikipedia | Chat, markdown, actions | Send messages, click actions |
| AISettingsDialog | `src/components/ai-settings-dialog.tsx` | AI_PRESETS, testConnection | Settings form | Configure AI |
| ExportMenu | `src/components/export-menu.tsx` | export-utils | Dropdown menu | Click export format |
| SavedSnapshotsDrawer | `src/components/saved-snapshots.tsx` | COUNTRY_INDEX, normalizeWage | Drawer with list | Save/load/delete |
| ThemeToggle | `src/components/theme-toggle.tsx` | useTheme | Moon/Sun button | Toggle dark mode |

---

## 3. Props Flow

```
page.tsx
├── CountryCitySelector
│   Props: countryId, cityId, onCountryChange, onCityChange
│
├── MarketHero
│   Props: country, city
│
├── MarketComparison
│   Props: primary {countryId, cityId}, secondary {countryId, cityId}, onClear
│
├── CostOfLivingPanel
│   Props: city
│
├── ConsumptionPanel
│   Props: country, city
│
├── CommodityBasket
│   Props: country, city
│
├── AIPanel
│   Props: country, city, settings, onSettingsChange
│   └── AISettingsDialog
│       Props: settings, onChange
│
├── ExportMenu
│   Props: country, city
│
├── SavedSnapshotsDrawer
│   Props: snapshots, currentCountryId, currentCityId, onSave, onLoad, onDelete
│
└── ThemeToggle
    Props: none (uses useTheme internally)
```

---

## 4. Adding a New Component

1. Identify where it fits in the tree (under page.tsx or nested in an existing component)
2. Create file in `src/components/` or `src/components/ui/`
3. Import it in the parent with the needed props
4. Add the component to this document
