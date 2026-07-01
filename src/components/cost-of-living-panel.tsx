'use client'

import { motion } from 'framer-motion'
import { BarChart3 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CityData } from '@/lib/types'

interface CostOfLivingPanelProps {
  city: CityData
}

const INDEX_LABELS: Record<string, string> = {
  costOfLivingIndex: 'Overall',
  rentIndex: 'Rent',
  groceriesIndex: 'Groceries',
  restaurantIndex: 'Restaurant',
  purchasingPowerIndex: 'Purchasing Power',
}

/** Compact summary card showing all 5 cost-of-living indexes vs NYC baseline. */
export function CostOfLivingPanel({ city }: CostOfLivingPanelProps) {
  const barData = [
    { name: 'Overall', short: 'Overall', value: city.costOfLivingIndex, baseline: 100 },
    { name: 'Rent', short: 'Rent', value: city.rentIndex, baseline: 100 },
    { name: 'Groceries', short: 'Food', value: city.groceriesIndex, baseline: 100 },
    { name: 'Restaurant', short: 'Dining', value: city.restaurantIndex, baseline: 100 },
    { name: 'Purchasing Power', short: 'Power', value: city.purchasingPowerIndex, baseline: 100 },
  ]

  const radarData = barData.map((d) => ({ subject: d.short, value: d.value }))

  return (
    <Card className="print-card h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Cost-of-Living Indexes</CardTitle>
            <CardDescription>Relative to New York City = 100 · {city.name}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Radar on the left for compactness */}
          <div className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} outerRadius="78%">
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar
                  name={city.name}
                  dataKey="value"
                  stroke="var(--chart-2)"
                  fill="var(--chart-2)"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Bars with NYC baseline reference */}
          <div className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical" margin={{ left: 12, right: 12, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis
                  type="number"
                  domain={[0, 120]}
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={88}
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value} (NYC=100)`, 'Index']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} fill="var(--chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inline index chips for quick scanning / print */}
        <motion.div
          key={city.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5"
        >
          {Object.entries(INDEX_LABELS).map(([key, label]) => {
            const value = city[key as keyof CityData] as number
            const pctVsNyc = value - 100
            const isCheaper = pctVsNyc < 0
            const isPpp = key === 'purchasingPowerIndex'
            const goodDirection = isPpp ? pctVsNyc > 0 : pctVsNyc < 0
            return (
              <div
                key={key}
                className="rounded-lg border bg-background/60 p-2.5 text-center"
              >
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {label}
                </div>
                <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
                <div
                  className={
                    'text-[11px] tabular-nums ' +
                    (pctVsNyc === 0
                      ? 'text-muted-foreground'
                      : goodDirection
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400')
                  }
                >
                  {pctVsNpcLabel(pctVsNyc, isPpp)}
                </div>
              </div>
            )
          })}
        </motion.div>
      </CardContent>
    </Card>
  )
}

function pctVsNpcLabel(pct: number, isPpp: boolean): string {
  if (pct === 0) return 'same as NYC'
  const sign = pct > 0 ? '+' : ''
  if (isPpp) {
    return `${sign}${pct}% ${pct > 0 ? 'higher' : 'lower'}`
  }
  return `${sign}${pct}% ${pct < 0 ? 'cheaper' : 'pricier'}`
}
