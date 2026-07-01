import type { CityData, CountryData } from './types'

/**
 * Wage normalization utilities.
 *
 * Real-world minimum wages are legislated in different units per country:
 *   - hourly (USA, UK, Germany, France, Japan, Australia, Canada, Korea, S. Africa)
 *   - daily  (India, Mexico)
 *   - monthly (Pakistan, China, Brazil, Singapore, UAE, Argentina, Nigeria)
 *
 * This module provides pure functions to convert between representations using
 * the country's legal workweek as the basis. Single-responsibility, side-effect free.
 */

export interface NormalizedWage {
  /** Per-hour rate in local currency. */
  hourly: number
  /** Per-day rate in local currency (8h day derived from workweek/6). */
  daily: number
  /** Per-month rate in local currency (4.33 weeks × workweek hours). */
  monthly: number
  /** Per-year rate in local currency (12 × monthly). */
  annual: number
  /** The original legislated unit, used for display provenance. */
  originalUnit: 'hourly' | 'daily' | 'monthly'
  /** Per-hour rate in USD. */
  hourlyUsd: number
  /** Per-month rate in USD. */
  monthlyUsd: number
  /** Per-year rate in USD. */
  annualUsd: number
}

/** Hours per day derived from workweek assuming 6-day week. */
function hoursPerDay(workweekHours: number): number {
  return Math.max(1, workweekHours / 6)
}

/** Hours per month: 52 weeks / 12 months × weekly hours. */
function hoursPerMonth(workweekHours: number): number {
  return (52 / 12) * workweekHours
}

/** Days per month: 52 weeks / 12 months × 6 days. */
function daysPerMonth(): number {
  return (52 / 12) * 6
}

/**
 * Normalize the city's (or country's) wage into all unit representations.
 * Prefers city-level wage when present, falls back to national.
 */
export function normalizeWage(
  city: CityData | undefined,
  country: CountryData,
): NormalizedWage {
  const workweek = country.standardWorkweekHours
  const hPerDay = hoursPerDay(workweek)
  const hPerMonth = hoursPerMonth(workweek)
  const dPerMonth = daysPerMonth()

  // Pick the first available unit, city-level taking priority.
  const hourlyCity = city?.hourlyWageLocal
  const dailyCity = city?.dailyWageLocal
  const monthlyCity = city?.monthlyWageLocal

  const hourlyCountry = country.hourlyWageLocal
  const dailyCountry = country.dailyWageLocal
  const monthlyCountry = country.monthlyWageLocal

  let hourly: number
  let originalUnit: 'hourly' | 'daily' | 'monthly'

  if (hourlyCity != null) {
    hourly = hourlyCity
    originalUnit = 'hourly'
  } else if (dailyCity != null) {
    hourly = dailyCity / hPerDay
    originalUnit = 'daily'
  } else if (monthlyCity != null) {
    hourly = monthlyCity / hPerMonth
    originalUnit = 'monthly'
  } else if (hourlyCountry != null) {
    hourly = hourlyCountry
    originalUnit = 'hourly'
  } else if (dailyCountry != null) {
    hourly = dailyCountry / hPerDay
    originalUnit = 'daily'
  } else if (monthlyCountry != null) {
    hourly = monthlyCountry / hPerMonth
    originalUnit = 'monthly'
  } else {
    hourly = 0
    originalUnit = 'hourly'
  }

  const daily = hourly * hPerDay
  const monthly = hourly * hPerMonth
  const annual = monthly * 12

  // usdRate is "1 USD = X local currency", so local→USD requires division.
  const usdRate = country.usdRate || 1
  const hourlyUsd = hourly / usdRate
  const monthlyUsd = monthly / usdRate
  const annualUsd = annual / usdRate

  return {
    hourly,
    daily,
    monthly,
    annual,
    originalUnit,
    hourlyUsd,
    monthlyUsd,
    annualUsd,
  }
}

/** "Hours of work needed to afford one unit" — affordability ratio. */
export function hoursToAfford(hourlyWage: number, price: number): number {
  if (hourlyWage <= 0) return Infinity
  return price / hourlyWage
}

/**
 * Format a local-currency amount using the country's symbol.
 * Avoids Intl.NumberFormat currency to keep bundles small and consistent.
 */
export function formatLocal(amount: number, symbol: string, decimals?: number): string {
  const d = decimals ?? (amount < 10 ? 2 : amount < 1000 ? 0 : 0)
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
  return `${symbol}${formatted}`
}

/** Format USD with $ prefix. */
export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: amount < 10 ? 2 : 0,
    maximumFractionDigits: amount < 10 ? 2 : 0,
  })}`
}

/** Format a number of hours (e.g. affordability) compactly. */
export function formatHours(h: number): string {
  if (!isFinite(h)) return '∞'
  if (h < 1) return `${Math.round(h * 60)} min`
  if (h < 10) return `${h.toFixed(1)} h`
  return `${Math.round(h)} h`
}
