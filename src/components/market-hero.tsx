'use client'

import { motion } from 'framer-motion'
import { Building2, CalendarDays, Clock, Coins, Scale, TrendingUp, ArrowUpRight } from 'lucide-react'
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

export function MarketHero({ country, city }: MarketHeroProps) {
  const wage = normalizeWage(city, country)

  const stats = [
    {
      icon: <Clock className="h-4 w-4" />,
      label: 'Hourly',
      local: formatLocal(wage.hourly, country.currencySymbol, 2),
      usd: formatUsd(wage.hourlyUsd),
      gradient: 'from-chart-1/10 to-transparent',
    },
    {
      icon: <CalendarDays className="h-4 w-4" />,
      label: 'Monthly',
      local: formatLocal(wage.monthly, country.currencySymbol),
      usd: formatUsd(wage.monthlyUsd),
      gradient: 'from-chart-2/10 to-transparent',
    },
    {
      icon: <Coins className="h-4 w-4" />,
      label: 'Annual',
      local: formatLocal(wage.annual, country.currencySymbol),
      usd: formatUsd(wage.annualUsd),
      gradient: 'from-chart-3/10 to-transparent',
    },
  ]

  return (
    <Card className="glass-card print-card relative overflow-hidden border-0 p-0">
      {/* Decorative flag watermark */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 text-[11rem] leading-none opacity-[0.06] select-none blur-[1px]"
        aria-hidden
      >
        {flagEmoji(country.iso2)}
      </div>

      {/* Subtle accent stripe at top */}
      <div className="h-1 w-full bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 opacity-80" />

      <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-background/80 text-4xl shadow-md ring-1 ring-border/50"
              aria-hidden
            >
              {flagEmoji(country.iso2)}
            </motion.div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/80">
                Minimum Wage Market
              </p>
              <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                {city.name}
                <span className="ml-2 text-xl font-normal text-muted-foreground">
                  · {country.name}
                </span>
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="font-medium">{country.currency}</span>
                <span className="opacity-40">·</span>
                <span className="stat-number">1 USD = {country.usdRate} {country.currency}</span>
                <span className="opacity-40">·</span>
                <span>{country.standardWorkweekHours}h workweek</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end lg:gap-1.5">
            <Badge variant="secondary" className="gap-1.5 py-1 text-[11px]">
              <Scale className="h-3 w-3" /> {wage.originalUnit} rate
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1 text-[11px]">
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
          {stats.map((s, idx) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className={`glow-card rounded-xl bg-gradient-to-br ${s.gradient} bg-background/60 p-4 ring-1 ring-border/50 backdrop-blur-sm`}
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground font-medium">
                {s.icon}
                {s.label}
              </div>
              <div className="mt-2 text-2xl font-bold stat-number leading-none">{s.local}</div>
              <div className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground stat-number">
                <ArrowUpRight className="h-3 w-3 opacity-50" />
                {s.usd}
              </div>
            </motion.div>
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
