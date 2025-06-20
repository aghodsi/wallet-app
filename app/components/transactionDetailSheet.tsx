"use client"

import * as React from "react"
import { useState, useEffect } from "react"
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
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { DatePicker } from "~/components/ui/datePicker"
import { Switch } from "~/components/ui/switch"
import { Input as InputWithIcon } from "~/components/ui/input-with-icon"
import MultipleSelector, { type Option } from "~/components/ui/multiselect"
import { convertCurrencyToIcon } from "~/lib/iconHelper"
import { useQuery } from "@tanstack/react-query"
import { useFetcher } from "react-router"
import { toast } from "sonner"
import { Toaster } from "~/components/ui/sonner"
import type { TransactionType } from "~/datatypes/transaction"
import type { PortfolioType } from "~/datatypes/portfolio"
import type { CurrencyType } from "~/datatypes/currency"
import { userPortfolios } from "~/stateManagement/portfolioContext"

interface TransactionDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: TransactionType | null
  mode: "edit" | "clone" | "view" | null
  portfolios: PortfolioType[]
  currencies: CurrencyType[]
}

type MultipleSelectorOption = {
  value: string;
  label: string;
  disable?: boolean;
  fixed?: boolean;
}

export function TransactionDetailSheet({ 
  open, 
  onOpenChange, 
  transaction, 
  mode,
  portfolios,
  currencies
}: TransactionDetailSheetProps) {
  const fetcher = useFetcher()
  
  // Filter portfolios to exclude those with negative IDs
  const validPortfolios = portfolios.filter((portfolio) => portfolio.id >= 0)
  
  // Form state
  const [portfolioId, setPortfolioId] = useState(0)
  const [targetPortfolioId, setTargetPortfolioId] = useState(0)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState("10:30:00")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!date) {
      setDate(new Date())
    }
  }, [date])
  const [type, setType] = useState<"Buy" | "Sell" | "Dividend" | "Deposit" | "Withdraw">("Buy")
  const [asset, setAsset] = useState<Option>({} as Option)
  const [quantity, setQuantity] = useState(0)
  const [price, setPrice] = useState(0)
  const [commission, setCommission] = useState(0)
  const [tax, setTax] = useState(0)
  const [amount, setAmount] = useState(0)
  const [recurrencePeriod, setRecurrencePeriod] = useState<"Day" | "Week" | "Month" | "Quarter">("Month")
  const [recurrenceHour, setRecurrenceHour] = useState(0)
  const [tags, setTags] = useState<MultipleSelectorOption[]>([])
  const [notes, setNotes] = useState("")
  const [currency, setCurrency] = useState(currencies[0] || null)
  const [showRecurrence, setShowRecurrence] = useState(false)
  const [showCustomCurrency, setShowCustomCurrency] = useState(false)
  const [showDifferentPortfolio, setShowDifferentPortfolio] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Asset search query
  const { data: searchResults } = useQuery({
    queryKey: ["assetSearch", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return []
      const resp = await fetch("/searchSymbol?q=" + searchQuery)
      if (!resp.ok) {
        throw new Error("Failed to fetch search results: " + resp.statusText)
      }
      const data = await resp.json()
      return data.quotes
        .filter((quote: any) => quote.isYahooFinance)
        .map((quote: any) => ({
          value: quote.symbol || "",
          label: `${quote.shortname || quote.longname} (${quote.symbol})`,
          disable: false,
          fixed: false,
          isFetched: true,
        } as Option))
    },
    enabled: !!searchQuery,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Handle fetcher responses
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.error) {
        const errorMessage = fetcher.data.error || "Unknown error occurred"
        toast.error(`Error: ${errorMessage}`)
      } else {
        if (mode === "edit") {
          toast.success("Transaction updated successfully!")
        } else if (mode === "clone") {
          toast.success("Transaction cloned successfully!")
        }
        onOpenChange(false)
        // Refresh the page to show updated data
        window.location.reload()
      }
    }
  }, [fetcher.state, fetcher.data, mode, onOpenChange])

  // Load transaction data when opening
  useEffect(() => {
    if (transaction && open) {
      setPortfolioId(transaction.portfolioId)
      setTargetPortfolioId(transaction.targetPortfolioId || transaction.portfolioId)
      
      // Parse date
      const transactionDate = new Date(parseInt(transaction.date))
      setDate(transactionDate)
      setTime(transactionDate.toTimeString().slice(0, 8))
      
      setType(transaction.type)
      setAsset({ 
        value: transaction.asset.symbol, 
        label: transaction.asset.symbol,
        isFetched: Boolean(transaction.asset.isFetchedFromApi)
      })
      setQuantity(transaction.quantity)
      setPrice(transaction.price)
      setCommission(transaction.commision)
      setTax(transaction.tax)
      
      // Parse tags
      if (transaction.tags) {
        const tagArray = transaction.tags.split(',').map(tag => ({
          value: tag.trim(),
          label: tag.trim()
        }))
        setTags(tagArray)
      }
      
      setNotes(transaction.notes || "")
      
      // Parse recurrence
      if (transaction.recurrence) {
        setShowRecurrence(true)
        // Simple parsing - could be enhanced
        const cronParts = transaction.recurrence.split(' ')
        if (cronParts.length >= 5) {
          setRecurrenceHour(parseInt(cronParts[1]) || 0)
          // Determine period based on cron pattern
          if (cronParts[4] === '*') setRecurrencePeriod('Day')
          else if (cronParts[4] === '0') setRecurrencePeriod('Week')
          else if (cronParts[4] === '1') setRecurrencePeriod('Month')
          else setRecurrencePeriod('Quarter')
        }
      } else {
        setShowRecurrence(false)
      }
      
      setShowDifferentPortfolio(transaction.targetPortfolioId !== transaction.portfolioId)
    }
  }, [transaction, open])

  const handleSave = () => {
    if (!transaction || !date) return

    // Combine date and time into epoch timestamp
    const dateString = date.toISOString().split('T')[0]
    const dateTimeString = `${dateString}T${time}`
    const epochTimestamp = new Date(dateTimeString).getTime().toString()

    const transactionData: Partial<TransactionType> = {
      portfolioId,
      targetPortfolioId: showDifferentPortfolio ? targetPortfolioId : portfolioId,
      date: epochTimestamp,
      type,
      asset: { symbol: asset.value, isFetchedFromApi: Boolean(asset.isFetched) },
      quantity,
      price,
      commision: commission,
      tax,
      recurrence: showRecurrence && recurrencePeriod && recurrenceHour !== undefined
        ? `0 ${recurrenceHour} * * ${
            recurrencePeriod === "Day" ? "*" :
            recurrencePeriod === "Week" ? "0" :
            recurrencePeriod === "Month" ? "1" : "1/3"
          }`
        : undefined,
      tags: tags.map((tag) => tag.value).join(","),
      notes: notes,
      // Set duplicateOf when cloning a transaction
      duplicateOf: mode === "clone" ? transaction.id : undefined,
    }

    const formData = new FormData()
    formData.append("transaction", JSON.stringify(transactionData))
    
    if (mode === "edit") {
      toast.info("Updating transaction...")
      fetcher.submit(formData, {
        method: "PUT",
        action: `/api/transactions/${transaction.id}`,
      })
    } else if (mode === "clone") {
      toast.info("Cloning transaction...")
      fetcher.submit(formData, {
        method: "POST",
        action: "/api/transactions",
      })
    }
  }

  if (!transaction) return null

  const isLoading = fetcher.state === "submitting"
  const isReadOnly = mode === "view"

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[90vw] sm:max-w-[600px] overflow-y-auto p-6">
          <SheetHeader className="space-y-3 px-2">
            <SheetTitle className="text-2xl">
              {mode === "edit" ? "Edit Transaction" : 
               mode === "clone" ? "Clone Transaction" : 
               "View Transaction"}
            </SheetTitle>
            <SheetDescription>
              {mode === "edit" 
                ? "Make changes to this transaction" 
                : mode === "clone"
                ? "Create a copy of this transaction"
                : "View transaction details"
              }
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 pt-6 px-2">
            {/* Portfolio Selection */}
            <div className="space-y-2">
              <Label htmlFor="portfolio-select">Portfolio</Label>
              <Select
                value={portfolioId.toString()}
                onValueChange={(value) => setPortfolioId(parseInt(value))}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue>
                    {validPortfolios.find((p) => p.id === portfolioId)?.name || "Select Portfolio"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {validPortfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                      {portfolio.name} ({portfolio.currency.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <div className="flex gap-4">
                <DatePicker 
                  value={date}
                  onChange={(selectedDate) => {
                    if (selectedDate) {
                      setDate(selectedDate)
                    }
                  }}
                  disabled={isReadOnly}
                />
                <Input
                  type="time"
                  step="1"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-32"
                  placeholder="HH:MM:SS"
                  title="Use 24-hour format (HH:MM:SS)"
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <Label htmlFor="type-select">Transaction Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as any)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue>{type}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buy">Buy</SelectItem>
                  <SelectItem value="Sell">Sell</SelectItem>
                  <SelectItem value="Dividend">Dividend</SelectItem>
                  <SelectItem value="Deposit">Deposit</SelectItem>
                  <SelectItem value="Withdraw">Withdraw</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Fields based on Transaction Type */}
            {type === "Deposit" || type === "Withdraw" ? (
              <div className="space-y-2">
                <Label htmlFor="amount-input">Amount</Label>
                <InputWithIcon
                  id="amount-input"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  startIcon={convertCurrencyToIcon(currency?.code || "USD")}
                  disabled={isReadOnly}
                />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Transaction Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Asset Field */}
                  <div className="space-y-2">
                    <Label>Asset</Label>
                    <MultipleSelector
                      options={searchResults}
                      creatable
                      hideClearAllButton
                      placeholder="Search for an asset..."
                      value={asset.value ? [asset] : []}
                      onChange={(selected) => {
                        if (selected.length > 0) {
                          setAsset(selected[0])
                        }
                      }}
                      maxSelected={1}
                      inputProps={{
                        onValueChange: (e) => {
                          setSearchQuery(e)
                          if (e.trim() === "") {
                            setAsset({} as Option)
                          }
                        },
                      }}
                      loadingIndicator={
                        <p className="py-2 text-center text-lg leading-10 text-muted-foreground">
                          Loading...
                        </p>
                      }
                      emptyIndicator={
                        <p className="w-full text-center text-lg leading-10 text-muted-foreground">
                          No results found
                        </p>
                      }
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* Quantity and Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity-input">Quantity</Label>
                      <Input
                        id="quantity-input"
                        type="number"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price-input">Price per Unit</Label>
                      <InputWithIcon
                        id="price-input"
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                        startIcon={convertCurrencyToIcon(currency?.code || "USD")}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>

                  {/* Commission and Tax */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="commission-input">Commission</Label>
                      <InputWithIcon
                        id="commission-input"
                        type="number"
                        step="0.01"
                        value={commission}
                        onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
                        startIcon={convertCurrencyToIcon(currency?.code || "USD")}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax-input">Tax</Label>
                      <InputWithIcon
                        id="tax-input"
                        type="number"
                        step="0.01"
                        value={tax}
                        onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                        startIcon={convertCurrencyToIcon(currency?.code || "USD")}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes-input">Notes</Label>
              <Input
                id="notes-input"
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isReadOnly}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <MultipleSelector
                placeholder="Select Tags"
                maxSelected={5}
                creatable={true}
                value={tags}
                onChange={(selected) => {
                  setTags(selected.map((option) => ({
                    value: option.value,
                    label: option.label,
                  })))
                }}
                disabled={isReadOnly}
              />
            </div>

            {/* Recurrence */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="recurrence-switch"
                  checked={showRecurrence}
                  onCheckedChange={setShowRecurrence}
                  disabled={isReadOnly}
                />
                <Label htmlFor="recurrence-switch">Recurring Transaction</Label>
              </div>

              {showRecurrence && (
                <div className="flex items-center gap-2">
                  <Label>Repeat every</Label>
                  <Select
                    value={recurrencePeriod}
                    onValueChange={(value) => setRecurrencePeriod(value as any)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue>{recurrencePeriod}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Day">Day</SelectItem>
                      <SelectItem value="Week">Week</SelectItem>
                      <SelectItem value="Month">Month</SelectItem>
                      <SelectItem value="Quarter">Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label>at</Label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={recurrenceHour}
                    onChange={(e) => setRecurrenceHour(parseInt(e.target.value) || 0)}
                    className="w-[80px]"
                    disabled={isReadOnly}
                  />
                  <Label>hours</Label>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {!isReadOnly && (
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Saving..." : mode === "edit" ? "Save Changes" : "Clone Transaction"}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className={isReadOnly ? "flex-1" : ""}
              >
                {isReadOnly ? "Close" : "Cancel"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <Toaster />
    </>
  )
}
