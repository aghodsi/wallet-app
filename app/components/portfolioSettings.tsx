import type { PortfolioType } from "~/datatypes/portfolio";
import type { InstitutionType } from "~/datatypes/institution";
import type { CurrencyType } from "~/datatypes/currency";
import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { convertTextToIcon, getIcons } from "~/lib/iconHelper";
import MultipleSelector from "./ui/multiselect";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import { userPortfolios, usePortfolioDispatch } from "~/stateManagement/portfolioContext";
import { useDialogContext } from "~/contexts/transactionDialogContext";

type PortfolioSettingsProps = {
  institutions: InstitutionType[];
  currencies: CurrencyType[];
};

type MultipleSelectorOption = {
  value: string;
  label: string;
  disable?: boolean;
  fixed?: boolean;
};

export function PortfolioSettings({
  institutions,
  currencies,
}: PortfolioSettingsProps) {
  const contextPortfolios = userPortfolios();
  const portfolioDispatch = usePortfolioDispatch();
  const fetcher = useFetcher();
  const { openPortfolioDialog } = useDialogContext();
  
  // Find the currently selected portfolio from context
  const currentPortfolio = contextPortfolios.find(p => p.selected);
  
  // Check if there are any real portfolios (excluding "All" portfolio with id -1)
  const hasRealPortfolios = contextPortfolios.some(p => p.id !== -1);

  // State for form fields
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<CurrencyType>(currencies[0]);
  const [symbol, setSymbol] = useState("");
  const [institution, setInstitution] = useState<InstitutionType | null>(null);
  const [tags, setTags] = useState<MultipleSelectorOption[]>([]);
  const [type, setType] = useState<"Current" | "Saving" | "Investment">("Current");

  const icons = getIcons();

  // Update form when portfolio selection changes
  useEffect(() => {
    if (currentPortfolio) {
      setName(currentPortfolio.name);
      setCurrency(currentPortfolio.currency);
      setSymbol(currentPortfolio.symbol);
      setInstitution(currentPortfolio.institution);
      setType(currentPortfolio.type);
      setTags(currentPortfolio.tags ? 
        currentPortfolio.tags.split(",").map(tag => ({ value: tag, label: tag })) : 
        []
      );
    } else {
      // Reset form for "All" portfolio
      setName("");
      setCurrency(currencies[0]);
      setSymbol("");
      setInstitution(null);
      setTags([]);
      setType("Current");
    }
  }, [currentPortfolio, currencies]);

  const handleSave = () => {
    if (!currentPortfolio) {
      // For "All" portfolio, we might want to handle global settings differently
      toast.error("Cannot modify settings for 'All' portfolio view");
      return;
    }

    if (!institution) {
      toast.error("Please select an institution");
      return;
    }

    const portfolioData = {
      id: currentPortfolio.id,
      name,
      currency,
      symbol,
      type,
      institution,
      tags: tags.map((tag) => tag.value).join(","),
      selected: currentPortfolio.selected,
      createdAt: currentPortfolio.createdAt,
      cashBalance: currentPortfolio.cashBalance,
    };

    const formData = new FormData();
    formData.append("portfolio", JSON.stringify(portfolioData));
    formData.append("portfolioId", currentPortfolio.id.toString());

    fetcher.submit(formData, {
      method: "PUT",
      action: "/createPortfolio",
    });
  };

  // Handle fetcher response
  useEffect(() => {
    if (fetcher.data) {
      if (fetcher.data.ok) {
        toast.success("Portfolio settings updated successfully!");
        
        // Update the portfolio in context
        if (currentPortfolio && institution) {
          const updatedPortfolio: PortfolioType = {
            ...currentPortfolio,
            name,
            currency,
            symbol,
            type,
            institution,
            tags: tags.map((tag) => tag.value).join(","),
          };
          
          portfolioDispatch({
            type: "changed",
            portfolio: updatedPortfolio,
          });
        }
      } else {
        toast.error(fetcher.data.error || "Failed to update portfolio settings");
      }
    }
  }, [fetcher.data, currentPortfolio, institution, name, currency, symbol, type, tags, portfolioDispatch]);

  // Show disabled state when no real portfolios exist
  if (!hasRealPortfolios) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No Portfolios Available</h3>
              <p className="text-muted-foreground mb-4">
                You need to create at least one portfolio before you can access portfolio settings.
              </p>
              <Button 
                onClick={openPortfolioDialog}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Your First Portfolio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Special case for "All" portfolio (id === -1)
  if (!currentPortfolio || currentPortfolio.id === -1) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Global Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="global-currency-select">
                Default Currency for All Portfolios View
              </Label>
              <Select
                key="global-currency-select"
                value={currency.code}
                onValueChange={(value) => {
                  const selectedCurrency = currencies.find(
                    (c) => c.code === value
                  );
                  if (selectedCurrency) {
                    setCurrency(selectedCurrency);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Currency">
                    {currency ? `${currency.name} (${currency.symbol})` : "Select Currency"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.id} value={curr.code}>
                      {curr.name} ({curr.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              This setting affects the display currency when viewing all portfolios together. 
              Individual portfolio currencies remain unchanged.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>
            Settings for: {currentPortfolio?.name || "Unknown Portfolio"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="portfolio-name">Portfolio Name</Label>
            <Input
              id="portfolio-name"
              type="text"
              placeholder="Portfolio Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency-select">Portfolio Currency</Label>
            <Select
              key="currency-select"
              value={currency.code}
              onValueChange={(value) => {
                const selectedCurrency = currencies.find(
                  (c) => c.code === value
                );
                if (selectedCurrency) {
                  setCurrency(selectedCurrency);
                }
              }}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Currency">
                  {currency ? `${currency.name} (${currency.symbol})` : "Select Currency"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {currencies.map((curr) => (
                  <SelectItem key={curr.id} value={curr.code}>
                    {curr.name} ({curr.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio-type-select">Portfolio Type</Label>
            <Select
              key="portfolio-type-select"
              value={type}
              onValueChange={(value) =>
                setType(value as "Current" | "Saving" | "Investment")
              }
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Portfolio Type">
                  {type ? type : "Select Type"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Current">Current</SelectItem>
                <SelectItem value="Saving">Saving</SelectItem>
                <SelectItem value="Investment">Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Portfolio Icon</Label>
            <div className="grid grid-cols-6 gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
              {icons.map((icon) => (
                <Button
                  key={icon.name}
                  type="button"
                  onClick={() => setSymbol(icon.name)}
                  className="p-2 rounded-md border-2 transition-colors"
                  variant={symbol === icon.name ? "default" : "secondary"}
                >
                  {convertTextToIcon(icon.name, "size-4")}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution-select">Institution</Label>
            <MultipleSelector
              key="institution-select"
              placeholder="Select Institution"
              maxSelected={1}
              onMaxSelected={() => {
                toast.info("You can only select one institution for a portfolio.");
              }}
              creatable={true}
              defaultOptions={institutions.map((inst) => ({
                value: inst.id.toString(),
                label: inst.name,
              }))}
              value={
                institution
                  ? [
                      {
                        value: institution.id.toString(),
                        label: institution.name,
                      },
                    ]
                  : []
              }
              onChange={(selected) => {
                if (selected.length > 0) {
                  setInstitution(
                    institutions.find(
                      (inst) => inst.id.toString() === selected[0].value
                    ) || {
                      id: parseInt(selected[0].value) || Math.floor(Math.random() * 10000),
                      name: selected[0].label,
                      isDefault: false,
                      lastUpdated: new Date().toISOString(),
                      isNew: true,
                    }
                  );
                } else {
                  setInstitution(null);
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags-select">Tags</Label>
            <MultipleSelector
              key="tags-select"
              placeholder="Select Tags"
              maxSelected={3}
              creatable={true}
              defaultOptions={tags}
              value={tags}
              onChange={(selected) => {
                setTags(
                  selected.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))
                );
              }}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave} 
              disabled={fetcher.state === "submitting"}
            >
              {fetcher.state === "submitting" ? "Saving..." : "Save Changes"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                // Reset form to current portfolio values
                if (currentPortfolio) {
                  setName(currentPortfolio.name);
                  setCurrency(currentPortfolio.currency);
                  setSymbol(currentPortfolio.symbol);
                  setInstitution(currentPortfolio.institution);
                  setType(currentPortfolio.type);
                  setTags(currentPortfolio.tags ? 
                    currentPortfolio.tags.split(",").map(tag => ({ value: tag, label: tag })) : 
                    []
                  );
                }
              }}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
