'use client'

import { motion } from 'framer-motion'
import { Building2, CalendarDays, Clock, Coins, Scale } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { CityData, CountryData } from '@/lib/types'
import { flagEmoji } from '@/lib/wage-data'
import {
  formatLocal,
  formatUsd,
  normalizeWage,
} from '@/lib/wage-utils'

interface MarketHeroProps {
  country: CountryData
  city: CityData
}

/** Hero card: country flag, names, primary wage number, key metadata badges. */
export function MarketHero({ country, city }: MarketHeroProps) {
  const wage = normalizeWage(city, country)

  const stats = [
    {
      icon: <Clock className="h-4 w-4" />,
      label: 'Per hour',
      local: formatLocal(wage.hourly, country.currencySymbol, 2),
      usd: formatUsd(wage.hourlyUsd),
    },
    {
      icon: <CalendarDays className="h-4 w-4" />,
      label: 'Per month',
      local: formatLocal(wage.monthly, country.currencySymbol),
      usd: formatUsd(wage.monthlyUsd),
    },
    {
      icon: <Coins className="h-4 w-4" />,
      label: 'Per year',
      local: formatLocal(wage.annual, country.currencySymbol),
      usd: formatUsd(wage.annualUsd),
    },
  ]

  return (
    <Card className="print-card relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/40 p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -right-10 -top-10 text-[12rem] leading-none opacity-[0.08] select-none"
        aria-hidden
      >
        {flagEmoji(country.iso2)}
      </div>

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-background/80 text-4xl shadow-sm ring-1 ring-border"
              aria-hidden
            >
              {flagEmoji(country.iso2)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Minimum Wage Market
              </p>
              <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {city.name}
                <span className="ml-2 text-xl font-normal text-muted-foreground">
                  · {country.name}
                </span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {country.currency} · 1 USD = {country.usdRate} {country.currency} ·{' '}
                {country.standardWorkweekHours} h workweek
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end lg:gap-1.5">
            <Badge variant="secondary" className="gap-1.5 py-1">
              <Scale className="h-3 w-3" /> {wage.originalUnit} rate
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1">
              <CalendarDays className="h-3 w-3" /> Effective {country.effectiveDate}
            </Badge>
          </div>
        </div>

        {/* Wage stats row */}
        <motion.div
          key={`${country.id}-${city.id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-background/60 p-4 ring-1 ring-border backdrop-blur-sm"
            >
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                {s.icon}
                {s.label}
              </div>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{s.local}</div>
              <div className="text-sm text-muted-foreground tabular-nums">{s.usd}</div>
            </div>
          ))}
        </motion.div>

        {/* Authority + source */}
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
          <span className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground/80">{country.authority}</span>
          </span>
          <span className="hidden sm:inline opacity-40">·</span>
          <span>
            Source: {country.source} / {city.source} ({city.year})
          </span>
        </div>
      </div>
    </Card>
  )
}
