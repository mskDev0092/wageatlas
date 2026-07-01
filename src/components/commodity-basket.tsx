'use client'

import { motion } from 'framer-motion'
import { ShoppingBasket } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { CityData, CountryData } from '@/lib/types'
import {
  formatHours,
  formatLocal,
  formatUsd,
  hoursToAfford,
  normalizeWage,
} from '@/lib/wage-utils'

interface CommodityBasketProps {
  country: CountryData
  city: CityData
}

const CATEGORY_COLOR: Record<string, string> = {
  Food: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  Housing: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200',
  Transport: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  Utility: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200',
  Lifestyle: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
}

/** Full commodity basket table with affordability ("hours to earn"). */
export function CommodityBasket({ country, city }: CommodityBasketProps) {
  const wage = normalizeWage(city, country)

  return (
    <Card className="print-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShoppingBasket className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-lg">Commodity Basket</CardTitle>
            <CardDescription>
              Local prices and affordability — how many hours of minimum-wage work each item costs.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto nice-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[34%]">Item</TableHead>
                <TableHead className="w-[14%]">Category</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Price (local)</TableHead>
                <TableHead className="text-right">USD</TableHead>
                <TableHead className="text-right">Hours to earn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {city.commodities.map((c, idx) => {
                const hours = hoursToAfford(wage.hourly, c.priceLocal)
                const usd = c.priceLocal / country.usdRate
                return (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    className="hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none" aria-hidden>{c.icon}</span>
                        <span>{c.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={CATEGORY_COLOR[c.category]}>
                        {c.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{c.unit}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatLocal(c.priceLocal, country.currencySymbol)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatUsd(usd)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <AffordabilityPill hours={hours} />
                    </TableCell>
                  </motion.tr>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

/** Color-coded hours-to-earn chip: green < 1h, amber < 4h, red ≥ 4h. */
function AffordabilityPill({ hours }: { hours: number }) {
  let cls = 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
  if (hours >= 4) cls = 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200'
  else if (hours >= 1) cls = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'

  return (
    <span className={'inline-flex min-w-[72px] justify-center whitespace-nowrap rounded-md px-2.5 py-0.5 text-xs font-medium ' + cls}>
      {formatHours(hours)}
    </span>
  )
}
