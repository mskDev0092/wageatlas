'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Persistent state hook backed by localStorage.
 * Generic, single-responsibility: load → hydrate → update → persist.
 *
 * Usage:
 *   const [settings, setSettings] = useLocalStorage('wa:ai-settings', defaults)
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [stored, setStored] = useState<T>(initialValue)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount (client-only).
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item != null) setStored(JSON.parse(item) as T)
    } catch (err) {
      console.warn(`useLocalStorage: failed to read "${key}"`, err)
    } finally {
      setHydrated(true)
    }
  }, [key])

  // Persist on change (after hydration to avoid clobbering).
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(key, JSON.stringify(stored))
    } catch (err) {
      console.warn(`useLocalStorage: failed to write "${key}"`, err)
    }
  }, [key, stored, hydrated])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => (value instanceof Function ? value(prev) : value))
    },
    [],
  )

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // ignore
    }
  }, [key])

  return [stored, setValue, remove]
}
