'use client'

import { Download, FileDown, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CityData, CountryData } from '@/lib/types'
import { buildCityCsv, downloadCsv, printToPdf } from '@/lib/export-utils'
import { useToast } from '@/hooks/use-toast'

interface ExportMenuProps {
  country: CountryData
  city: CityData
}

/** Header dropdown: export to CSV / print to PDF. */
export function ExportMenu({ country, city }: ExportMenuProps) {
  const { toast } = useToast()

  function handleCsv() {
    const csv = buildCityCsv(country, city)
    downloadCsv(`wageatlas-${country.id}-${city.id}.csv`, csv)
    toast({ title: 'CSV downloaded', description: `${country.name} · ${city.name}` })
  }

  function handlePdf() {
    printToPdf()
    toast({
      title: 'Print dialog opened',
      description: 'Choose "Save as PDF" as the destination.',
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export current market</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCsv} className="gap-2">
          <FileDown className="h-4 w-4" />
          Download CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePdf} className="gap-2">
          <FileText className="h-4 w-4" />
          Print / Save as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
