import type { TransactionType } from "~/datatypes/transaction";
import type { PortfolioType } from "~/datatypes/portfolio";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { use, useState } from "react";
import { Input } from "./ui/input";
import MultipleSelector, { type Option } from "./ui/multiselect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { getRndInteger } from "~/lib/utils";
import { Label } from "./ui/label";
import type { CurrencyType } from "~/datatypes/currency";
import { DatePicker } from "./ui/datePicker";
import { convertCurrencyToIcon } from "~/lib/iconHelper";
import { Switch } from "./ui/switch";
import { Input as InputWithIcon } from "./ui/input-with-icon";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";
import { userPortfolios } from "~/stateManagement/portfolioContext";

type TransactionCreationProps = {
  open: boolean;
  openChange: (open: boolean) => void;
  onCreate: (t: TransactionType) => void;
  portfolios: PortfolioType[];
  currencies: CurrencyType[];
  selectedPortfolioId?: number;
};

type MultipleSelectorOption = {
  value: string;
  label: string;
  disable?: boolean;
  fixed?: boolean;
};

export function TransactionCreation(props: TransactionCreationProps) {
  // Get portfolios from context to find the selected one
  const contextPortfolios = userPortfolios();
  
  // Filter portfolios to exclude those with negative IDs
  const validPortfolios = props.portfolios.filter((portfolio) => portfolio.id >= 0);
  
  // Find the selected portfolio from context, fallback to props or first valid portfolio
  const selectedPortfolioFromContext = contextPortfolios.find((p: PortfolioType) => p.selected === true);
  const initialPortfolioId = selectedPortfolioFromContext?.id || props.selectedPortfolioId || validPortfolios[0]?.id || 0;
  
  const [portfolioId, setPortfolioId] = useState(initialPortfolioId);
  const [targetPortfolioId, setTargetPortfolioId] = useState(initialPortfolioId);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState("10:30:00");
  const [type, setType] = useState<
    "Buy" | "Sell" | "Dividend" | "Deposit" | "Withdraw"
  >("Buy");
  const [asset, setAsset] = useState<Option>({} as Option);
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [commission, setCommission] = useState(0);
  const [tax, setTax] = useState(0);
  const [recurrencePeriod, setRecurrencePeriod] = useState<
    "Day" | "Week" | "Month" | "Quarter"
  >("Month");
  const [recurrenceTime, setRecurrenceTime] = useState("10:00");
  const [tags, setTags] = useState<MultipleSelectorOption[]>([]);
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState(props.currencies[0] || null);
  const [amount, setAmount] = useState(0);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [showCustomCurrency, setShowCustomCurrency] = useState(false);
  const [showDifferentPortfolio, setShowDifferentPortfolio] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [emptyText, setEmptyText] = useState("No results found");

  // TanStack Query for asset search
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["assetSearch", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const resp = await fetch("/searchSymbol?q=" + searchQuery);
      if (!resp.ok) {
        throw new Error("Failed to fetch search results: " + resp.statusText);
      }
      const data = await resp.json();
      return data.quotes
        .filter((quote: any) => {
          return quote.isYahooFinance;
        })
        .map((quote: any) => {
          return {
            value: quote.symbol || "",
            label: `${quote.shortname || quote.longname} (${quote.symbol})`,
            disable: false,
            fixed: false,
            isFetched: true,
          } as Option;
        });
    },
    enabled: !!searchQuery,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleCreate = () => {
    if (!portfolioId) {
      document.getElementById("portfolio-error")!.hidden = false;
      return;
    }
    if (type !== "Deposit" && type !== "Withdraw" && !asset.value.trim()) {
      document.getElementById("asset-error")!.hidden = false;
      return;
    }

    // Combine date and time into epoch timestamp
    const dateString = date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
    const dateTimeString = `${dateString}T${time}`;
    const epochTimestamp = new Date(dateTimeString).getTime().toString();

    props.onCreate({
      id: getRndInteger(1, 9999),
      portfolioId,
      targetPortfolioId: showDifferentPortfolio
        ? targetPortfolioId
        : portfolioId,
      date: epochTimestamp,
      type,
      asset: { symbol: asset.value, isFetchedFromApi: asset.isFetched },
      quantity,
      price,
      commision: commission,
      tax,
      amount,
      recurrence:
        showRecurrence && recurrencePeriod && recurrenceTime
          ? (() => {
              const [hours, minutes] = recurrenceTime.split(':').map(Number);
              return `${minutes} ${hours} * * ${
                recurrencePeriod === "Day"
                  ? "*"
                  : recurrencePeriod === "Week"
                  ? "0"
                  : recurrencePeriod === "Month"
                  ? "1"
                  : "1/3"
              }`;
            })()
          : undefined,
      tags: tags.map((tag) => tag.value).join(","),
      notes: notes,
    } as TransactionType);
    // fetch asset data for caching
    useQuery({
      queryKey: ["assetFetch", asset.value],
      queryFn: async () => {
         const res = await fetch("/fetchAssetChart?q=" + asset.value);
        if (!res.ok) {
          throw new Error("Failed to fetch asset data: " + res.statusText);
        }
      },
      enabled: !!asset.value,
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
    // Reset form
    setPortfolioId(initialPortfolioId);
    setTargetPortfolioId(initialPortfolioId);
    setDate(new Date());
    setTime("10:30:00");
    setType("Buy");
    setAsset({} as Option);
    setQuantity(0);
    setPrice(0);
    setCommission(0);
    setTax(0);
    setRecurrencePeriod("Month");
    setRecurrenceTime("10:00");
    setTags([]);
    setNotes("");
    setAmount(0);
  };

  return (
    <>
      <Dialog open={props.open} onOpenChange={props.openChange}>
        <DialogContent className="max-w-2xl overflow-y-scroll max-h-screen">
          <DialogHeader>
            <DialogTitle>Create a new transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <Label htmlFor="portfolio-select">Select Portfolio</Label>
            <Select
              key="portfolio-select"
              value={portfolioId.toString()}
              onValueChange={(value) => {
                setPortfolioId(parseInt(value));
                document.getElementById("portfolio-error")!.hidden = true;
              }}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Portfolio">
                  {validPortfolios.find((p) => p.id === portfolioId)?.name ||
                    "Select Portfolio"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {validPortfolios.map((portfolio) => (
                  <SelectItem
                    key={portfolio.id}
                    value={portfolio.id.toString()}
                  >
                    {portfolio.name} ({portfolio.currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div id="portfolio-error" className="text-red-400" hidden>
              Please select a portfolio.
            </div>

            <Label htmlFor="date-input">Transaction Date & Time</Label>
            <div className="flex gap-4">
              <DatePicker 
                key="date-input"
                value={date}
                onChange={(selectedDate) => {
                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
              />
              <div className="flex flex-col gap-3">
                <Input
                  type="time"
                  id="time"
                  step="1"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
            </div>

            <Label htmlFor="type-select">Transaction Type</Label>
            <Select
              key="type-select"
              value={type}
              onValueChange={(value) =>
                setType(
                  value as "Buy" | "Sell" | "Dividend" | "Deposit" | "Withdraw"
                )
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type">{type}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Buy">Buy</SelectItem>
                <SelectItem value="Sell">Sell</SelectItem>
                <SelectItem value="Dividend">Dividend</SelectItem>
                <SelectItem value="Deposit">Deposit</SelectItem>
                <SelectItem value="Withdraw">Withdraw</SelectItem>
              </SelectContent>
            </Select>

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
                  className="max-w-sm"
                />
              </div>
            ) : (
              <div className="space-y-4 border rounded-lg p-4">
                <h3 className="text-sm font-medium">Transaction Details</h3>

                {/* Asset Field */}
                <div className="space-y-4">
                  <Label htmlFor="asset-selector">Asset</Label>
                  <MultipleSelector
                    options={searchResults}
                    creatable
                    hideClearAllButton
                    placeholder="Search for an asset..."
                    onChange={(selected) => {
                      if (selected.length > 0) {
                        setAsset(selected[0]);
                        document.getElementById("asset-error")!.hidden = true;
                      }
                    }}
                    maxSelected={1}
                    onMaxSelected={(maxLimit) => {
                      document.getElementById("asset-error")!.hidden =
                        maxLimit > 0;
                      setEmptyText(
                        "You can only select one asset per transaction."
                      );
                      toast.info(
                        "You can only select one asset per transaction."
                      );
                    }}
                    inputProps={{
                      onValueChange: (e) => {
                        setSearchQuery(e);
                        if (e.trim() === "") {
                          setAsset({} as Option);
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
                        {emptyText}
                      </p>
                    }
                  />
                  <div id="asset-error" className="text-red-400" hidden>
                    Please select an asset.
                  </div>
                </div>

                {/* Currency Selection within Transaction Details */}
                <div className="flex items-center gap-2">
                  <Switch
                    id="custom-currency-switch"
                    checked={showCustomCurrency}
                    onCheckedChange={setShowCustomCurrency}
                  />
                  <Label htmlFor="custom-currency-switch">
                    Use other currency than portfolio's default
                  </Label>
                </div>

                {showCustomCurrency && (
                  <>
                    <Label htmlFor="currency-select">Currency</Label>
                    <Select
                      key="currency-select"
                      value={currency?.code || ""}
                      onValueChange={(value) => {
                        const selectedCurrency = props.currencies.find(
                          (c) => c.code === value
                        );
                        if (selectedCurrency) setCurrency(selectedCurrency);
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Currency">
                          {currency?.name || "Select Currency"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {props.currencies.map((curr) => (
                          <SelectItem key={curr.id} value={curr.code}>
                            {curr.name} ({curr.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity-input">Quantity</Label>
                    <Input
                      id="quantity-input"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(parseFloat(e.target.value) || 0)
                      }
                      className="max-w-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price-input">Price per Unit</Label>
                    <InputWithIcon
                      id="price-input"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) =>
                        setPrice(parseFloat(e.target.value) || 0)
                      }
                      startIcon={convertCurrencyToIcon(currency?.code || "USD")}
                      className="max-w-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission-input">Commission</Label>

                    <InputWithIcon
                      id="commission-input"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={commission}
                      onChange={(e) =>
                        setCommission(parseFloat(e.target.value) || 0)
                      }
                      startIcon={convertCurrencyToIcon(currency?.code || "USD")}
                      className="max-w-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-input">Tax</Label>

                    <InputWithIcon
                      id="tax-input"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={tax}
                      onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                      startIcon={convertCurrencyToIcon(currency?.code || "USD")}
                      className="max-w-sm"
                    />
                  </div>
                </div>

                {/* Different Portfolio Switch */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="different-portfolio-switch"
                      checked={showDifferentPortfolio}
                      onCheckedChange={setShowDifferentPortfolio}
                    />
                    <Label htmlFor="different-portfolio-switch">
                      Update balance of different portfolio
                    </Label>
                  </div>

                  {showDifferentPortfolio && (
                    <>
                      {/* <Label htmlFor="portfolio-select-source-target">
                      {type === "Sell" || type === "Dividend"
                        ? "Add amount to this portfolio's cash balance"
                        : "Deduce amount from this portfolio's cash balance"}
                    </Label> */}
                      <Select
                        key="portfolio-select-source-target"
                        value={targetPortfolioId.toString()}
                        onValueChange={(value) => {
                          setTargetPortfolioId(parseInt(value));
                          document.getElementById("portfolio-error")!.hidden =
                            true;
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Portfolio">
                            {validPortfolios.find(
                              (p) => p.id === targetPortfolioId
                            )?.name || "Select Portfolio"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {validPortfolios.map((portfolio) => (
                            <SelectItem
                              key={portfolio.id}
                              value={portfolio.id.toString()}
                            >
                              {portfolio.name} ({portfolio.currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Notes Field */}
            <Label htmlFor="notes-input">Notes</Label>
            <Input
              id="notes-input"
              type="text"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <Label htmlFor="tags-select">Add Tags for your transaction</Label>
            <MultipleSelector
              key={"tags-select"}
              placeholder="Select Tags"
              maxSelected={5}
              creatable={true}
              defaultOptions={tags}
              onChange={(selected) => {
                setTags(
                  selected.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))
                );
              }}
            />

            {/* Recurrence Section */}
            <div className="flex items-center gap-2">
              <Switch
                id="recurrence-switch"
                checked={showRecurrence}
                onCheckedChange={setShowRecurrence}
              />
              <Label htmlFor="recurrence-switch">Recurring Transaction</Label>
            </div>

            {showRecurrence && (
              <>
                <div className="flex items-center gap-2">
                  <Label>Repeat transaction every</Label>
                  <Select
                    value={recurrencePeriod}
                    onValueChange={(value) =>
                      setRecurrencePeriod(
                        value as "Day" | "Week" | "Month" | "Quarter"
                      )
                    }
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
                    type="time"
                    value={recurrenceTime}
                    onChange={(e) => setRecurrenceTime(e.target.value)}
                    className="w-[120px]"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleCreate}>Create Transaction</Button>
            <Button
              onClick={() => props.openChange(false)}
              variant="destructive"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </>
  );
}
