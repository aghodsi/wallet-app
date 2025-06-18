"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "~/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "~/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { AssetType } from "~/datatypes/asset"
import type { TransactionType } from "~/datatypes/transaction"
import { getMarketStatus, isMarketOpen } from "~/lib/tradingHours"
import { Badge } from "~/components/ui/badge"

interface AssetDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: AssetType | null
  transactions: TransactionType[]
}

export function AssetDetailSheet({ 
  open, 
  onOpenChange, 
  asset, 
  transactions 
}: AssetDetailSheetProps) {
  const [timeRange, setTimeRange] = useState("1Y")

  // Filter transactions for this asset
  const assetTransactions = useMemo(() => {
    if (!asset) return []
    return transactions.filter(t => t.asset.symbol === asset.symbol)
  }, [asset, transactions])

  // Process chart data based on time range
  const chartData = useMemo(() => {
    if (!asset?.quotes || asset.quotes.length === 0) {
      console.log(`[AssetDetailSheet] No quotes available for asset: ${asset?.symbol}`)
      return []
    }

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
        startDate = new Date(0)
        break
      default:
        startDate.setFullYear(now.getFullYear() - 1)
    }

    console.log(`[AssetDetailSheet] Processing ${asset.symbol}, quotes: ${asset.quotes.length}, time range: ${timeRange}`)

    // Filter quotes within the date range
    const filteredQuotes = asset.quotes
      .filter(quote => {
        const quoteDate = new Date(parseInt(quote.date))
        return quoteDate >= startDate && !isNaN(quoteDate.getTime())
      })
      .sort((a, b) => parseInt(a.date) - parseInt(b.date))

    console.log(`[AssetDetailSheet] Filtered quotes: ${filteredQuotes.length}`)

    if (filteredQuotes.length === 0) {
      console.log(`[AssetDetailSheet] No quotes in time range for ${asset.symbol}`)
      return []
    }

    // Create dividend date map for easier lookup (date string -> amount)
    const dividendMap = new Map<string, number>()
    
    if (asset.events?.dividends && asset.events.dividends.length > 0) {
      console.log(`[AssetDetailSheet] Processing ${asset.events.dividends.length} dividends for ${asset.symbol}`)
      console.log(`[AssetDetailSheet] Raw dividends:`, asset.events.dividends)
      console.log(`[AssetDetailSheet] Start date for filtering:`, startDate.toISOString())
      
      asset.events.dividends.forEach((dividend, index) => {
        const rawTimestamp = parseInt(dividend.date)
        
        // Fix timestamp format: if timestamp appears to be in seconds (< 10 billion), convert to milliseconds
        const dividendTimestamp = rawTimestamp < 10000000000 ? rawTimestamp * 1000 : rawTimestamp
        const dividendDate = new Date(dividendTimestamp)
        
        console.log(`[AssetDetailSheet] Dividend ${index + 1}:`)
        console.log(`  - Raw date: ${dividend.date}`)
        console.log(`  - Raw timestamp: ${rawTimestamp}`)
        console.log(`  - Corrected timestamp: ${dividendTimestamp}`)
        console.log(`  - Converted date: ${dividendDate.toISOString()}`)
        console.log(`  - Amount: ${dividend.amount}`)
        console.log(`  - Valid date: ${!isNaN(dividendDate.getTime())}`)
        console.log(`  - Within range: ${dividendDate >= startDate}`)
        
        if (dividendDate >= startDate && !isNaN(dividendDate.getTime())) {
          const dividendDateKey = dividendDate.toISOString().split('T')[0] // YYYY-MM-DD
          dividendMap.set(dividendDateKey, dividend.amount)
          console.log(`[AssetDetailSheet] ✓ Added dividend: ${dividendDateKey} -> ${dividend.amount}`)
        } else {
          console.log(`[AssetDetailSheet] ✗ Skipped dividend: ${dividendDate.toISOString()} (before ${startDate.toISOString()} or invalid)`)
        }
      })
      
      console.log(`[AssetDetailSheet] Final dividend map:`, Array.from(dividendMap.entries()))
    } else {
      console.log(`[AssetDetailSheet] No dividends found in asset.events for ${asset.symbol}`)
      console.log(`[AssetDetailSheet] Asset events:`, asset.events)
    }

    // Create transaction maps for buy/sell transactions
    const buyTransactionMap = new Map<string, { price: number, quantity: number }>()
    const sellTransactionMap = new Map<string, { price: number, quantity: number }>()
    
    assetTransactions.forEach(transaction => {
      // Parse transaction date as epoch timestamp
      const transactionDate = new Date(parseInt(transaction.date))
      if (transactionDate >= startDate && !isNaN(transactionDate.getTime())) {
        const transactionDateKey = transactionDate.toISOString().split('T')[0] // YYYY-MM-DD
        
        if (transaction.type === "Buy") {
          buyTransactionMap.set(transactionDateKey, {
            price: transaction.price,
            quantity: transaction.quantity
          })
        } else if (transaction.type === "Sell") {
          sellTransactionMap.set(transactionDateKey, {
            price: transaction.price,
            quantity: transaction.quantity
          })
        }
      }
    })

    // For 1 day view, show all intraday data
    if (timeRange === "1d") {
      return filteredQuotes.map(quote => {
        const quoteDate = new Date(parseInt(quote.date))
        const quoteDateKey = quoteDate.toISOString().split('T')[0]
        const dividendAmount = dividendMap.get(quoteDateKey)
        const buyTransaction = buyTransactionMap.get(quoteDateKey)
        const sellTransaction = sellTransactionMap.get(quoteDateKey)
        const price = quote.close || quote.adjclose || 0
        
        return {
          date: quote.date,
          price,
          volume: quote.volume || 0,
          dividendDot: dividendAmount ? price : null,
          dividendAmount: dividendAmount || null,
          buyDot: buyTransaction ? buyTransaction.price : null,
          sellDot: sellTransaction ? sellTransaction.price : null,
          buyQuantity: buyTransaction?.quantity || null,
          sellQuantity: sellTransaction?.quantity || null
        }
      })
    }

    // For other time ranges, aggregate to daily data (last entry per day)
    const dailyData = new Map<string, any>()
    
    filteredQuotes.forEach((quote, index) => {
      const quoteDate = new Date(parseInt(quote.date))
      const dateKey = quoteDate.toISOString().split('T')[0] // YYYY-MM-DD
      const dividendAmount = dividendMap.get(dateKey)
      const buyTransaction = buyTransactionMap.get(dateKey)
      const sellTransaction = sellTransactionMap.get(dateKey)
      const price = quote.close || quote.adjclose || 0
      
      // Log first few quotes for debugging
      if (index < 3) {
        console.log(`[AssetDetailSheet] Quote ${index + 1}: ${quote.date} -> ${dateKey}, dividend: ${dividendAmount || 'none'}`)
      }
      
      // Keep the latest entry for each day
      const existingEntry = dailyData.get(dateKey)
      if (!existingEntry || parseInt(quote.date) > parseInt(existingEntry.date)) {
        dailyData.set(dateKey, {
          date: quote.date,
          price,
          volume: quote.volume || 0,
          dividendDot: dividendAmount ? price : null,
          dividendAmount: dividendAmount || null,
          buyDot: buyTransaction ? buyTransaction.price : null,
          sellDot: sellTransaction ? sellTransaction.price : null,
          buyQuantity: buyTransaction?.quantity || null,
          sellQuantity: sellTransaction?.quantity || null
        })
        
        // Log when we find a dividend match
        if (dividendAmount) {
          console.log(`[AssetDetailSheet] 🎯 Found dividend match! Date: ${dateKey}, Amount: ${dividendAmount}, Price: ${price}`)
        }
        
        // Log when we find transaction matches
        if (buyTransaction) {
          console.log(`[AssetDetailSheet] 🟢 Found buy transaction! Date: ${dateKey}, Price: ${buyTransaction.price}, Quantity: ${buyTransaction.quantity}`)
        }
        if (sellTransaction) {
          console.log(`[AssetDetailSheet] 🔴 Found sell transaction! Date: ${dateKey}, Price: ${sellTransaction.price}, Quantity: ${sellTransaction.quantity}`)
        }
      }
    })

    const finalData = Array.from(dailyData.values()).sort((a, b) => 
      parseInt(a.date) - parseInt(b.date)
    )
    
    console.log(`[AssetDetailSheet] Final chart data: ${finalData.length} points`)
    const dividendPoints = finalData.filter(d => d.dividendDot !== null)
    const buyPoints = finalData.filter(d => d.buyDot !== null)
    const sellPoints = finalData.filter(d => d.sellDot !== null)
    console.log(`[AssetDetailSheet] Dividend points: ${dividendPoints.length}`)
    console.log(`[AssetDetailSheet] Buy transaction points: ${buyPoints.length}`)
    console.log(`[AssetDetailSheet] Sell transaction points: ${sellPoints.length}`)
    
    return finalData
  }, [asset, timeRange])

  // Calculate Y-axis domain and formatting based on price range
  const yAxisConfig = useMemo(() => {
    if (chartData.length === 0) return { domain: ['auto', 'auto'], tickFormatter: (value: number) => `${asset?.currency || '$'}${value.toFixed(2)}`, width: 80 }

    const prices = chartData.map(d => d.price).filter(p => p > 0)
    if (prices.length === 0) return { domain: ['auto', 'auto'], tickFormatter: (value: number) => `${asset?.currency || '$'}${value.toFixed(2)}`, width: 80 }

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice
    const padding = priceRange * 0.05 // 5% padding

    // Determine appropriate number of decimal places based on price magnitude
    let decimalPlaces = 2
    if (maxPrice < 1) {
      decimalPlaces = 4
    } else if (maxPrice < 10) {
      decimalPlaces = 3
    } else if (maxPrice >= 1000) {
      decimalPlaces = 0
    }

    // Create smart formatter based on price range
    const tickFormatter = (value: number) => {
      const currency = asset?.currency || '$'
      
      if (value >= 1000000) {
        return `${currency}${(value / 1000000).toFixed(1)}M`
      } else if (value >= 1000) {
        return `${currency}${(value / 1000).toFixed(1)}K`
      } else if (value >= 100) {
        return `${currency}${value.toFixed(0)}`
      } else if (value >= 10) {
        return `${currency}${value.toFixed(1)}`
      } else if (value >= 1) {
        return `${currency}${value.toFixed(2)}`
      } else {
        return `${currency}${value.toFixed(4)}`
      }
    }

    // Calculate appropriate width based on formatted values
    const sampleValues = [minPrice, maxPrice, (minPrice + maxPrice) / 2]
    const maxFormattedLength = Math.max(...sampleValues.map(v => tickFormatter(v).length))
    const width = Math.max(80, Math.min(120, maxFormattedLength * 8 + 20))

    return {
      domain: [Math.max(0, minPrice - padding), maxPrice + padding] as [number, number],
      tickFormatter,
      width,
      tickCount: 6
    }
  }, [chartData, asset?.currency])

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (chartData.length === 0) return null

    const firstPrice = chartData[0]?.price || 0
    const lastPrice = chartData[chartData.length - 1]?.price || 0
    const change = lastPrice - firstPrice
    const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0

    return {
      firstPrice,
      lastPrice,
      change,
      changePercent
    }
  }, [chartData])

  // Calculate transaction summary
  const transactionSummary = useMemo(() => {
    const buyTransactions = assetTransactions.filter(t => t.type === "Buy")
    const sellTransactions = assetTransactions.filter(t => t.type === "Sell")
    const dividendTransactions = assetTransactions.filter(t => t.type === "Dividend")

    const totalShares = buyTransactions.reduce((sum, t) => sum + t.quantity, 0) - 
                       sellTransactions.reduce((sum, t) => sum + t.quantity, 0)
    
    const totalInvested = buyTransactions.reduce((sum, t) => sum + (t.quantity * t.price + t.commision + t.tax), 0)
    const totalReceived = sellTransactions.reduce((sum, t) => sum + (t.quantity * t.price - t.commision - t.tax), 0)
    const totalDividends = dividendTransactions.reduce((sum, t) => sum + (t.quantity * t.price), 0)

    // Calculate average buying price (weighted by quantity)
    const totalBuyQuantity = buyTransactions.reduce((sum, t) => sum + t.quantity, 0)
    const totalBuyValue = buyTransactions.reduce((sum, t) => sum + (t.quantity * t.price), 0)
    const averageBuyPrice = totalBuyQuantity > 0 ? totalBuyValue / totalBuyQuantity : 0

    // Calculate average selling price (weighted by quantity)
    const totalSellQuantity = sellTransactions.reduce((sum, t) => sum + t.quantity, 0)
    const totalSellValue = sellTransactions.reduce((sum, t) => sum + (t.quantity * t.price), 0)
    const averageSellPrice = totalSellQuantity > 0 ? totalSellValue / totalSellQuantity : 0

    const currentValue = totalShares * (asset?.quotes?.[asset.quotes.length - 1]?.close || 0)
    const totalReturn = currentValue + totalReceived + totalDividends - totalInvested

    return {
      totalTransactions: assetTransactions.length,
      buyCount: buyTransactions.length,
      sellCount: sellTransactions.length,
      dividendCount: dividendTransactions.length,
      totalShares,
      totalInvested,
      totalReceived,
      totalDividends,
      currentValue,
      totalReturn,
      totalReturnPercent: totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0,
      averageBuyPrice,
      averageSellPrice
    }
  }, [assetTransactions, asset])

  const timeRangeLabels = {
    "1d": "Last 1 day",
    "1w": "Last 1 week", 
    "1m": "Last 1 month",
    "YTD": "Year to date",
    "1Y": "Last 1 year",
    "5Y": "Last 5 years",
    "ALL": "All time"
  }

  // Get market status for this asset
  const marketStatus = useMemo(() => {
    if (!asset) return null
    
    const status = getMarketStatus(asset.exchangeName, asset.timezone)
    const isOpen = isMarketOpen(asset.exchangeName, asset.timezone)
    
    return {
      status,
      isOpen,
      exchange: asset.exchangeName,
      timezone: asset.exchangeTimezoneName || asset.timezone
    }
  }, [asset])

  if (!asset) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90vw] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader className="space-y-3">
          <SheetTitle className="text-2xl">{asset.longName}</SheetTitle>
          <SheetDescription className="text-base flex flex-row items-center justify-between gap-2">
            <span>{asset.symbol} • {asset.exchangeName} • {asset.currency}</span>
            {marketStatus && (
                <Badge 
                  variant={marketStatus.isOpen ? "default" : "secondary"}
                  className={`${marketStatus.isOpen ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-800 hover:bg-gray-200"} flex items-center text-xs font-medium flex items-center gap-2`}
                 >
                  <span className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? "bg-green-500" : "bg-gray-500"}`} />
                  {marketStatus.status}
                </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pt-8 pb-6 px-4 sm:px-6">
          {/* Time Range Controls */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground">
                Viewing data for: {timeRangeLabels[timeRange as keyof typeof timeRangeLabels]}
              </p>
              <div className="flex gap-2">
                <ToggleGroup
                  type="single"
                  value={timeRange}
                  onValueChange={setTimeRange}
                  variant="outline"
                  className="hidden *:data-[slot=toggle-group-item]:!px-3 sm:flex"
                >
                  <ToggleGroupItem value="1d">1D</ToggleGroupItem>
                  <ToggleGroupItem value="1w">1W</ToggleGroupItem>
                  <ToggleGroupItem value="1m">1M</ToggleGroupItem>
                  <ToggleGroupItem value="YTD">YTD</ToggleGroupItem>
                  <ToggleGroupItem value="1Y">1Y</ToggleGroupItem>
                  <ToggleGroupItem value="5Y">5Y</ToggleGroupItem>
                  <ToggleGroupItem value="ALL">ALL</ToggleGroupItem>
                </ToggleGroup>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger
                    className="flex w-40 sm:hidden"
                    size="sm"
                    aria-label="Select time range"
                  >
                    <SelectValue placeholder="Last 1 year" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="1d" className="rounded-lg">1 Day</SelectItem>
                    <SelectItem value="1w" className="rounded-lg">1 Week</SelectItem>
                    <SelectItem value="1m" className="rounded-lg">1 Month</SelectItem>
                    <SelectItem value="YTD" className="rounded-lg">Year to Date</SelectItem>
                    <SelectItem value="1Y" className="rounded-lg">1 Year</SelectItem>
                    <SelectItem value="5Y" className="rounded-lg">5 Years</SelectItem>
                    <SelectItem value="ALL" className="rounded-lg">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Price Performance</CardTitle>
              {performanceMetrics && (
                <CardDescription className="flex items-center gap-4">
                  <span>
                    Current: {asset.currency} {performanceMetrics.lastPrice.toFixed(2)}
                  </span>
                  <span className={performanceMetrics.change >= 0 ? "text-green-600" : "text-red-600"}>
                    {performanceMetrics.change >= 0 ? "+" : ""}{performanceMetrics.change.toFixed(2)} 
                    ({performanceMetrics.changePercent.toFixed(2)}%)
                  </span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              <ChartContainer
                config={{
                  price: {
                    label: "Price",
                    color: "#3b82f6",
                  },
                }}
                className="aspect-auto h-[250px] w-full"
              >
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#3b82f6"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="#3b82f6"
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
                      const date = new Date(parseInt(value))
                      if (timeRange === "1d") {
                        // For 1-day view, show hours
                        return date.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true
                        })
                      } else {
                        // For other ranges, show dates
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    domain={yAxisConfig.domain}
                    tickCount={yAxisConfig.tickCount}
                    tickFormatter={yAxisConfig.tickFormatter}
                    label={{ 
                      value: `Price (${asset.currency})`, 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fontSize: '12px' }
                    }}
                    width={yAxisConfig.width}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      
                      const data = payload[0]?.payload
                      const date = new Date(parseInt(label))
                      
                      const formattedDate = timeRange === "1d" 
                        ? date.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true
                          })
                        : date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })

                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-md">
                          <p className="text-sm font-medium">{formattedDate}</p>
                          {payload.map((entry, index) => {
                            if (entry.dataKey === "price") {
                              return (
                                <p key={index} className="text-sm" style={{ color: entry.color }}>
                                  Price: {asset.currency} {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                                </p>
                              )
                            }
                            if (entry.dataKey === "dividendDot" && data?.dividendAmount) {
                              return (
                                <p key={index} className="text-sm font-medium text-purple-600">
                                  Dividend: {asset.currency} {data.dividendAmount.toFixed(4)}
                                </p>
                              )
                            }
                            if (entry.dataKey === "buyDot" && data?.buyQuantity) {
                              return (
                                <p key={index} className="text-sm font-medium text-green-600">
                                  Buy: {data.buyQuantity} shares @ {asset.currency} {data.buyDot.toFixed(2)}
                                </p>
                              )
                            }
                            if (entry.dataKey === "sellDot" && data?.sellQuantity) {
                              return (
                                <p key={index} className="text-sm font-medium text-red-600">
                                  Sell: {data.sellQuantity} shares @ {asset.currency} {data.sellDot.toFixed(2)}
                                </p>
                              )
                            }
                            return null
                          })}
                        </div>
                      )
                    }}
                  />
                  <Area
                    dataKey="price"
                    type="natural"
                    fill="url(#fillPrice)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    dataKey="dividendDot"
                    type="natural"
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth={0}
                    dot={{ fill: "#9333ea", stroke: "#ffffff", strokeWidth: 2, r: 6, fillOpacity: 1 }}
                    connectNulls={false}
                  />
                  <Area
                    dataKey="buyDot"
                    type="natural"
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth={0}
                    dot={{ fill: "#16a34a", stroke: "#ffffff", strokeWidth: 2, r: 5, fillOpacity: 1 }}
                    connectNulls={false}
                  />
                  <Area
                    dataKey="sellDot"
                    type="natural"
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth={0}
                    dot={{ fill: "#dc2626", stroke: "#ffffff", strokeWidth: 2, r: 5, fillOpacity: 1 }}
                    connectNulls={false}
                  />
                </AreaChart>
              </ChartContainer>
              
              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-6 bg-blue-500"></div>
                  <span>Price Line</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-600 border-2 border-white"></div>
                  <span>Buy Transactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-600 border-2 border-white"></div>
                  <span>Sell Transactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-600 border-2 border-white"></div>
                  <span>Dividend Payments</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Summary</CardTitle>
              <CardDescription>Your trading activity for this asset</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{transactionSummary?.totalTransactions || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Holdings</p>
                  <p className="text-2xl font-bold">{transactionSummary?.totalShares.toFixed(2) || "0.00"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Invested</p>
                  <p className="text-2xl font-bold">
                    {asset.currency} {transactionSummary?.totalInvested.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Value</p>
                  <p className="text-2xl font-bold">
                    {asset.currency} {transactionSummary?.currentValue.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg. Buy Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    {transactionSummary?.averageBuyPrice ? 
                      `${asset.currency} ${transactionSummary.averageBuyPrice.toFixed(2)}` : 
                      "—"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg. Sell Price</p>
                  <p className="text-2xl font-bold text-red-600">
                    {transactionSummary?.averageSellPrice ? 
                      `${asset.currency} ${transactionSummary.averageSellPrice.toFixed(2)}` : 
                      "—"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total Return</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className={`text-2xl font-bold ${(transactionSummary?.totalReturn || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {asset.currency} {transactionSummary?.totalReturn.toFixed(2) || "0.00"}
                  </p>
                  <p className={`text-sm ${(transactionSummary?.totalReturnPercent || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {(transactionSummary?.totalReturnPercent || 0) >= 0 ? "+" : ""}{transactionSummary?.totalReturnPercent.toFixed(2) || "0.00"}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Asset Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span>{asset.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exchange:</span>
                    <span>{asset.exchangeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{asset.instrumentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{new Date(parseInt(asset.lastUpdated)).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground">Buy Orders</p>
                  <p className="text-xl font-bold text-green-600">{transactionSummary?.buyCount || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Sell Orders</p>
                  <p className="text-xl font-bold text-red-600">{transactionSummary?.sellCount || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Dividends</p>
                  <p className="text-xl font-bold text-blue-600">{transactionSummary?.dividendCount || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Total Dividends</p>
                  <p className="text-xl font-bold">
                    {asset.currency} {transactionSummary?.totalDividends.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
