'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plug, PlugZap, RefreshCw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { AI_PRESETS, DEFAULT_AI_SETTINGS, testConnection } from '@/lib/ai-client'
import type { AISettings } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

interface AISettingsDialogProps {
  settings: AISettings
  onChange: (s: AISettings) => void
  trigger?: React.ReactNode
}

/** Modal for configuring the OpenAI-compatible endpoint. */
export function AISettingsDialog({ settings, onChange, trigger }: AISettingsDialogProps) {
  const [draft, setDraft] = useState<AISettings>(settings)
  const [open, setOpen] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; models?: string[] } | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setDraft(settings)
      setTestResult(null)
    }
  }, [open, settings])

  function applyPreset(preset: AISettings['preset']) {
    const p = AI_PRESETS[preset]
    setDraft((d) => ({
      ...d,
      preset,
      baseUrl: preset === 'custom' ? d.baseUrl : p.baseUrl,
    }))
  }

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await testConnection(draft)
      setTestResult(res)
    } finally {
      setTesting(false)
    }
  }

  function handleSave() {
    onChange(draft)
    toast({
      title: 'AI settings saved',
      description: `Connected via ${AI_PRESETS[draft.preset].label} → ${draft.model || 'no model'}`,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <Plug className="h-4 w-4" />
            AI Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlugZap className="h-5 w-5" />
            AI Provider Settings
          </DialogTitle>
          <DialogDescription>
            Connect any OpenAI-compatible endpoint. Settings stay in your browser&apos;s localStorage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="preset">Provider preset</Label>
            <Select value={draft.preset} onValueChange={(v) => applyPreset(v as AISettings['preset'])}>
              <SelectTrigger id="preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AI_PRESETS).map(([key, p]) => (
                  <SelectItem key={key} value={key}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={draft.baseUrl}
              onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
              placeholder="http://localhost:1234/v1"
              spellCheck={false}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Must end with <code className="font-mono">/v1</code> for OpenAI-compatible servers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={draft.apiKey}
                onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                placeholder={AI_PRESETS[draft.preset].apiKeyHint}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                placeholder="llama3.1:8b"
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Temperature: {draft.temperature.toFixed(2)}</Label>
              <span className="text-xs text-muted-foreground">Lower = factual, higher = creative</span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={[draft.temperature]}
              onValueChange={([v]) => setDraft({ ...draft, temperature: v })}
            />
          </div>

          {testResult && (
            <div
              className={
                'rounded-lg border p-3 text-sm ' +
                (testResult.ok
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200')
              }
            >
              <div className="flex items-center gap-2 font-medium">
                {testResult.ok ? <PlugZap className="h-4 w-4" /> : <Plug className="h-4 w-4" />}
                {testResult.ok ? 'Connected' : 'Connection failed'}
              </div>
              <p className="mt-1 text-xs">{testResult.message}</p>
              {testResult.models && testResult.models.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {testResult.models.slice(0, 6).map((m) => (
                    <Badge key={m} variant="outline" className="text-[10px]">
                      {m}
                    </Badge>
                  ))}
                  {testResult.models.length > 6 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{testResult.models.length - 6} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Test connection
          </Button>
          <Button onClick={handleSave} disabled={!draft.baseUrl || !draft.model}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DEFAULT_AI_SETTINGS }
