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
import { convertTextToIcon, getIcons } from "~/lib/iconHelper";
import MultipleSelector from "./ui/multiselect";
import type { InstitutionType } from "~/datatypes/institution";
import type { CurrencyType } from "~/datatypes/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { getRndInteger } from "~/lib/utils";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Toaster } from "./ui/sonner";

type PortfolioCreationProps = {
  open: boolean;
  openChange: (open: boolean) => void;
  onCreate: (p: PortfolioType) => void;
  institutions: InstitutionType[];
  currencies: CurrencyType[];
};

type MultipleSelectorOption = {
  value: string;
  label: string;
  disable?: boolean;
  fixed?: boolean;
};

export function PortfolioCreation(props: PortfolioCreationProps) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(
    props.currencies[0] || {
      id: 1,
      code: "USD",
      name: "US Dollar",
      symbol: "$",
      exchangeRate: 1,
      lastUpdated: new Date().getTime().toString(),
    }
  );
  const [symbol, setSymbol] = useState("");
  const [institution, setInstitution] = useState(props.institutions[0]);
  const [tags, setTags] = useState<MultipleSelectorOption[]>([]);
  const [type, setType] = useState<"Current" | "Saving" | "Investment">(
    "Current"
  );
  const [institutionError, setInstitutionError] = useState(false);

  const icons = getIcons(); // Get available icons

  const handleCreate = () => {
    if (!institution) {
      setInstitutionError(true);
      return;
    }
    props.onCreate({
      id: getRndInteger(1, 9999), // Generate a random ID for the new portfolio
      name,
      currency,
      symbol,
      type,
      institution,
      tags: tags.map((tag) => tag.value).join(","),
      selected: false,
      createdAt: new Date().getTime().toString(),
    } as PortfolioType);
    setName("");
    setCurrency(props.currencies[0] || currency);
    setSymbol("");
    setInstitution(props.institutions[0]);
    setTags([]);
    setType("Current");
  };

  return (
    <>
    <Dialog open={props.open} onOpenChange={props.openChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new portfolio</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
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
            <Label htmlFor="currency-select">
              Select the currency for your portfolio
            </Label>
            <Select
            key="currency-select"
            value={currency.code}
            onValueChange={(value) => {
              const selectedCurrency = props.currencies.find(
                (c) => c.code === value
              );
              if (selectedCurrency) {
                setCurrency(selectedCurrency);
              }
            }}
            required
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Currency">
                {currency ? currency.name : "Select Currency"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {props.currencies.map((currency) => (
                <SelectItem key={currency.id} value={currency.code}>
                  {currency.name} ({currency.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio-type-select">
              Select the type of your portfolio
            </Label>
            <Select
            key="portfolio-type-select"
            value={type}
            onValueChange={(value) =>
              setType(value as "Current" | "Saving" | "Investment")
            }
            required
          >
            <SelectTrigger className="w-[180px]">
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

          {/* Icon Selection Grid */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Icon</Label>
            <div className="grid grid-cols-6 gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
              {icons.map((icon) => (
                <Button
                  key={icon.name}
                  type="button"
                  onClick={() => setSymbol(icon.name)}
                  className={`p-2 rounded-md border-2 transition-colors `}
                  variant={symbol === icon.name ? "default" : "secondary"}
                >
                  {convertTextToIcon(icon.name, "size-4")}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="institution-select">
              Select institution which holds your portfolio
            </Label>
            <MultipleSelector
            key={"institution-select"}
            placeholder="Select Institution"
            maxSelected={1}
            onMaxSelected={() => {
              toast.info(
                "You can only select one institution for a portfolio."
              );
            }}
            creatable={true}
            defaultOptions={props.institutions.map((inst) => ({
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
              setInstitutionError(selected.length === 0);
              setInstitution(
                props.institutions.find(
                  (inst) => inst.id.toString() === selected[0].value
                ) || {
                  id: getRndInteger(1, 9999),
                  name: selected[0].label,
                  isDefault: false,
                  lastUpdated: new Date().toISOString(),
                  isNew: true,
                }
              );
            }}
          />
            {institutionError && (
              <div className="text-red-400">
                Please select an institution.
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags-select">Add Tags for your portfolio</Label>
            <MultipleSelector
              key={"tags-select"}
              placeholder="Select Tags"
              maxSelected={3}
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
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate}>Create</Button>
          <Button onClick={() => props.openChange(false)} variant="destructive">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Toaster />
    </>
  );
}

export function WarningComponent({ numberOfItems }: { numberOfItems: number }) {
  return (
    <div id="warning" className="text-yellow-500" hidden>
      You can only select {numberOfItems} institution.
    </div>
  );
}
