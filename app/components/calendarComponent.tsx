"use client"

import { Calendar } from "./ui/calendar"
import { useState, useEffect } from "react"
import * as React from "react"
import type { TransactionType } from "~/datatypes/transaction"
import type { AssetType } from "~/datatypes/asset"
import { DayButton } from "react-day-picker"
import type { ComponentProps } from "react"
import { Button } from "~/components/ui/button"
import { cn } from "~/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"

interface CalendarComponentProps {
  transactions?: TransactionType[];
  assets?: AssetType[];
  title?: string;
}

// Custom Day Component that shows dots for transactions and dividends
function CustomDayButton({ 
  day, 
  modifiers,
  className,
  transactions = [], 
  assets = [],
  ...props 
}: ComponentProps<typeof DayButton> & { 
  transactions: TransactionType[]; 
  assets: AssetType[] 
}) {
  const dayDate = day.date.toISOString().split('T')[0] // YYYY-MM-DD format
  
  // Find transactions for this day
  const dayTransactions = transactions.filter(transaction => {
    // Parse epoch timestamp - handle both string and number formats
    const timestamp = typeof transaction.date === 'string' ? parseInt(transaction.date) : transaction.date
    const transactionDate = new Date(timestamp).toISOString().split('T')[0]
    return transactionDate === dayDate
  })
  
  // Check for buy/sell transactions
  const hasBuy = dayTransactions.some(t => t.type === "Buy")
  const hasSell = dayTransactions.some(t => t.type === "Sell")
  
  // Check for dividend events on this day
  const hasDividend = dayTransactions.some(transaction => {
    const asset = assets.find(a => a.symbol === transaction.asset.symbol)
    if (!asset?.events?.dividends) return false
    
    return asset.events.dividends.some(dividend => {
      const dividendDate = new Date(parseInt(dividend.date)).toISOString().split('T')[0]
      return dividendDate === dayDate
    })
  })
  
  const hasAnyEvent = hasBuy || hasSell || hasDividend
  
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) items-center justify-center leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70 relative",
        className
      )}
      {...props}
    >
      {day.date.getDate()}
      {hasAnyEvent && (
        <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
          {hasBuy && (
            <div className="w-1 h-1 rounded-full bg-green-500" title="Buy transaction" />
          )}
          {hasSell && (
            <div className="w-1 h-1 rounded-full bg-red-500" title="Sell transaction" />
          )}
          {hasDividend && (
            <div className="w-1 h-1 rounded-full bg-purple-600" title="Dividend" />
          )}
        </div>
      )}
    </Button>
  )
}

export default function CalendarComponent({ 
  transactions = [], 
  assets = [],
  title
}: CalendarComponentProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDate(new Date())
  }, [])

  if (!mounted) {
    return (
      <Card className="w-full">
        {title && (
          <CardHeader className="text-center">
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          <div className="flex justify-center">
            <div className="w-full h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      {title && (
        <CardHeader className="text-center">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            defaultMonth={date}
            numberOfMonths={1}
            selected={date}
            onSelect={setDate}
            className="rounded-lg border shadow-sm w-full"
            components={{
              DayButton: (props) => (
                <CustomDayButton 
                  {...props} 
                  transactions={transactions} 
                  assets={assets} 
                />
              )
            }}
          />
        </div>
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Buy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Sell</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-600"></div>
            <span>Dividend</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
