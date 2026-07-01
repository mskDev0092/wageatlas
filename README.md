# WageAtlas — Global Minimum Wage & Cost-of-Living Explorer

Explore real minimum-wage data, cost-of-living indexes, commodity prices, and consumption patterns across 18+ countries. Compare markets side-by-side, export reports to CSV/PDF, and chat with a local AI analyst.

![WageAtlas](https://img.shields.io/badge/Next.js_16-000?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=fff)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000?logo=shadcnui)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **18 countries, 30+ cities** — Real minimum wage rates (hourly, daily, monthly), exchange rates, and data sources
- **Cost-of-living indexes** — Bar and radar charts for overall COL, rent, groceries, restaurants, and purchasing power (vs. NYC = 100)
- **Commodity basket** — 10 items per city across 5 categories (Food, Housing, Transport, Utility, Lifestyle) with local and USD prices
- **Consumption profiles** — Income and expense breakdowns for Single, Couple, and Family of 4
- **Hours-to-afford** — See how many minimum-wage work hours each item costs
- **Side-by-side comparison** — Compare any two markets
- **AI market analyst** — Connect a local AI (LM Studio, Ollama) or OpenAI-compatible API for live chat, market analysis, and Wikipedia research
- **Export** — Download CSV/JSON or print to PDF
- **Saved snapshots** — Bookmark market views in your browser
- **Dark mode** — System-aware theme toggle

---

## Quick Start

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Open in browser
open http://localhost:3000
```

### Production build

```bash
bun run build
bun run start
```

---

## Data

All market data is **static and embedded** in the client bundle — no server, no database, no API calls at runtime. The dataset lives in `src/lib/wage-data.ts` and covers:

| Region | Countries |
|---|---|
| Americas | US, Canada, Brazil, Mexico, Argentina |
| Europe | UK, Germany, France |
| Asia-Pacific | Japan, India, China, Australia, Singapore, South Korea |
| Middle East / Africa | UAE, South Africa, Nigeria |
| South Asia | Pakistan |

Data sources include ILO and OECD minimum wage databases, Numbeo cost-of-living indexes, national labour ministries, and World Bank exchange rates. Figures are rounded for readability.

---

## AI Integration

WageAtlas includes a client-side AI chat panel. All AI calls happen **directly from your browser** — no server-side proxy:

1. **LM Studio** — `http://localhost:1234` (default)
2. **Ollama** — `http://localhost:11434`
3. **OpenAI** — `https://api.openai.com` (requires API key)
4. **Custom** — Any OpenAI-compatible endpoint

Configure the AI provider via the settings dialog in the app. The system builds a detailed market context prompt with all wage, COL, commodity, and consumption data before each analysis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, standalone output) |
| UI Library | [React 19](https://react.dev/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (New York) |
| Charts | [Recharts](https://recharts.org/) |
| Animations | [Framer Motion](https://motion.dev/) |
| AI Streaming | OpenAI-compatible SSE (`/v1/chat/completions`) |
| Icons | [Lucide](https://lucide.dev/) |
| Markdown | [react-markdown](https://github.com/remarkjs/react-markdown) |
| Package Manager | [Bun](https://bun.sh/) |

No external state management, no runtime database, no authentication.

---

## Project Structure

```
wageatlas/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout (fonts, theme provider, toaster)
│   │   ├── page.tsx          # Main SPA entry point
│   │   └── globals.css       # Global styles, theme tokens, print CSS
│   ├── components/
│   │   ├── ui/               # 17 shadcn/ui primitives (Button, Dialog, Select, etc.)
│   │   ├── ai-panel.tsx       # AI chat + analysis panel
│   │   ├── ai-settings-dialog.tsx  # AI provider configuration
│   │   ├── commodity-basket.tsx    # Commodity pricing table
│   │   ├── consumption-panel.tsx   # Income/expense pie charts
│   │   ├── cost-of-living-panel.tsx # COL index charts
│   │   ├── country-city-selector.tsx # Country/city dropdowns
│   │   ├── export-menu.tsx    # CSV/JSON/PDF export
│   │   ├── market-hero.tsx    # Wage stats hero card
│   │   ├── saved-snapshots.tsx # Snapshot drawer + comparison
│   │   ├── theme-provider.tsx # next-themes wrapper
│   │   └── theme-toggle.tsx   # Dark/light toggle
│   ├── hooks/
│   │   ├── use-localstorage.ts # Generic localStorage persistence
│   │   ├── use-mobile.ts       # Responsive breakpoint detection
│   │   └── use-toast.ts        # Toast notification system
│   └── lib/
│       ├── types.ts            # All TypeScript domain types
│       ├── wage-data.ts        # Static dataset (18 countries, 30+ cities)
│       ├── wage-utils.ts       # Wage normalization math
│       ├── ai-client.ts        # OpenAI-compatible streaming client
│       ├── export-utils.ts     # CSV/JSON/PDF export utilities
│       └── utils.ts            # cn() class merge utility
├── docs/                       # AI agent documentation
├── public/                     # Static assets (logo.svg, robots.txt)
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start development server on port 3000 |
| `bun run build` | Production build (standalone output) |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |

---

## Deployment

The app builds to a self-contained Node.js server in `.next/standalone/`:

```bash
bun run build
cp -r .next/standalone /deploy/path
cd /deploy/path && NODE_ENV=production node server.js
```

No database setup required. The entire dataset is embedded in the JavaScript bundle.

---

## License

MIT
