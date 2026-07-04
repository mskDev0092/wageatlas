'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, Github, Globe2, Sparkles, Users, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { COUNTRIES_SORTED, COUNTRY_INDEX, COUNTRIES } from '@/lib/wage-data'
import { DEFAULT_AI_SETTINGS } from '@/lib/ai-client'
import type { AISettings, SavedSnapshot } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

function GlobalStatsBar() {
  const totalCountries = COUNTRIES.length
  const totalCities = COUNTRIES.reduce((sum, c) => sum + c.cities.length, 0)
  const totalCommodities = COUNTRIES.reduce(
    (sum, c) => sum + c.cities.reduce((s, city) => s + city.commodities.length, 0),
    0,
  )

  const stats = [
    { icon: <Globe2 className="h-3.5 w-3.5" />, value: totalCountries, label: 'Countries' },
    { icon: <MapPin className="h-3.5 w-3.5" />, value: totalCities, label: 'Cities' },
    { icon: <BarChart3 className="h-3.5 w-3.5" />, value: totalCommodities, label: 'Data Points' },
    { icon: <Users className="h-3.5 w-3.5" />, value: '5', label: 'COL Indexes' },
  ]

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-1.5 text-xs text-muted-foreground">
      {stats.map((s) => (
        <span key={s.label} className="flex items-center gap-1.5">
          {s.icon}
          <span className="font-semibold text-foreground/80 stat-number">{s.value}</span>
          <span>{s.label}</span>
        </span>
      ))}
    </div>
  )
}

export default function Home() {
  const [countryId, setCountryId] = useLocalStorage<string>('wa:country', 'us')
  const [cityId, setCityId] = useLocalStorage<string>('wa:city', 'us-nyc')
  const [aiSettings, setAiSettings] = useLocalStorage<AISettings>(
    'wa:ai-settings',
    DEFAULT_AI_SETTINGS,
  )
  const [snapshots, setSnapshots] = useLocalStorage<SavedSnapshot[]>('wa:snapshots', [])
  const [compareWith, setCompareWith] = useState<{ countryId: string; cityId: string } | null>(null)
  const [todayStr, setTodayStr] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setTodayStr(new Date().toLocaleDateString())
    setHydrated(true)
  }, [])

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
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl skeleton" />
          <div className="h-4 w-48 skeleton" />
          <div className="h-3 w-32 skeleton" />
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell flex min-h-screen flex-col">
      {/* Skip to content for a11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Header */}
      <header className="no-print glass-header sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Globe2 className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight">WageAtlas</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Global Market Explorer
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              className="sm:hidden"
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
              title={compareWith ? 'Clear comparison' : 'Compare markets'}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex gap-1.5"
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
              <Sparkles className="h-3.5 w-3.5" />
              {compareWith ? 'Clear' : 'Compare'}
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
          </div>
        </div>
        {/* Global stats ticker */}
        <div className="border-t border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <GlobalStatsBar />
          </div>
        </div>
      </header>

      {/* Main */}
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Print-only header */}
        <div className="mb-4 hidden print:block">
          <h1 className="text-2xl font-bold">WageAtlas Report</h1>
          <p className="text-sm text-muted-foreground">
            {country.name} · {city.name} · Generated {todayStr || '…'}
          </p>
        </div>

        {/* Selector with entrance animation */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mb-8 no-print"
        >
          <CountryCitySelector
            countryId={countryId}
            cityId={cityId}
            onCountryChange={handleCountryChange}
            onCityChange={setCityId}
          />
        </motion.div>

        {/* Hero */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${countryId}-${cityId}`}
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <MarketHero country={country} city={city} />
          </motion.div>
        </AnimatePresence>

        {/* Comparison (if active) */}
        <AnimatePresence>
          {compareWith && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            >
              <MarketComparison
                primary={compareWith}
                secondary={{ countryId, cityId }}
                onClear={() => setCompareWith(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section label */}
        <div className="mb-4 flex items-center gap-2">
          <div className="section-divider flex-1" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            Market Analysis
          </span>
          <div className="section-divider flex-1" />
        </div>

        {/* Cost-of-living + Consumption grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 grid gap-5 lg:grid-cols-2"
        >
          <CostOfLivingPanel city={city} />
          <ConsumptionPanel country={country} city={city} />
        </motion.div>

        {/* Commodity basket — full width */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <CommodityBasket country={country} city={city} />
        </motion.div>

        {/* Section label */}
        <div className="mb-4 flex items-center gap-2 no-print">
          <div className="section-divider flex-1" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            AI Assistant
          </span>
          <div className="section-divider flex-1" />
        </div>

        {/* AI panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-10 no-print"
        >
          <AIPanel
            country={country}
            city={city}
            settings={aiSettings}
            onSettingsChange={setAiSettings}
          />
        </motion.div>

        {/* Footnote */}
        <div className="rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            Data sources: ILO/OECD minimum wage databases · Numbeo cost-of-living indexes ·
            National labour ministries · World Bank exchange rates. Figures rounded for
            readability. WageAtlas is a static informational tool and does not constitute
            legal or financial advice.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-4 border-t border-border/50 bg-muted/20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
              <Globe2 className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-semibold">WageAtlas</span>
              <span className="text-[10px] text-muted-foreground">v0.2.0 · MIT License</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 sm:items-end">
            <p className="text-[11px] text-muted-foreground">
              Built with Next.js · TypeScript · Tailwind · shadcn/ui · Recharts
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Static data, zero runtime APIs · AI runs locally via your LM Studio or Ollama
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
