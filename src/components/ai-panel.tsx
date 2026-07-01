'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Brain,
  Loader2,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AISettingsDialog } from '@/components/ai-settings-dialog'
import {
  buildMarketContext,
  fetchWikipediaSummary,
  marketAnalysisPrompt,
  streamChat,
} from '@/lib/ai-client'
import type { AISettings, ChatMessage, CityData, CountryData } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface AIPanelProps {
  country: CountryData
  city: CityData
  settings: AISettings
  onSettingsChange: (s: AISettings) => void
}

const QUICK_PROMPTS = [
  'What does a typical month look like for a minimum-wage worker here?',
  'Where does the wage fall short of basic needs?',
  'How does this compare to other markets you know about?',
  'What is the historical context of minimum wage in this country?',
]

/** AI panel: market analysis generator + free-form chat + Wikipedia research. */
export function AIPanel({ country, city, settings, onSettingsChange }: AIPanelProps) {
  const [analysis, setAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [chatBusy, setChatBusy] = useState(false)
  const [wiki, setWiki] = useState<{ title: string; extract: string; url: string } | null>(null)
  const [wikiBusy, setWikiBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  // Reset state when location changes.
  useEffect(() => {
    setAnalysis('')
    setChat([])
    setWiki(null)
    setError(null)
    abortRef.current?.abort()
  }, [country.id, city.id])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat])

  async function runAnalysis() {
    setAnalyzing(true)
    setError(null)
    setAnalysis('')
    try {
      const system = buildMarketContext(country, city)
      let acc = ''
      for await (const chunk of streamChat(settings, [
        { role: 'system', content: system },
        { role: 'user', content: marketAnalysisPrompt() },
      ])) {
        acc += chunk
        setAnalysis(acc)
      }
      if (!acc) throw new Error('Empty response — check that the model is loaded.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      toast({
        title: 'Analysis failed',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setAnalyzing(false)
    }
  }

  async function runResearch() {
    setWikiBusy(true)
    setError(null)
    try {
      const query = `${country.name} minimum wage`
      const result = await fetchWikipediaSummary(query)
      if (!result) {
        toast({
          title: 'No Wikipedia article found',
          description: `Try a more specific query than "${query}".`,
        })
      } else {
        setWiki(result)
      }
    } finally {
      setWikiBusy(false)
    }
  }

  async function sendChat(text: string) {
    if (!text.trim() || chatBusy) return
    setInput('')
    setError(null)
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    const next = [...chat, userMsg]
    setChat(next)
    setChatBusy(true)

    try {
      const system = buildMarketContext(country, city)
      const assistantId = crypto.randomUUID()
      setChat([
        ...next,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        },
      ])
      let acc = ''
      for await (const chunk of streamChat(settings, [
        { role: 'system', content: system },
        ...next.map((m) => ({ role: m.role, content: m.content })),
      ])) {
        acc += chunk
        setChat((cur) =>
          cur.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
        )
      }
      if (!acc) throw new Error('Empty response from model.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      toast({ title: 'Chat failed', description: msg, variant: 'destructive' })
    } finally {
      setChatBusy(false)
    }
  }

  return (
    <Card className="print-card border-2 border-dashed">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">AI Market Analyst</CardTitle>
              <CardDescription>
                Connect LM Studio, Ollama, or any OpenAI-compatible API for live analysis.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
            <Badge variant="outline" className="gap-1">
              <span
                className={
                  'h-1.5 w-1.5 rounded-full ' +
                  (settings.baseUrl ? 'bg-emerald-500' : 'bg-muted-foreground')
                }
              />
              {settings.model || 'no model'}
            </Badge>
            <AISettingsDialog settings={settings} onChange={onSettingsChange} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 no-print">
          <Button onClick={runAnalysis} disabled={analyzing} size="sm">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate market analysis
          </Button>
          <Button onClick={runResearch} disabled={wikiBusy} variant="outline" size="sm">
            {wikiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
            Wikipedia research
          </Button>
          <Button
            onClick={() => {
              setChat([])
              setAnalysis('')
              setWiki(null)
              setError(null)
            }}
            variant="ghost"
            size="sm"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">AI request failed</p>
              <p className="mt-0.5 text-xs">{error}</p>
              <p className="mt-1 text-xs opacity-80">
                Tip: For LM Studio, ensure the local server is running and CORS is enabled.
                For Ollama, use the OpenAI-compatible endpoint at port 11434.
              </p>
            </div>
          </div>
        )}

        {/* Market analysis output */}
        {analysis && (
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Market analysis
            </div>
            <div className="prose-ai text-sm">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Wikipedia research result */}
        {wiki && (
          <div className="rounded-xl border bg-amber-50/50 p-4 dark:bg-amber-950/20">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                Wikipedia · {wiki.title}
              </div>
              <a
                href={wiki.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                Open article ↗
              </a>
            </div>
            <p className="text-sm leading-relaxed">{wiki.extract}</p>
          </div>
        )}

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-1.5 no-print">
          {QUICK_PROMPTS.map((p) => (
            <Button
              key={p}
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() => sendChat(p)}
              disabled={chatBusy}
            >
              {p}
            </Button>
          ))}
        </div>

        {/* Chat transcript */}
        {chat.length > 0 && (
          <div
            ref={scrollRef}
            className="max-h-80 space-y-3 overflow-y-auto rounded-xl border bg-background/60 p-3 nice-scroll"
          >
            {chat.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={
                  'flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')
                }
              >
                <div
                  className={
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm ' +
                    (m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted')
                  }
                >
                  {m.role === 'assistant' && m.content === '' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : m.role === 'assistant' ? (
                    <div className="prose-ai">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendChat(input)
          }}
          className="flex gap-2 no-print"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about minimum wage in ${city.name}, ${country.name}…`}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendChat(input)
              }
            }}
            disabled={chatBusy}
          />
          <Button type="submit" disabled={chatBusy || !input.trim()} className="self-stretch">
            {chatBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
