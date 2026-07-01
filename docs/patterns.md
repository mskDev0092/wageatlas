# Code Patterns

> **File:** `docs/patterns.md`
> **Audience:** AI agents writing new code that follows existing conventions

---

## 1. `cn()` — Class Merging

Used by every component. Combines `clsx` (conditional classes) with `tailwind-merge` (resolves conflicts).

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Usage pattern (every component follows this):**
```tsx
function Button({ className, variant, ...props }: ComponentProps<"button"> & { variant?: "default" | "outline" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded-md px-4 py-2 text-sm font-medium",
        variant === "outline" && "border border-input bg-background",
        className  // ← always last so callers can override
      )}
      {...props}
    />
  )
}
```

---

## 2. `useLocalStorage<T>` — Persistent State

Replaces `useState` when state should survive page reloads.

```ts
// src/hooks/use-localstorage.ts
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Returns a stateful value, persisted to localStorage
  // Hydrates from localStorage in useEffect (SSR-safe)
  // Falls back to initialValue if parsing fails or key doesn't exist
}
```

**Usage:**
```ts
const [countryId, setCountryId] = useLocalStorage<string>('wa:country', 'us')
const [snapshots, setSnapshots] = useLocalStorage<SavedSnapshot[]>('wa:snapshots', [])
```

**Pattern for updating with functions:**
```ts
setSnapshots((prev) => [newItem, ...prev.filter(...)])
```

---

## 3. Component with Controlled Props

Components receive state and callbacks from parents. They never manage their own state unless it's purely local UI state.

```tsx
// Pattern: controlled component with change handler
function CountryCitySelector({
  countryId,
  cityId,
  onCountryChange,
  onCityChange,
}: {
  countryId: string
  cityId: string
  onCountryChange: (id: string) => void
  onCityChange: (id: string) => void
}) {
  // Renders two dropdowns, calls onCountryChange/onCityChange on selection
}
```

---

## 4. `useCallback` for Stable References

Event handlers passed as props are wrapped in `useCallback` to prevent unnecessary re-renders:

```ts
const handleCountryChange = useCallback((id: string) => {
  setCountryId(id)
  const c = COUNTRY_INDEX.get(id)
  if (c) setCityId(c.cities[0]?.id ?? '')
}, [setCountryId, setCityId])
```

---

## 5. `useMemo` for Derived Data

Computed values are memoized:

```ts
const country = useMemo(() => COUNTRY_INDEX.get(countryId), [countryId])
const city = useMemo(() => country?.cities.find((c) => c.id === cityId), [country, cityId])
```

---

## 6. shadcn/ui Component Pattern

All UI primitives follow this exact structure:

```tsx
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// Optional: variant definitions
const buttonVariants = cva(
  'base-classes',
  { variants: { variant: { default: '...', outline: '...' } } }
)

function ComponentName({
  className,
  ...props
}: React.ComponentProps<'div'> & {
  // Component-specific props
}) {
  return (
    <div
      data-slot="component-name"
      className={cn('default styles', className)}
      {...props}
    />
  )
}

export { ComponentName, buttonVariants }
```

---

## 7. AI Streaming Pattern

```ts
// src/lib/ai-client.ts
async function* streamChat(messages: ChatMessage[], settings: AISettings, signal?: AbortSignal) {
  // 1. POST to /v1/chat/completions with stream: true
  // 2. Read response.body as ReadableStream
  // 3. Parse SSE "data:" lines
  // 4. Yield extracted text deltas via yield
  // 5. Handle abort via AbortSignal
}

// Usage in ai-panel.tsx:
for await (const delta of streamChat(messages, settings, abortRef.current?.signal)) {
  setContent(prev => prev + delta)
}
```

---

## 8. Toast Notification Pattern

```ts
const { toast } = useToast()

toast({
  title: 'Snapshot saved',
  description: 'Your current view has been saved.',
  // optional: variant: 'destructive' for error toasts
})
```

---

## 9. SSR-Safe Date/Time Pattern

Browser-only values must be initialized after hydration to prevent React hydration mismatches:

```tsx
// Correct pattern:
const [todayStr, setTodayStr] = useState('')
useEffect(() => { setTodayStr(new Date().toLocaleDateString()) }, [])
// Render: Generated {todayStr || '…'}
```

```tsx
// WRONG — causes hydration error:
// Generated {new Date().toLocaleDateString()}
```

---

## 10. Responsive Mobile Pattern

```ts
// src/hooks/use-mobile.ts
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
```

---

## 11. Print CSS Pattern

The app supports PDF export via `window.print()`. Elements can be hidden in print or shown only in print:

```css
/* In globals.css */
.no-print {
  @media print {
    display: none !important;
  }
}

.print\:block {
  @media print {
    display: block !important;
  }
}
```

Usage:
```tsx
<header className="no-print">…</header>           {/* Hidden in PDF */}
<div className="hidden print:block">…</div>       {/* Only visible in PDF */}
```

---

## 12. Error Boundary Pattern

Components handle edge cases with early returns:

```tsx
if (!country || !city) {
  return (
    <div className="grid min-h-screen place-items-center">
      <p className="text-muted-foreground">Loading market data…</p>
    </div>
  )
}
```
