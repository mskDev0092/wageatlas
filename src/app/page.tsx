'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Github, Globe2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { CountryCitySelector } from '@/components/country-city-selector'
import { MarketHero } from '@/components/market-hero'
import { CostOfLivingPanel } from '@/components/cost-of-living-panel'
import { CommodityBasket } from '@/components/commodity-basket'
import { ConsumptionPanel } from '@/components/consumption-panel'
import { AIPanel } from '@/components/ai-panel'
import { ExportMenu } from '@/components/export-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  MarketComparison,
  SavedSnapshotsDrawer,
} from '@/components/saved-snapshots'
import { Button } from '@/components/ui/button'
import { useLocalStorage } from '@/hooks/use-localstorage'
import { COUNTRIES_SORTED, COUNTRY_INDEX } from '@/lib/wage-data'
import { DEFAULT_AI_SETTINGS } from '@/lib/ai-client'
import type { AISettings, SavedSnapshot } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export default function Home() {
  // Persistence: last-selected country/city, AI settings, saved snapshots.
  const [countryId, setCountryId] = useLocalStorage<string>('wa:country', 'us')
  const [cityId, setCityId] = useLocalStorage<string>('wa:city', 'us-nyc')
  const [aiSettings, setAiSettings] = useLocalStorage<AISettings>(
    'wa:ai-settings',
    DEFAULT_AI_SETTINGS,
  )
  const [snapshots, setSnapshots] = useLocalStorage<SavedSnapshot[]>('wa:snapshots', [])
  const [compareWith, setCompareWith] = useState<{ countryId: string; cityId: string } | null>(null)
  const [todayStr, setTodayStr] = useState('')
  const { toast } = useToast()

  useEffect(() => { setTodayStr(new Date().toLocaleDateString()) }, [])

  // Guard against stale / invalid IDs after data updates.
  useEffect(() => {
    if (!COUNTRY_INDEX.has(countryId)) {
      setCountryId(COUNTRIES_SORTED[0].id)
      setCityId(COUNTRIES_SORTED[0].cities[0]?.id ?? '')
    } else {
      const c = COUNTRY_INDEX.get(countryId)!
      if (!c.cities.some((city) => city.id === cityId)) {
        setCityId(c.cities[0]?.id ?? '')
      }
    }
  }, [])

  const country = useMemo(() => COUNTRY_INDEX.get(countryId), [countryId])
  const city = useMemo(
    () => country?.cities.find((c) => c.id === cityId),
    [country, cityId],
  )

  const handleCountryChange = useCallback(
    (id: string) => {
      setCountryId(id)
      const c = COUNTRY_INDEX.get(id)
      if (c) setCityId(c.cities[0]?.id ?? '')
    },
    [setCountryId, setCityId],
  )

  const handleSaveSnapshot = useCallback(
    (notes: string) => {
      if (!country || !city) return
      const snap: SavedSnapshot = {
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        countryId,
        countryName: country.name,
        cityId,
        cityName: city.name,
        notes: notes || undefined,
      }
      setSnapshots((prev) =>
        [snap, ...prev.filter((s) => !(s.countryId === countryId && s.cityId === cityId))].slice(0, 50),
      )
    },
    [country, city, countryId, cityId, setSnapshots],
  )

  const handleLoadSnapshot = useCallback(
    (s: SavedSnapshot) => {
      setCountryId(s.countryId)
      setCityId(s.cityId)
      toast({ title: 'Loaded snapshot', description: `${s.cityName}, ${s.countryName}` })
    },
    [setCountryId, setCityId, toast],
  )

  const handleDeleteSnapshot = useCallback(
    (id: string) => {
      setSnapshots((prev) => prev.filter((s) => s.id !== id))
    },
    [setSnapshots],
  )

  if (!country || !city) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="text-muted-foreground">Loading market data…</p>
      </div>
    )
  }

  return (
    <div className="app-shell flex min-h-screen flex-col">
      {/* Header */}
      <header className="no-print sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Globe2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight">WageAtlas</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Minimum Wage Atlas
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                if (compareWith?.countryId === countryId && compareWith?.cityId === cityId) {
                  setCompareWith(null)
                  return
                }
                setCompareWith({ countryId, cityId })
                toast({
                  title: 'Marked for comparison',
                  description: 'Now switch to another market to compare side-by-side.',
                })
              }}
            >
              <Sparkles className="h-4 w-4" />
              {compareWith ? 'Clear compare' : 'Compare…'}
            </Button>
            <SavedSnapshotsDrawer
              snapshots={snapshots}
              currentCountryId={countryId}
              currentCityId={cityId}
              onSave={handleSaveSnapshot}
              onLoad={handleLoadSnapshot}
              onDelete={handleDeleteSnapshot}
            />
            <ExportMenu country={country} city={city} />
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild title="Source on GitHub">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Source on GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Print-only header */}
        <div className="mb-4 hidden print:block">
          <h1 className="text-2xl font-bold">WageAtlas Report</h1>
          <p className="text-sm text-muted-foreground">
            {country.name} · {city.name} · Generated {todayStr || '…'}
          </p>
        </div>

        {/* Selector */}
        <div className="mb-6 no-print">
          <CountryCitySelector
            countryId={countryId}
            cityId={cityId}
            onCountryChange={handleCountryChange}
            onCityChange={setCityId}
          />
        </div>

        {/* Hero */}
        <motion.div
          key={`${countryId}-${cityId}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-6"
        >
          <MarketHero country={country} city={city} />
        </motion.div>

        {/* Comparison (if active) */}
        {compareWith && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <MarketComparison
              primary={compareWith}
              secondary={{ countryId, cityId }}
              onClear={() => setCompareWith(null)}
            />
          </motion.div>
        )}

        {/* Cost-of-living + Consumption grid */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <CostOfLivingPanel city={city} />
          <ConsumptionPanel country={country} city={city} />
        </div>

        {/* Commodity basket — full width */}
        <div className="mb-6">
          <CommodityBasket country={country} city={city} />
        </div>

        {/* AI panel */}
        <div className="mb-6 no-print">
          <AIPanel
            country={country}
            city={city}
            settings={aiSettings}
            onSettingsChange={setAiSettings}
          />
        </div>

        {/* Footnote */}
        <p className="text-center text-xs text-muted-foreground">
          Data sources: ILO/OECD minimum wage databases, Numbeo cost-of-living indexes,
          national labour ministries, World Bank exchange rates. Figures rounded for
          readability · WageAtlas is a static informational tool and does not constitute
          legal or financial advice.
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>
            Built with Next.js · TypeScript · Tailwind · shadcn/ui · OpenAI-compatible AI
          </p>
          <p>
            All data is static and embedded · AI runs locally via your LM Studio / Ollama
          </p>
        </div>
      </footer>
    </div>
  )
}
