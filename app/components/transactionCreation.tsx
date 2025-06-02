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
import { useState } from "react";
import { Input } from "./ui/input";
import MultipleSelector from "./ui/multiselect";
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
  const [portfolioId, setPortfolioId] = useState(
    props.selectedPortfolioId || props.portfolios[0]?.id || 0
  );
  const [targetPortfolioId, setTargetPortfolioId] = useState(
    props.selectedPortfolioId || props.portfolios[0]?.id || 0
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<
    "Buy" | "Sell" | "Dividend" | "Deposit" | "Withdraw"
  >("Buy");
  const [asset, setAsset] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [commission, setCommission] = useState(0);
  const [tax, setTax] = useState(0);
  const [recurrencePeriod, setRecurrencePeriod] = useState<
    "Day" | "Week" | "Month" | "Quarter"
  >("Month");
  const [recurrenceHour, setRecurrenceHour] = useState(0);
  const [tags, setTags] = useState<MultipleSelectorOption[]>([]);
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState(props.currencies[0] || null);
  const [amount, setAmount] = useState(0);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [showCustomCurrency, setShowCustomCurrency] = useState(false);
  const [showDifferentPortfolio, setShowDifferentPortfolio] = useState(false);

  const handleCreate = () => {
    if (!portfolioId) {
      document.getElementById("portfolio-error")!.hidden = false;
      return;
    }
    if (!asset.trim()) {
      document.getElementById("asset-error")!.hidden = false;
      return;
    }

    props.onCreate({
      id: getRndInteger(1, 9999),
      portfolioId,
      targetPortfolioId: showDifferentPortfolio ? targetPortfolioId : portfolioId,
      date,
      type,
      asset,
      quantity,
      price,
      commision: commission,
      tax,
      amount,
      recurrence:
        showRecurrence && recurrencePeriod && recurrenceHour !== undefined
          ? `0 ${recurrenceHour} * * ${
              recurrencePeriod === "Day"
                ? "*"
                : recurrencePeriod === "Week"
                ? "0"
                : recurrencePeriod === "Month"
                ? "1"
                : "1/3"
            }`
          : undefined,
      tags: tags.map((tag) => tag.value).join(","),
      notes: notes,
    } as TransactionType);

    // Reset form
    setPortfolioId(props.selectedPortfolioId || props.portfolios[0]?.id || 0);
    setTargetPortfolioId(props.selectedPortfolioId || props.portfolios[0]?.id || 0);
    setDate(new Date().toISOString().split("T")[0]);
    setType("Buy");
    setAsset("");
    setQuantity(0);
    setPrice(0);
    setCommission(0);
    setTax(0);
    setRecurrencePeriod("Month");
    setRecurrenceHour(0);
    setTags([]);
    setNotes("");
    setAmount(0);
  };

  return (
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
                {props.portfolios.find((p) => p.id === portfolioId)?.name ||
                  "Select Portfolio"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {props.portfolios.map((portfolio) => (
                <SelectItem key={portfolio.id} value={portfolio.id.toString()}>
                  {portfolio.name} ({portfolio.currency.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div id="portfolio-error" className="text-red-400" hidden>
            Please select a portfolio.
          </div>

          <Label htmlFor="date-input">Transaction Date</Label>
          <DatePicker key="date-input" />

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
                <Label htmlFor="asset-input">Asset</Label>
                <Input
                  id="asset-input"
                  type="text"
                  placeholder="Asset name (e.g., AAPL, BTC, etc.)"
                  value={asset}
                  onChange={(e) => {
                    setAsset(e.target.value);
                    document.getElementById("asset-error")!.hidden = true;
                  }}
                  required
                />
                <div id="asset-error" className="text-red-400" hidden>
                  Please enter an asset name.
                </div>
              </div>
              
              {/* Currency Selection within Transaction Details */}
              <div className="flex items-center gap-2">
                <Switch
                  id="custom-currency-switch"
                  checked={showCustomCurrency}
                  onCheckedChange={setShowCustomCurrency}
                />
                <Label htmlFor="custom-currency-switch">Use other currency than portfolio's default</Label>
              </div>
              
              {showCustomCurrency && (
                <>
                  <Label htmlFor="currency-select">Currency</Label>
                  <Select
                    key="currency-select"
                    value={currency?.code || ""}
                    onValueChange={(value) => {
                      const selectedCurrency = props.currencies.find(c => c.code === value);
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
                    step="0.000001"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} 
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
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
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
                    onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
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
                  <Label htmlFor="different-portfolio-switch">Update balance of different portfolio</Label>
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
                        document.getElementById("portfolio-error")!.hidden = true;
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Portfolio">
                          {props.portfolios.find((p) => p.id === targetPortfolioId)?.name ||
                            "Select Portfolio"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {props.portfolios.map((portfolio) => (
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
                  type="number"
                  min="0"
                  max="23"
                  value={recurrenceHour}
                  onChange={(e) => setRecurrenceHour(parseInt(e.target.value) || 0)}
                  className="w-[80px]"
                  placeholder="0"
                />
                <Label>hours</Label>
              </div>
            </>
          )}

          
        </div>
        <DialogFooter>
          <Button onClick={handleCreate}>Create Transaction</Button>
          <Button onClick={() => props.openChange(false)} variant="destructive">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
