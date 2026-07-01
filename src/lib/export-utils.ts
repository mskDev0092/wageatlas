import type { CityData, CountryData } from './types'
import { normalizeWage } from './wage-utils'

/**
 * Export utilities — pure functions that produce downloadable artifacts.
 *
 * CSV follows RFC 4180 quoting. PDF is generated via window.print() with a
 * print-specific stylesheet; this is the most reliable way to produce a
 * paginated, well-styled PDF from a static SSG app without bundling a
 * heavy PDF library.
 */

function csvEscape(value: string | number): string {
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** Build a CSV string for a city's complete market snapshot. */
export function buildCityCsv(country: CountryData, city: CityData): string {
  const wage = normalizeWage(city, country)
  const header = [
    'Section',
    'Field',
    'Value (local)',
    'Value (USD)',
    'Unit / Note',
  ]
  const rows: string[][] = [header]

  rows.push(['Country', 'Name', country.name, '', country.iso2.toUpperCase()])
  rows.push(['Country', 'Currency', country.currency, '', `1 USD = ${country.usdRate} ${country.currency}`])
  rows.push(['Country', 'Authority', country.authority, '', ''])
  rows.push(['Country', 'Effective Date', country.effectiveDate, '', ''])
  rows.push(['Country', 'Source', country.source, '', ''])
  rows.push(['Country', 'Standard Workweek (h)', String(country.standardWorkweekHours), '', ''])

  rows.push(['City', 'Name', city.name, '', ''])
  rows.push(['City', 'Source', city.source, '', `Year ${city.year}`])

  rows.push(['Minimum Wage', 'Hourly (local)', wage.hourly.toFixed(2), wage.hourlyUsd.toFixed(2), wage.originalUnit])
  rows.push(['Minimum Wage', 'Daily (local)', wage.daily.toFixed(2), (wage.daily / country.usdRate).toFixed(2), 'derived'])
  rows.push(['Minimum Wage', 'Monthly (local)', wage.monthly.toFixed(2), wage.monthlyUsd.toFixed(2), 'derived'])
  rows.push(['Minimum Wage', 'Annual (local)', wage.annual.toFixed(2), wage.annualUsd.toFixed(2), 'derived'])

  rows.push(['Cost-of-Living Index', 'Overall', String(city.costOfLivingIndex), '', 'NYC = 100'])
  rows.push(['Cost-of-Living Index', 'Rent', String(city.rentIndex), '', 'NYC = 100'])
  rows.push(['Cost-of-Living Index', 'Groceries', String(city.groceriesIndex), '', 'NYC = 100'])
  rows.push(['Cost-of-Living Index', 'Restaurant', String(city.restaurantIndex), '', 'NYC = 100'])
  rows.push(['Cost-of-Living Index', 'Purchasing Power', String(city.purchasingPowerIndex), '', 'NYC = 100'])

  for (const c of city.commodities) {
    rows.push([
      `Commodity (${c.category})`,
      c.label,
      c.priceLocal.toString(),
      (c.priceLocal / country.usdRate).toFixed(2),
      c.unit,
    ])
  }

  for (const p of city.consumption) {
    rows.push([`Consumption (${p.type})`, 'Monthly income', p.monthlyIncomeLocal.toString(), (p.monthlyIncomeLocal / country.usdRate).toFixed(2), 'local'])
    for (const e of p.expenses) {
      rows.push([
        `Consumption (${p.type})`,
        e.category,
        e.amountLocal.toString(),
        (e.amountLocal / country.usdRate).toFixed(2),
        'monthly',
      ])
    }
  }

  return rows.map((r) => r.map(csvEscape).join(',')).join('\r\n')
}

/** Trigger a CSV download in the browser. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Trigger a JSON download (used for snapshots backup). */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Print the current page. The browser's print dialog lets the user choose
 * "Save as PDF". A print stylesheet hides chrome (header buttons, AI panel)
 * and reveals a print-only header with the snapshot metadata.
 */
export function printToPdf(): void {
  if (typeof window === 'undefined') return
  // Mark the document so the print CSS can swap visible sections.
  document.body.dataset.printing = 'true'
  window.print()
  // Reset after printing completes.
  setTimeout(() => {
    delete document.body.dataset.printing
  }, 1000)
}
