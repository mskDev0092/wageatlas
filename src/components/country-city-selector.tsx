'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown, MapPin, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { COUNTRIES_SORTED, flagEmoji } from '@/lib/wage-data'
import type { CountryData } from '@/lib/types'

interface CountryCitySelectorProps {
  countryId: string
  cityId: string
  onCountryChange: (id: string) => void
  onCityChange: (id: string) => void
}

/** Combined country → city picker. Two-stage dropdown with searchable lists. */
export function CountryCitySelector({
  countryId,
  cityId,
  onCountryChange,
  onCityChange,
}: CountryCitySelectorProps) {
  const [countryOpen, setCountryOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)

  const country = useMemo(
    () => COUNTRIES_SORTED.find((c) => c.id === countryId),
    [countryId],
  ) as CountryData | undefined

  const city = useMemo(
    () => country?.cities.find((c) => c.id === cityId),
    [country, cityId],
  )

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Country picker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Country
        </label>
        <Popover open={countryOpen} onOpenChange={setCountryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={countryOpen}
              className="h-12 justify-between text-base font-medium"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="text-2xl leading-none" aria-hidden>
                  {country ? flagEmoji(country.iso2) : '🌍'}
                </span>
                <span className="truncate">{country ? country.name : 'Select country…'}</span>
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search country…" />
              <CommandList className="max-h-72 nice-scroll">
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {COUNTRIES_SORTED.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${c.iso2}`}
                      onSelect={() => {
                        onCountryChange(c.id)
                        // Auto-pick first city when changing country.
                        onCityChange(c.cities[0]?.id ?? '')
                        setCountryOpen(false)
                      }}
                    >
                      <span className="mr-2 text-lg" aria-hidden>{flagEmoji(c.iso2)}</span>
                      <span className="flex-1">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.currency}</span>
                      <Check
                        className={cn(
                          'ml-2 h-4 w-4',
                          countryId === c.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* City picker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          City / Region
        </label>
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={cityOpen}
              disabled={!country}
              className="h-12 justify-between text-base font-medium"
            >
              <span className="flex items-center gap-2 truncate">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{city ? city.name : 'Select city…'}</span>
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search city…" />
              <CommandList className="max-h-72 nice-scroll">
                <CommandEmpty>No city found.</CommandEmpty>
                <CommandGroup>
                  {(country?.cities ?? []).map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.name}
                      onSelect={() => {
                        onCityChange(c.id)
                        setCityOpen(false)
                      }}
                    >
                      <MapPin className="mr-2 h-4 w-4 opacity-60" />
                      <span className="flex-1">{c.name}</span>
                      <Check
                        className={cn(
                          'ml-2 h-4 w-4',
                          cityId === c.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
