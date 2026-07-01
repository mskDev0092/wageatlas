// Core domain types for the Wage Atlas application.
// Following SOLID principles: each type has a single responsibility
// and is the authoritative contract shared by data, UI, and export layers.

/** ISO 4217 currency code, e.g. "USD", "EUR", "PKR". */
export type CurrencyCode = string

/** A single commodity in the cost-of-living basket. */
export interface Commodity {
  /** Stable id used for export & React keys. */
  id: string
  /** Human-readable label, e.g. "Milk (1 L)". */
  label: string
  /** Category for grouping in the UI. */
  category: 'Food' | 'Housing' | 'Transport' | 'Utility' | 'Lifestyle'
  /** Price in the local currency of the parent city. */
  priceLocal: number
  /** Unit description, e.g. "1 L", "1 kg", "1 month". */
  unit: string
  /** Optional emoji icon for quick scanning. */
  icon: string
}

/** Monthly consumption profile for a household type. */
export interface ConsumptionProfile {
  /** Household archetype label. */
  type: 'Single' | 'Couple' | 'Family of 4'
  /** Estimated monthly take-home pay for a full-time minimum-wage worker, local currency. */
  monthlyIncomeLocal: number
  /** Breakdown of typical monthly expenses, local currency. */
  expenses: Array<{
    category: string
    amountLocal: number
    /** Tailwind-friendly accent token from chart palette. */
    color: string
  }>
}

/** A city within a country, with its own cost-of-living snapshot. */
export interface CityData {
  id: string
  name: string
  /** Local minimum wage per hour in this city/region, in local currency.
   *  Falls back to the national rate when no regional rate exists. */
  hourlyWageLocal?: number
  /** Daily minimum wage in local currency (where daily is the legal unit). */
  dailyWageLocal?: number
  /** Monthly minimum wage in local currency (where monthly is the legal unit). */
  monthlyWageLocal?: number
  /** Cost-of-living index relative to New York City = 100. */
  costOfLivingIndex: number
  /** Rent index relative to NYC = 100. */
  rentIndex: number
  /** Groceries index relative to NYC = 100. */
  groceriesIndex: number
  /** Restaurant price index relative to NYC = 100. */
  restaurantIndex: number
  /** Local purchasing power index relative to NYC = 100. */
  purchasingPowerIndex: number
  /** Basket of common commodities priced in local currency. */
  commodities: Commodity[]
  /** Consumption profiles for typical household archetypes. */
  consumption: ConsumptionProfile[]
  /** Source attribution. */
  source: string
  /** Year of data collection. */
  year: number
}

/** Top-level country record. */
export interface CountryData {
  id: string
  name: string
  /** ISO 3166-1 alpha-2 code, lowercased for flag emoji derivation. */
  iso2: string
  /** Currency code. */
  currency: CurrencyCode
  /** Currency symbol for display, e.g. "$", "€", "₨". */
  currencySymbol: string
  /** National minimum wage per hour in local currency, if applicable. */
  hourlyWageLocal?: number
  /** National minimum wage per day in local currency, if applicable. */
  dailyWageLocal?: number
  /** National monthly minimum wage in local currency, if applicable. */
  monthlyWageLocal?: number
  /** Legal workweek length in hours. */
  standardWorkweekHours: number
  /** Approximate USD exchange rate (1 USD = X local currency). */
  usdRate: number
  /** Authority that sets the wage. */
  authority: string
  /** Effective date of the current rate, ISO date string. */
  effectiveDate: string
  /** Source attribution. */
  source: string
  /** Cities for this country. */
  cities: CityData[]
}

/** Settings for the AI integration, persisted in localStorage. */
export interface AISettings {
  /** Display label for the preset, e.g. "LM Studio", "Ollama", "OpenAI". */
  preset: 'lmstudio' | 'ollama' | 'openai' | 'custom'
  /** Base URL of the OpenAI-compatible endpoint, no trailing slash. */
  baseUrl: string
  /** API key, optional for local providers. */
  apiKey: string
  /** Model identifier, e.g. "llama3.1:8b", "gpt-4o-mini". */
  model: string
  /** Sampling temperature, 0.0 - 1.0. */
  temperature: number
}

/** A saved snapshot of a market view, persisted in localStorage. */
export interface SavedSnapshot {
  id: string
  savedAt: string
  countryId: string
  countryName: string
  cityId: string
  cityName: string
  /** Optional notes the user added when saving. */
  notes?: string
}

/** A single message in the AI chat transcript. */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}
