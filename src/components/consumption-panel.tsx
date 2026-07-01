'use client'

import { PieChart as PieChartIcon, TrendingDown, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { CityData, CountryData } from '@/lib/types'
import { formatLocal, formatUsd } from '@/lib/wage-utils'

interface ConsumptionPanelProps {
  country: CountryData
  city: CityData
}

/** Shows monthly consumption profiles: income vs expense breakdown. */
export function ConsumptionPanel({ country, city }: ConsumptionPanelProps) {
  if (city.consumption.length === 0) return null

  return (
    <Card className="print-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Monthly Consumption Profile</CardTitle>
            <CardDescription>
              How a full-time minimum-wage worker&apos;s income splits across expenses.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {city.consumption.map((profile, idx) => {
            const totalExpense = profile.expenses.reduce(
              (sum, e) => sum + e.amountLocal,
              0,
            )
            const surplus = profile.monthlyIncomeLocal - totalExpense
            const surplusPct = (surplus / profile.monthlyIncomeLocal) * 100

            return (
              <motion.div
                key={profile.type}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className="rounded-xl border bg-background/60 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{profile.type}</h4>
                    <p className="text-xs text-muted-foreground">
                      Income {formatLocal(profile.monthlyIncomeLocal, country.currencySymbol)}{' '}
                      ({formatUsd(profile.monthlyIncomeLocal / country.usdRate)})
                    </p>
                  </div>
                  <div
                    className={
                      'flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ' +
                      (surplus >= 0
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200')
                    }
                  >
                    {surplus >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {surplus >= 0 ? '+' : ''}
                    {formatLocal(surplus, country.currencySymbol)} ({surplusPct.toFixed(0)}%)
                  </div>
                </div>

                <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={profile.expenses}
                        dataKey="amountLocal"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={56}
                        paddingAngle={2}
                      >
                        {profile.expenses.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--popover)',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        formatter={(value: number, name: string) => [
                          formatLocal(value, country.currencySymbol),
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <ul className="space-y-1.5 text-sm">
                    {profile.expenses.map((e) => (
                      <li key={e.category} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ background: e.color }}
                            aria-hidden
                          />
                          <span className="truncate">{e.category}</span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatLocal(e.amountLocal, country.currencySymbol)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Negative surplus indicates the household cannot meet basic expenses on a single
          minimum-wage income — typical for families in markets where the wage is set per
          worker rather than per household.
        </p>
      </CardContent>
    </Card>
  )
}
