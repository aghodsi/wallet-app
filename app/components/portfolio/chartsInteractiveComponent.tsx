"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine, Line } from "recharts"

import { useIsMobile } from "~/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "~/components/ui/toggle-group"

export const description = "An interactive area chart"

interface ChartDataItem {
  date: string;
  performance: number;
  baseline: number;
  hasTransaction?: boolean;
  transactionType?: "buy" | "sell";
}

interface ChartAreaInteractiveProps {
  data?: ChartDataItem[];
  currency?: string;
  timeRange?: string;
}

const chartConfig = {
  performance: {
    label: "Performance",
    color: "var(--primary)",
  },
  baseline: {
    label: "Baseline",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ data = [], currency = "USD", timeRange = "1Y" }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()

  const filteredData = React.useMemo(() => {
    if (data.length === 0) return []

    const now = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case "1d":
        startDate.setDate(now.getDate() - 1)
        break
      case "1w":
        startDate.setDate(now.getDate() - 7)
        break
      case "1m":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "YTD":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case "1Y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "5Y":
        startDate.setFullYear(now.getFullYear() - 5)
        break
      case "ALL":
        return data
      default:
        startDate.setFullYear(now.getFullYear() - 1)
    }

return data.filter((item) => {
  const itemDate = new Date(item.date)
  const day = itemDate.getDay()
  const isWeekend = day === 0 || day === 6
  return itemDate >= startDate && !isWeekend
})
  }, [data, timeRange])

  // Calculate baseline based on selected period (cumulative investment at period start)
  const periodBaseline = React.useMemo(() => {
    if (filteredData.length === 0 || data.length === 0) return 0
    
    // If filtered data starts at the same time as full data, use the filtered start
    // Otherwise, if the period is longer than available data, use the earliest available data point
    const fullDataStart = data[0]?.date;
    const filteredDataStart = filteredData[0]?.date;
    
    if (fullDataStart === filteredDataStart) {
      // Period covers all available data, use the earliest baseline
      return data[0]?.baseline || 0;
    } else {
      // Period is within available data, use the period start baseline
      return filteredData[0]?.baseline || 0;
    }
  }, [filteredData, data])

  // Calculate current performance vs period baseline
  const currentPerformance = React.useMemo(() => {
    if (filteredData.length === 0) return 0
    // Use the most recent performance value
    return filteredData[filteredData.length - 1]?.performance || 0
  }, [filteredData])

  const isPerformanceAboveBaseline = currentPerformance > periodBaseline

  // Create segments with conditional fills
  const processedData = React.useMemo(() => {
    return filteredData.map(item => ({
      ...item,
      performance: item.performance,
      baseline: item.baseline,
      performanceAbove: item.performance > item.baseline ? item.performance : item.baseline,
      performanceBelow: item.performance <= item.baseline ? item.performance : item.baseline,
      transactionDot: item.hasTransaction ? item.performance : null,
    }))
  }, [filteredData])

  const timeRangeLabels = {
    "1d": "Last 1 day",
    "1w": "Last 1 week", 
    "1m": "Last 1 month",
    "YTD": "Year to date",
    "1Y": "Last 1 year",
    "5Y": "Last 5 years",
    "ALL": "All time"
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {timeRangeLabels[timeRange as keyof typeof timeRangeLabels]}
          </span>
          <span className="@[540px]/card:hidden">
            {timeRangeLabels[timeRange as keyof typeof timeRangeLabels]}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={processedData}>
            <defs>
              <linearGradient id="fillAbove" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#22c55e"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="#22c55e"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillBelow" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#ef4444"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="#ef4444"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                if (value >= 1000000) {
                  return `$${(value / 1000000).toFixed(1)}M`;
                } else if (value >= 1000) {
                  return `$${(value / 1000).toFixed(1)}K`;
                } else {
                  return `$${value.toFixed(0)}`;
                }
              }}
              label={{ 
                value: `Portfolio Value (${currency})`, 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '12px' }
              }}
              width={80}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <ReferenceLine
              y={periodBaseline}
              stroke="var(--color-baseline)"
              strokeDasharray="5 5"
              strokeOpacity={0.7}
            />
            <Area
              dataKey="performance"
              type="natural"
              fill={isPerformanceAboveBaseline ? "url(#fillAbove)" : "url(#fillBelow)"}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            <Area
              dataKey="transactionDot"
              type="natural"
              fill="transparent"
              stroke="transparent"
              strokeWidth={0}
              dot={{ fill: "#f97316", stroke: "#ffffff", strokeWidth: 2, r: 5, fillOpacity: 1 }}
              connectNulls={false}
            />
          </AreaChart>
        </ChartContainer>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-blue-500"></div>
            <span>Performance Line</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 ${isPerformanceAboveBaseline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Area Fill: {isPerformanceAboveBaseline ? 'Above' : 'Below'} Baseline Average For Selected Period</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 border-t-2 border-dashed border-muted-foreground"></div>
            <span>Baseline Reference</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-orange-500 border-2 border-white"></div>
            <span>Transaction Events</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
