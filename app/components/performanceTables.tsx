"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { AssetDetailSheet } from "~/components/assetDetailSheet"
import type { TransactionType } from "~/datatypes/transaction"
import type { AssetType } from "~/datatypes/asset"

interface PerformanceTablesProps {
  transactions: TransactionType[]
  assets: AssetType[]
  timeRange: string
  currency?: string
}

interface AssetPerformance {
  symbol: string
  asset: AssetType | undefined
  totalGainLoss: number
  totalGainLossPercent: number
  transactionCount: number
  currentValue: number
  totalInvested: number
}

export function PerformanceTables({ 
  transactions, 
  assets, 
  timeRange,
  currency = "USD" 
}: PerformanceTablesProps) {
  const [selectedAsset, setSelectedAsset] = useState<AssetType | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Calculate performance for each asset
  const assetPerformances = useMemo(() => {
    // Group transactions by asset symbol
    const assetGroups = transactions.reduce((acc, transaction) => {
      const symbol = transaction.asset.symbol
      if (!acc[symbol]) {
        acc[symbol] = []
      }
      acc[symbol].push(transaction)
      return acc
    }, {} as Record<string, TransactionType[]>)

    // Calculate performance for each asset
    const performances: AssetPerformance[] = Object.entries(assetGroups).map(([symbol, assetTransactions]) => {
      const asset = assets.find(a => a.symbol === symbol)
      
      // Calculate basic metrics
      const buyTransactions = assetTransactions.filter(t => t.type === "Buy")
      const sellTransactions = assetTransactions.filter(t => t.type === "Sell")
      const dividendTransactions = assetTransactions.filter(t => t.type === "Dividend")

      const totalShares = buyTransactions.reduce((sum, t) => sum + t.quantity, 0) - 
                         sellTransactions.reduce((sum, t) => sum + t.quantity, 0)
      
      const totalInvested = buyTransactions.reduce((sum, t) => sum + (t.quantity * t.price + t.commision + t.tax), 0)
      const totalReceived = sellTransactions.reduce((sum, t) => sum + (t.quantity * t.price - t.commision - t.tax), 0)
      const totalDividends = dividendTransactions.reduce((sum, t) => sum + (t.quantity * t.price), 0)

      // Current value based on latest price
      const currentPrice = asset?.quotes?.[asset.quotes.length - 1]?.close || 0
      const currentValue = totalShares * currentPrice

      // Total return calculation
      const totalReturn = currentValue + totalReceived + totalDividends - totalInvested
      const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

      return {
        symbol,
        asset,
        totalGainLoss: totalReturn,
        totalGainLossPercent: totalReturnPercent,
        transactionCount: assetTransactions.length,
        currentValue,
        totalInvested
      }
    })

    return performances.filter(p => p.transactionCount > 0) // Only include assets with transactions
  }, [transactions, assets])

  // Sort for top performers and worst performers
  const topPerformers = useMemo(() => {
    return [...assetPerformances]
      .sort((a, b) => b.totalGainLoss - a.totalGainLoss)
      .slice(0, 5)
  }, [assetPerformances])

  const worstPerformers = useMemo(() => {
    return [...assetPerformances]
      .sort((a, b) => a.totalGainLoss - b.totalGainLoss)
      .slice(0, 5)
  }, [assetPerformances])

  const handleAssetClick = (asset: AssetType | undefined) => {
    if (asset) {
      setSelectedAsset(asset)
      setSheetOpen(true)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-2">
        {/* Top Performers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 5 Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead className="text-right">Gain</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.length > 0 ? (
                  topPerformers.map((performance) => (
                    <TableRow 
                      key={performance.symbol} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleAssetClick(performance.asset)}
                    >
                      <TableCell>
                        <div className="text-left">
                          <div className="font-medium">{performance.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {performance.asset?.shortName || performance.asset?.longName || 'Unknown'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{performance.transactionCount}</TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${performance.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(performance.totalGainLoss)}
                        </div>
                        <div className={`text-sm ${performance.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(performance.totalGainLossPercent)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Worst Performers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bottom 5 Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead className="text-right">Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {worstPerformers.length > 0 ? (
                  worstPerformers.map((performance) => (
                    <TableRow 
                      key={performance.symbol} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleAssetClick(performance.asset)}
                    >
                      <TableCell>
                        <div className="text-left">
                          <div className="font-medium">{performance.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {performance.asset?.shortName || performance.asset?.longName || 'Unknown'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{performance.transactionCount}</TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${performance.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(performance.totalGainLoss)}
                        </div>
                        <div className={`text-sm ${performance.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(performance.totalGainLossPercent)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Asset Detail Sheet */}
      <AssetDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        asset={selectedAsset}
        transactions={transactions}
      />
    </>
  )
}
