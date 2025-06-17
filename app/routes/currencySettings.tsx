import { fetchCurrencies } from "~/db/actions";
import type { CurrencyType } from "~/datatypes/currency";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Toaster } from "~/components/ui/sonner";

export function meta() {
  return [
    { title: "Currency Settings" },
    { name: "description", content: "Manage default currency and exchange rates" },
  ];
}

export async function loader() {
  const currencies = await fetchCurrencies();

  const currenciesWithType = currencies.map((c) => ({
    ...c,
    exchangeRate: c.exchangeRate || 1,
    isDefault: c.isDefault || false,
  })) as CurrencyType[];

  return {
    currencies: currenciesWithType,
  };
}

interface LoaderData {
  currencies: CurrencyType[];
}

interface ComponentProps {
  loaderData: LoaderData;
}

export default function CurrencySettings({ loaderData }: ComponentProps) {
  const { currencies } = loaderData;
  const [defaultCurrencyId, setDefaultCurrencyId] = useState<number>(
    currencies.find((c: CurrencyType) => c.isDefault)?.id || currencies[0]?.id || 1
  );
  const [exchangeRates, setExchangeRates] = useState<Record<number, number>>(() => {
    const rates: Record<number, number> = {};
    currencies.forEach((currency: CurrencyType) => {
      rates[currency.id] = currency.exchangeRate;
    });
    return rates;
  });

  const fetcher = useFetcher();

  // Handle fetcher responses
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.error) {
        const errorMessage = fetcher.data.error.message || "Unknown error occurred";
        toast.error(`Error: ${errorMessage}`);
      } else {
        if (fetcher.data.action === "setDefaultCurrency") {
          toast.success("Default currency updated successfully!");
        } else if (fetcher.data.action === "updateExchangeRates") {
          toast.success("Exchange rates updated successfully!");
        }
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleDefaultCurrencyChange = (currencyId: string) => {
    const id = parseInt(currencyId);
    setDefaultCurrencyId(id);
    
    const formData = new FormData();
    formData.append("action", "setDefaultCurrency");
    formData.append("currencyId", id.toString());
    
    fetcher.submit(formData, {
      method: "POST",
      action: "/api/currencies",
    });
  };

  const handleExchangeRateChange = (currencyId: number, rate: string) => {
    const numericRate = parseFloat(rate) || 0;
    setExchangeRates(prev => ({
      ...prev,
      [currencyId]: numericRate
    }));
  };

  const handleSaveExchangeRates = () => {
    const defaultCurrency = currencies.find((c: CurrencyType) => c.id === defaultCurrencyId);
    if (!defaultCurrency) {
      toast.error("Please select a default currency first");
      return;
    }

    // Build exchange rates array excluding the default currency
    const exchangeRatesArray = currencies
      .filter((currency: CurrencyType) => currency.id !== defaultCurrencyId)
      .map((currency: CurrencyType) => ({
        currencyId: currency.id,
        exchangeRate: exchangeRates[currency.id] || 1
      }));

    const formData = new FormData();
    formData.append("action", "updateExchangeRates");
    formData.append("exchangeRates", JSON.stringify(exchangeRatesArray));
    
    fetcher.submit(formData, {
      method: "POST",
      action: "/api/currencies",
    });
  };

  const defaultCurrency = currencies.find((c: CurrencyType) => c.id === defaultCurrencyId);
  const otherCurrencies = currencies.filter((c: CurrencyType) => c.id !== defaultCurrencyId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Currency Settings</h1>
        <p className="text-muted-foreground">
          Manage your default currency and exchange rates for currency conversion.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Default Currency Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Default Currency</CardTitle>
            <CardDescription>
              Select the base currency for your portfolio calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-currency">Base Currency</Label>
              <Select
                value={defaultCurrencyId.toString()}
                onValueChange={handleDefaultCurrencyChange}
              >
                <SelectTrigger id="default-currency">
                  <SelectValue placeholder="Select default currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency: CurrencyType) => (
                    <SelectItem key={currency.id} value={currency.id.toString()}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {defaultCurrency && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Current default: <span className="font-medium">{defaultCurrency.symbol} {defaultCurrency.code}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  All other currency rates will be relative to this base currency.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exchange Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Exchange Rates</CardTitle>
            <CardDescription>
              Set exchange rates relative to your base currency ({defaultCurrency?.code || 'N/A'})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {defaultCurrency && (
              <div className="space-y-4">
                {/* Base Currency Display */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{defaultCurrency.symbol}</div>
                    <div>
                      <div className="font-medium">{defaultCurrency.code}</div>
                      <div className="text-sm text-muted-foreground">{defaultCurrency.name}</div>
                    </div>
                  </div>
                  <div className="text-lg font-medium">1.00 (Base)</div>
                </div>

                <Separator />

                {/* Other Currencies */}
                {otherCurrencies.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Enter how many units of each currency equals 1 {defaultCurrency.code}
                    </div>
                    {otherCurrencies.map((currency: CurrencyType) => (
                      <div key={currency.id} className="flex items-center justify-between space-x-4">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="text-xl">{currency.symbol}</div>
                          <div>
                            <div className="font-medium">{currency.code}</div>
                            <div className="text-sm text-muted-foreground">{currency.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`rate-${currency.id}`} className="text-sm whitespace-nowrap">
                            1 {defaultCurrency.code} =
                          </Label>
                          <Input
                            id={`rate-${currency.id}`}
                            type="number"
                            step="0.000001"
                            min="0"
                            value={exchangeRates[currency.id] || ""}
                            onChange={(e) => handleExchangeRateChange(currency.id, e.target.value)}
                            className="w-32"
                            placeholder="0.00"
                          />
                          <span className="text-sm text-muted-foreground">{currency.code}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No other currencies available for exchange rate configuration.
                  </div>
                )}

                {otherCurrencies.length > 0 && (
                  <div className="pt-4">
                    <Button 
                      onClick={handleSaveExchangeRates} 
                      disabled={fetcher.state === "submitting"}
                      className="w-full"
                    >
                      {fetcher.state === "submitting" ? "Saving..." : "Save Exchange Rates"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Toaster />
    </div>
  );
}
