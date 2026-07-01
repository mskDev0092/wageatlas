'use client'

import { ArrowRight, Bookmark, Save, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import type { SavedSnapshot } from '@/lib/types'
import { COUNTRY_INDEX, flagEmoji } from '@/lib/wage-data'
import { formatLocal, formatUsd, normalizeWage } from '@/lib/wage-utils'
import { useToast } from '@/hooks/use-toast'

interface SavedSnapshotsDrawerProps {
  snapshots: SavedSnapshot[]
  currentCountryId: string
  currentCityId: string
  onSave: (notes: string) => void
  onLoad: (snapshot: SavedSnapshot) => void
  onDelete: (id: string) => void
}

/** Drawer that lists snapshots saved to localStorage. */
export function SavedSnapshotsDrawer({
  snapshots,
  currentCountryId,
  currentCityId,
  onSave,
  onLoad,
  onDelete,
}: SavedSnapshotsDrawerProps) {
  const [notes, setNotes] = useState('')
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const isCurrentSaved = snapshots.some(
    (s) => s.countryId === currentCountryId && s.cityId === currentCityId,
  )

  function handleSave() {
    onSave(notes.trim())
    setNotes('')
    toast({
      title: 'Snapshot saved',
      description: 'Stored in localStorage for offline access.',
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="h-4 w-4" />
          Saved
          {snapshots.length > 0 && (
            <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
              {snapshots.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Saved Snapshots</SheetTitle>
          <SheetDescription>
            Persisted in your browser. Click to load, or save the current market view.
          </SheetDescription>
        </SheetHeader>

        <div className="border-b p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Optional notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button onClick={handleSave} disabled={isCurrentSaved} size="sm">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
          {isCurrentSaved && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Current market already saved.
            </p>
          )}
        </div>

        <ScrollArea className="flex-1 nice-scroll">
          <div className="space-y-2 p-4">
            <AnimatePresence initial={false}>
              {snapshots.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No saved snapshots yet.
                  <br />
                  Save the current market to revisit it later.
                </div>
              ) : (
                snapshots.map((s) => {
                  const country = COUNTRY_INDEX.get(s.countryId)
                  const city = country?.cities.find((c) => c.id === s.cityId)
                  if (!country || !city) {
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border p-3 text-sm"
                      >
                        <span className="text-muted-foreground">{s.countryName} · {s.cityName}</span>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(s.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  }
                  const wage = normalizeWage(city, country)
                  return (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="group rounded-lg border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm"
                    >
                      <button
                        className="w-full text-left"
                        onClick={() => {
                          onLoad(s)
                          setOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl" aria-hidden>{flagEmoji(country.iso2)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">
                              {city.name}, {country.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatLocal(wage.monthly, country.currencySymbol)} /mo ·{' '}
                              {formatUsd(wage.monthlyUsd)}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                        </div>
                        {s.notes && (
                          <p className="mt-1.5 text-xs italic text-muted-foreground">
                            &ldquo;{s.notes}&rdquo;
                          </p>
                        )}
                        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                          Saved {new Date(s.savedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </button>
                      <div className="mt-2 flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => onDelete(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

/** Compact two-market comparison card. */
export function MarketComparison({
  primary,
  secondary,
  onClear,
}: {
  primary: { countryId: string; cityId: string }
  secondary: { countryId: string; cityId: string } | null
  onClear: () => void
}) {
  if (!secondary) return null

  const c1 = COUNTRY_INDEX.get(primary.countryId)
  const city1 = c1?.cities.find((c) => c.id === primary.cityId)
  const c2 = COUNTRY_INDEX.get(secondary.countryId)
  const city2 = c2?.cities.find((c) => c.id === secondary.cityId)

  if (!c1 || !city1 || !c2 || !city2) return null

  const w1 = normalizeWage(city1, c1)
  const w2 = normalizeWage(city2, c2)
  const monthlyDiffPct = ((w1.monthlyUsd - w2.monthlyUsd) / w2.monthlyUsd) * 100

  const rows = [
    {
      label: 'Monthly wage (USD)',
      a: formatUsd(w1.monthlyUsd),
      b: formatUsd(w2.monthlyUsd),
    },
    {
      label: 'Hourly wage (USD)',
      a: formatUsd(w1.hourlyUsd),
      b: formatUsd(w2.hourlyUsd),
    },
    {
      label: 'Cost-of-living index',
      a: String(city1.costOfLivingIndex),
      b: String(city2.costOfLivingIndex),
    },
    {
      label: 'Rent index',
      a: String(city1.rentIndex),
      b: String(city2.rentIndex),
    },
    {
      label: 'Purchasing power',
      a: String(city1.purchasingPowerIndex),
      b: String(city2.purchasingPowerIndex),
    },
    {
      label: 'Workweek (h)',
      a: String(c1.standardWorkweekHours),
      b: String(c2.standardWorkweekHours),
    },
  ]

  return (
    <Card className="print-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear} className="no-print">
            <X className="h-4 w-4" /> Clear
          </Button>
        </div>
        <CardDescription>
          {city1.name} vs {city2.name} — based on USD-normalized wages and cost-of-living indexes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl" aria-hidden>{flagEmoji(c1.iso2)}</div>
            <div className="mt-1 font-medium">{city1.name}</div>
            <div className="text-xs text-muted-foreground">{c1.name}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl" aria-hidden>{flagEmoji(c2.iso2)}</div>
            <div className="mt-1 font-medium">{city2.name}</div>
            <div className="text-xs text-muted-foreground">{c2.name}</div>
          </div>
        </div>

        <div className="space-y-1">
          {rows.map((r) => (
            <div
              key={r.label}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-sm odd:bg-muted/30"
            >
              <span className="text-right tabular-nums">{r.a}</span>
              <span className="text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                {r.label}
              </span>
              <span className="tabular-nums">{r.b}</span>
            </div>
          ))}
        </div>

        <div
          className={
            'mt-3 rounded-lg p-3 text-center text-sm font-medium ' +
            (monthlyDiffPct > 0
              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
              : monthlyDiffPct < 0
                ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200'
                : 'bg-muted')
          }
        >
          {city1.name} monthly wage is {monthlyDiffPct > 0 ? 'higher' : 'lower'} than{' '}
          {city2.name} by {Math.abs(monthlyDiffPct).toFixed(1)}% (USD-normalized).
        </div>
      </CardContent>
    </Card>
  )
}
