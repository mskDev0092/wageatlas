# Data Model

> **File:** `docs/data-model.md`
> **Source of truth:** `src/lib/types.ts` + `src/lib/wage-data.ts`

---

## 1. Domain Types

All shared types are defined in `src/lib/types.ts`:

### CountryData
```ts
interface CountryData {
  id: string                    // e.g. "us", "gb", "pk"
  name: string                  // e.g. "United States"
  iso2: string                  // ISO 3166-1 alpha-2
  currency: CurrencyCode        // ISO 4217
  currencySymbol: string        // e.g. "$", "£", "€"
  hourlyWageLocal?: number      // If country has an hourly minimum wage
  dailyWageLocal?: number       // If country has a daily minimum wage
  monthlyWageLocal?: number     // If country has a monthly minimum wage
  standardWorkweekHours: number // e.g. 40
  usdRate: number               // 1 USD = X local currency units
  authority: string             // Governing body
  effectiveDate: string         // Date of current rate
  source: string                // URL/reference
  cities: CityData[]            // Cities within this country
}
```

### CityData
```ts
interface CityData {
  id: string                    // e.g. "us-nyc"
  name: string                  // e.g. "New York City"
  hourlyWageLocal?: number      // City-specific wage (overrides country)
  dailyWageLocal?: number
  monthlyWageLocal?: number
  costOfLivingIndex: number     // NYC = 100
  rentIndex: number
  groceriesIndex: number
  restaurantIndex: number
  purchasingPowerIndex: number
  year: number                  // Data reference year
  source: string
  commodities: Commodity[]      // 10 per city
  consumption: ConsumptionProfile[] // 1-3 profiles per city
}
```

### Commodity
```ts
interface Commodity {
  id: string
  label: string                 // e.g. "Milk (1 gallon)"
  category: 'Food' | 'Housing' | 'Transport' | 'Utility' | 'Lifestyle'
  priceLocal: number
  unit: string                  // e.g. "gallon", "monthly", "one-way"
  icon: string                  // Lucide icon name
}
```

### ConsumptionProfile
```ts
interface ConsumptionProfile {
  type: 'Single' | 'Couple' | 'Family of 4'
  monthlyIncomeLocal: number
  expenses: { category: string; amountLocal: number; color: string }[]
}
```

### AISettings
```ts
interface AISettings {
  preset: 'lmstudio' | 'ollama' | 'openai' | 'custom'
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
}
```

### Supporting Types
```ts
type CurrencyCode = 'USD' | 'GBP' | 'EUR' | 'JPY' | 'PKR' | 'INR' | 'CNY' | 'BRL' | 'AUD' | 'CAD' | 'AED' | 'ZAR' | 'MXN' | 'SGD' | 'KRW' | 'NGN' | 'ARS'

interface SavedSnapshot {
  id: string                    // crypto.randomUUID()
  savedAt: string               // ISO 8601
  countryId: string
  countryName: string
  cityId: string
  cityName: string
  notes?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}
```

---

## 2. Static Dataset

Defined in `src/lib/wage-data.ts`:

### Export Structure
```ts
export const COUNTRIES_SORTED: CountryData[]  // Array, sorted by country name
export const COUNTRY_INDEX: Map<string, CountryData>  // Lookup by country.id
```

### Dataset Size
| Entity | Count |
|---|---|
| Countries | 18 |
| Cities | 30+ |
| Commodities per city | 10 (5 categories × 2 each) |
| Consumption profiles per city | 1-3 (Single, Couple, Family of 4) |

### Country Index
| ID | Country | Currency | Wage Basis |
|---|---|---|---|
| `us` | United States | USD | Hourly ($7.25 federal) |
| `gb` | United Kingdom | GBP | Hourly (£11.44) |
| `de` | Germany | EUR | Hourly (€12.41) |
| `fr` | France | EUR | Hourly (€11.65 SMIC) |
| `jp` | Japan | JPY | Hourly (¥1055) |
| `pk` | Pakistan | PKR | Monthly (₨32,000) |
| `in` | India | INR | Daily (₹269) |
| `cn` | China | CNY | Monthly (¥2,480) |
| `br` | Brazil | BRL | Monthly (R$1,412) |
| `au` | Australia | AUD | Hourly (A$24.10) |
| `ca` | Canada | CAD | Hourly (C$17.30) |
| `ae` | UAE | AED | Monthly (AED 5,000) |
| `za` | South Africa | ZAR | Hourly (R27.58) |
| `mx` | Mexico | MXN | Daily (Mex$248.93) |
| `sg` | Singapore | SGD | Monthly (S$1,600) |
| `kr` | South Korea | KRW | Hourly (₩9,860) |
| `ng` | Nigeria | NGN | Monthly (₦70,000) |
| `ar` | Argentina | ARS | Monthly (AR$268,000) |

---

## 3. How to Add Data

To add a new country, append an object to the `COUNTRIES` array in `src/lib/wage-data.ts`:

```ts
{
  id: 'xx',
  name: 'Country Name',
  iso2: 'XX',
  currency: 'XXX' as CurrencyCode,
  currencySymbol: '$',
  monthlyWageLocal: 100000,
  standardWorkweekHours: 40,
  usdRate: 50,
  authority: 'Ministry of Labour',
  effectiveDate: 'January 2026',
  source: 'https://example.gov/minimum-wage',
  cities: [{
    id: 'xx-city',
    name: 'City Name',
    costOfLivingIndex: 45,
    rentIndex: 30,
    groceriesIndex: 40,
    restaurantIndex: 35,
    purchasingPowerIndex: 60,
    year: 2026,
    source: 'Numbeo',
    commodities: [
      { id: 'xx-milk', label: 'Milk (1 gallon)', category: 'Food', priceLocal: 3.5, unit: 'gallon', icon: 'milk' },
      // ... 9 more
    ],
    consumption: [{
      type: 'Single',
      monthlyIncomeLocal: 20000,
      expenses: [
        { category: 'Rent', amountLocal: 8000, color: '#3b82f6' },
        // ...
      ],
    }],
  }],
}
```

---

## 4. Wage Normalization

The pure function `normalizeWage()` in `src/lib/wage-utils.ts` handles the fact that different countries define minimum wage at different intervals:

```ts
function normalizeWage(city: CityData, country: CountryData): {
  hourly: number       // Local currency per hour
  daily: number        // local × 8 (or provided daily)
  monthly: number      // local × 173.33 (or provided monthly)
  annual: number       // monthly × 12
  hourlyUsd: number    // USD per hour
  monthlyUsd: number   // USD per month
  annualUsd: number    // USD per year
  originalUnit: string // Human-readable unit description
  label: string        // e.g. "$7.25/hr"
}
```

Each `CityData` and `CountryData` can specify wage at any interval (hourly, daily, monthly). The function resolves in this priority:
1. City-specific wage (if provided, takes precedence)
2. Country-level wage
3. Falls back across intervals (e.g., daily × 8 = hourly, monthly ÷ 173.33 = hourly)
