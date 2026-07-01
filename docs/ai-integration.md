# AI Integration

> **File:** `docs/ai-integration.md`
> **Source of truth:** `src/lib/ai-client.ts`, `src/components/ai-panel.tsx`, `src/components/ai-settings-dialog.tsx`

---

## 1. Architecture

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  AIPanel      │────▶│  ai-client.ts     │────▶│  AI Provider     │
│  (React UI)   │     │  streamChat()     │     │  (LM Studio,     │
│               │◀────│  buildMarketCtx() │◀────│  Ollama, OpenAI) │
│  Chat history │     │  wikipediaSumm()  │     └──────────────────┘
│  Actions      │     └───────────────────┘
│  Settings     │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ AISettingsDialog  │
│ (preset/url/key/  │
│  model/temp)      │
└──────────────────┘
```

**Key principle:** All AI calls happen client-side. The browser connects directly to the configured AI provider. No AI traffic passes through the Next.js server.

---

## 2. Streaming Chat (`streamChat`)

```ts
// src/lib/ai-client.ts

async function* streamChat(
  messages: ChatMessage[],    // Conversation history
  settings: AISettings,      // Provider config
  signal?: AbortSignal       // For cancellation
): AsyncGenerator<string>
```

**How it works:**
1. Builds a `POST` request to `{baseUrl}/v1/chat/completions`
2. Sets `stream: true` for Server-Sent Events
3. Reads the response body as a `ReadableStream<Uint8Array>`
4. Parses `data: {...}` SSE lines
5. Yields each text delta as it arrives
6. Returns `[DONE]` when complete
7. Supports `AbortController` for cancellation

**Usage in AIPanel:**
```ts
const abortRef = useRef<AbortController>(new AbortController())

async function sendChat() {
  const messages = [...chat, { role: 'user', content: input, id: crypto.randomUUID(), timestamp: new Date().toISOString() }]
  setChat(messages)
  setInput('')

  try {
    for await (const delta of streamChat(messages, settings, abortRef.current.signal)) {
      setContent(prev => prev + delta)
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return
    setError(err.message)
  }
}
```

---

## 3. Market Context Builder

Before streaming, the system injects a detailed context prompt:

```ts
function buildMarketContext(country: CountryData, city: CityData): string {
  // Returns a multi-paragraph system prompt containing:
  // - Country overview (name, currency, exchange rate)
  // - Minimum wage details (hourly, daily, monthly, annual in local + USD)
  // - Cost-of-living indexes (overall, rent, groceries, restaurants, purchasing power)
  // - Commodity prices (all 10 items with local + USD prices)
  // - Affordability (hours to afford each commodity)
  // - Consumption profile (most detailed profile's income and expenses)
  // - Comparison guidance (markets the city can be compared to)
}
```

This prompt is sent as a system message before the first user message in each conversation.

---

## 4. Wikipedia Research

```ts
async function fetchWikipediaSummary(query: string): Promise<string | null>
```

Two-step lookup:
1. Search Wikipedia API for the query (e.g., "Germany economy")
2. Fetch the summary (first paragraph) of the best-matching article
3. Returns markdown-formatted text or `null` if not found

**Used by:** The "Research" action button in AIPanel, which fetches country-level Wikipedia data and appends it as context.

---

## 5. AI Action Buttons

The AIPanel provides four pre-built actions:

| Button | Function | Effect |
|---|---|---|
| **Analyze** | `runAnalysis` | Sends market context + "Analyze this market" prompt |
| **Compare** | `runCompare` | Sends "Compare {city} with other global markets" prompt |
| **Research** | `runResearch` | Fetches Wikipedia summary + sends with market context |
| **Livability** | `runLivability` | Sends "Assess livability score" prompt |

Each action:
1. Clears previous AI output
2. Builds the appropriate system prompt
3. Streams the response
4. Handles errors (connection refused, timeout, invalid API key)

---

## 6. Provider Configuration

Four presets are defined in `AI_PRESETS`:

| Preset | Base URL | Default Model |
|---|---|---|
| `lmstudio` | `http://localhost:1234` | `local-model` |
| `ollama` | `http://localhost:11434` | `llama3.2` |
| `openai` | `https://api.openai.com` | `gpt-4o-mini` |
| `custom` | (user-defined) | (user-defined) |

**Connection testing** sends a `GET {baseUrl}/models` request to verify the endpoint is reachable.

---

## 7. Security Notes

- **API keys are stored in localStorage** — never sent to any server except the configured AI endpoint
- **No server-side AI proxy** — the AI provider URL is called directly from the browser
- **All data is public** — no authentication or authorization needed
- **Wikipedia API is public** — no API key needed
- **CORS** — LM Studio and Ollama run locally and have permissive CORS; OpenAI requires a valid API key but has browser CORS support
