import type { AISettings, ChatMessage, CityData, CountryData } from './types'
import { formatLocal, formatUsd, normalizeWage } from './wage-utils'

/**
 * AI integration layer — OpenAI-compatible client that works with:
 *   - LM Studio (default: http://localhost:1234/v1)
 *   - Ollama    (default: http://localhost:11434/v1 — needs Ollama 0.1.27+)
 *   - OpenAI    (https://api.openai.com/v1)
 *   - Any other OpenAI-compatible endpoint
 *
 * All calls happen client-side. The endpoint URL and API key live in localStorage
 * and never leave the browser except to the configured endpoint.
 */

export const AI_PRESETS: Record<
  AISettings['preset'],
  { label: string; baseUrl: string; apiKeyHint: string; docsUrl: string }
> = {
  lmstudio: {
    label: 'LM Studio',
    baseUrl: 'http://localhost:1234/v1',
    apiKeyHint: 'Any string (LM Studio does not validate)',
    docsUrl: 'https://lmstudio.ai/docs/local-server',
  },
  ollama: {
    label: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    apiKeyHint: 'Any string (Ollama does not validate)',
    docsUrl: 'https://ollama.com/blog/openai-compatibility',
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyHint: 'sk-...',
    docsUrl: 'https://platform.openai.com/docs/api-reference',
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    apiKeyHint: 'Optional',
    docsUrl: '',
  },
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  preset: 'lmstudio',
  baseUrl: AI_PRESETS.lmstudio.baseUrl,
  apiKey: 'lm-studio',
  model: 'local-model',
  temperature: 0.4,
}

/** Test connectivity + model listing with the configured endpoint. */
export async function testConnection(settings: AISettings): Promise<{
  ok: boolean
  models?: string[]
  message: string
}> {
  try {
    const url = `${settings.baseUrl.replace(/\/$/, '')}/models`
    const res = await fetch(url, {
      method: 'GET',
      headers: authHeaders(settings),
    })
    if (!res.ok) {
      return { ok: false, message: `HTTP ${res.status}: ${await res.text().catch(() => res.statusText)}` }
    }
    const json = (await res.json()) as { data?: Array<{ id: string }> }
    const models = (json.data ?? []).map((m) => m.id)
    return {
      ok: true,
      models,
      message: models.length ? `Connected. ${models.length} model(s) available.` : 'Connected.',
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Failed to fetch')) {
      return {
        ok: false,
        message:
          'Could not reach the endpoint. If it is on localhost, ensure the server is running and CORS is enabled. For LM Studio, toggle "Enable CORS" in the server tab.',
      }
    }
    return { ok: false, message: msg }
  }
}

function authHeaders(settings: AISettings): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (settings.apiKey) h['Authorization'] = `Bearer ${settings.apiKey}`
  return h
}

/** Stream a chat completion from the configured endpoint. Yields delta text. */
export async function* streamChat(
  settings: AISettings,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const url = `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(settings),
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: settings.temperature,
      stream: true,
    }),
    signal,
  })
  if (!res.ok || !res.body) {
    throw new Error(`Chat request failed: HTTP ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        const delta: string = json.choices?.[0]?.delta?.content ?? ''
        if (delta) yield delta
      } catch {
        // Skip malformed lines (keepalive, etc.)
      }
    }
  }
}

/** Build a system prompt that gives the model rich context about the selected market. */
export function buildMarketContext(country: CountryData, city: CityData): string {
  const wage = normalizeWage(city, country)
  const commodities = city.commodities
    .map((c) => `- ${c.label}: ${formatLocal(c.priceLocal, country.currencySymbol)} / ${c.unit}`)
    .join('\n')

  return `You are WageAtlas AI, a labor-economics analyst.
Analyze the minimum-wage market below using clear, structured prose.
Use concrete numbers from the data. If asked about facts not in the data,
say so explicitly and suggest checking an authoritative source.

MARKET CONTEXT
- Country: ${country.name} (${country.iso2.toUpperCase()})
- Currency: ${country.currency} (1 USD = ${country.usdRate} ${country.currency})
- City: ${city.name}
- Authority: ${country.authority}
- Effective: ${country.effectiveDate}
- Standard workweek: ${country.standardWorkweekHours} h
- Source: ${country.source} / ${city.source}

MINIMUM WAGE
- Hourly (derived): ${formatLocal(wage.hourly, country.currencySymbol)} (${formatUsd(wage.hourlyUsd)})
- Daily: ${formatLocal(wage.daily, country.currencySymbol)} (${formatUsd(wage.daily * country.usdRate)})
- Monthly: ${formatLocal(wage.monthly, country.currencySymbol)} (${formatUsd(wage.monthlyUsd)})
- Annual: ${formatLocal(wage.annual, country.currencySymbol)} (${formatUsd(wage.annualUsd)})
- Original legislated unit: ${wage.originalUnit}

COST-OF-LIVING INDEXES (NYC = 100)
- Overall: ${city.costOfLivingIndex}
- Rent: ${city.rentIndex}
- Groceries: ${city.groceriesIndex}
- Restaurant: ${city.restaurantIndex}
- Local purchasing power: ${city.purchasingPowerIndex}

COMMODITY BASKET (local currency per unit)
${commodities}

CONSUMPTION PROFILES (monthly, local currency)
${city.consumption
  .map(
    (p) =>
      `- ${p.type}: income ${formatLocal(p.monthlyIncomeLocal, country.currencySymbol)}, expenses ${p.expenses
        .map((e) => `${e.category} ${formatLocal(e.amountLocal, country.currencySymbol)}`)
        .join(', ')}`,
  )
  .join('\n')}

Answer in markdown. Be concise but substantive (3-6 short paragraphs).
Prefer plain language a non-economist can act on.`
}

/** Generate a single user-message turn for a market analysis. */
export function marketAnalysisPrompt(focus?: string): string {
  if (focus) return `Provide a market analysis focused on: ${focus}`
  return `Provide a market analysis covering: (1) what a full-time minimum-wage worker's monthly take-home looks like, (2) how the cost of living eats into it (rent, food, transport), (3) affordability of the commodity basket (hours of work per item), (4) one practical takeaway for someone considering moving here for minimum-wage work.`
}

/** Build a transcript usable as OpenAI-compatible chat history. */
export function toChatTranscript(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }))
}

/**
 * Live research via Wikipedia REST API.
 * CORS-enabled, no server needed. Returns a short summary excerpt for the query.
 */
export async function fetchWikipediaSummary(query: string): Promise<{
  title: string
  extract: string
  url: string
} | null> {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      query.replace(/\s+/g, '_'),
    )}`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      title?: string
      extract?: string
      content_urls?: { desktop?: { page?: string } }
      type?: string
    }
    if (!json.extract || json.type === 'disambiguation') return null
    return {
      title: json.title ?? query,
      extract: json.extract,
      url: json.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
    }
  } catch {
    return null
  }
}
