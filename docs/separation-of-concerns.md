# Separation of Concerns

> **File:** `docs/separation-of-concerns.md`
> **Audience:** AI agents maintaining code organization and deciding where to place new code

---

## 1. The Four Layers

```
┌───────────────────────────────────────┐
│  UI Components  (src/components/)     │
│  - Renders HTML                        │
│  - Handles user interaction            │
│  - Composition of sub-components       │
├───────────────────────────────────────┤
│  Hooks / State  (src/hooks/)          │
│  - Encapsulates stateful logic         │
│  - Browser API access (localStorage)   │
│  - No JSX return                       │
├───────────────────────────────────────┤
│  Pure Logic   (src/lib/)              │
│  - Pure functions, no side effects     │
│  - No React imports                    │
│  - Fully testable without DOM          │
├───────────────────────────────────────┤
│  Data / Types  (src/lib/)             │
│  - Static dataset                      │
│  - TypeScript interfaces               │
│  - Constants and enums                 │
└───────────────────────────────────────┘
```

**Golden rule:** Code in each layer should never need to import from a layer above it. Data flows down, never up.

---

## 2. Examples of Correct Separation

### ✅ Example: Wage normalization

```
Wrong:  Component calculates wage display format inline
Right:  wage-utils.ts normalizes → component calls formatUsd(result)
```

**`src/lib/wage-utils.ts`** (pure logic — no React, no browser APIs):
```ts
export function normalizeWage(city: CityData, country: CountryData) {
  // Pure math: converts daily/hourly wages to hourly, daily, monthly, annual
  // Returns { hourly, daily, monthly, annual, hourlyUsd, monthlyUsd, ... }
}
```

**`src/components/market-hero.tsx`** (UI — only renders, no math):
```tsx
const wage = normalizeWage(city, country)
// Renders: <span>{formatUsd(wage.hourlyUsd)}/hr</span>
```

### ✅ Example: Persistence pattern

```
Wrong:  Components call localStorage directly
Right:  useLocalStorage hook encapsulates all browser storage logic
```

**`src/hooks/use-localstorage.ts`** (state logic — no JSX):
```ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Returns [value, setValue] — just like useState, but persisted
}
```

**`src/app/page.tsx`** (usage — just calls hook):
```ts
const [countryId, setCountryId] = useLocalStorage<string>('wa:country', 'us')
```

### ✅ Example: Component composition

```
Wrong:   A single 500-line component doing everything
Right:   page.tsx orchestrates → child components handle specific domains
```

**`src/app/page.tsx`** (orchestrator — no heavy rendering logic):
```tsx
<header>…</header>
<CountryCitySelector … />
<MarketHero country={country} city={city} />
<CostOfLivingPanel city={city} />
<ConsumptionPanel country={country} city={city} />
<CommodityBasket country={country} city={city} />
<AIPanel … />
```

**`src/components/market-hero.tsx`** (domain-specific — owns its rendering):
```tsx
export function MarketHero({ country, city }: { country: CountryData; city: CityData }) {
  // Only renders wage info for one market
}
```

---

## 3. What NOT to Do

### ❌ Don't put business logic in components
```tsx
// BAD: Component does math
function MarketHero({ city, country }) {
  const hourlyUsd = city.hourlyWageLocal
    ? city.hourlyWageLocal / country.usdRate
    : (city.dailyWageLocal ?? 0) / 8 / country.usdRate
  return <div>{hourlyUsd.toFixed(2)}</div>
}
```

### ❌ Don't import hooks into lib files
```ts
// BAD: lib file imports a React hook
import { useLocalStorage } from '@/hooks/use-localstorage'
```

### ❌ Don't mix data fetching with rendering
```ts
// BAD: Component both fetches and renders
function CountrySelector() {
  const data = fetchCountries()  // Should be in a hook or lib
  return <select>{data.map(...)}</select>
}
```
*(Not applicable here since all data is static — but the principle holds for future API calls.)*

### ❌ Don't put CSS-in-JS in components
```tsx
// BAD: Style definitions inside component
const styles = { card: { padding: '16px' } }
return <div style={styles.card}>…</div>
```

---

## 4. Dependency Graph

```
types.ts           (zero dependencies)
utils.ts           (zero dependencies)
wage-data.ts       (imports: types.ts)
wage-utils.ts      (imports: types.ts)
ai-client.ts       (imports: types.ts, wage-data.ts, wage-utils.ts)
export-utils.ts    (imports: types.ts, wage-utils.ts)

use-localstorage.ts (imports: react)
use-mobile.ts       (imports: react)
use-toast.ts        (imports: react, types.ts, ui/toast.tsx)

ui/*.tsx            (imports: lib/utils.ts, lucide-react, @radix-ui/*)
*.tsx (components)  (imports: hooks/*, lib/*, ui/*)

page.tsx            (imports: everything — the root orchestrator)
layout.tsx          (imports: ui/*, theme-provider, globals.css)
```

---

## 5. File Responsibility Checklist

When creating a new file, ask:

| Question | If yes → | Place in |
|---|---|---|
| Does it render JSX? | → | `src/components/` |
| Is it a generic UI pattern? | → | `src/components/ui/` |
| Does it use `useState`/`useEffect`/browser APIs? | → | `src/hooks/` |
| Is it pure logic without React? | → | `src/lib/` |
| Is it a type/interface/constant? | → | `src/lib/types.ts` |
| Is it a route/page? | → | `src/app/` |
| Is it an API endpoint? | → | `src/app/api/` |
