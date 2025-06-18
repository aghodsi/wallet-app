import * as React from "react";
import {
  Plus,
  Wallet,
  TrendingUp,
  Coins,
  ArrowUpDown,
  Settings,
  Currency,
  Clock,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import { useEffect, useState } from "react";
import { useIsMac } from "~/hooks/useIsMac";
import { Button } from "./ui/button";
import { userPortfolios } from "~/stateManagement/portfolioContext";
import { useTransactions } from "~/hooks/useTransactions";
import { useNavigate } from "react-router";
import { useDialogContext } from "~/contexts/transactionDialogContext";
import { useTheme } from "~/components/theme-provider";
import { formatDate } from "~/lib/dateUtils";
import { AssetDetailSheet } from "~/components/assetDetailSheet";
import type { AssetType } from "~/datatypes/asset";
import { useQuery } from "@tanstack/react-query";

export function SearchComponent() {
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetType | null>(null);
  const [isAssetSheetOpen, setIsAssetSheetOpen] = useState(false);
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>("");
  const isMac = useIsMac();
  const navigate = useNavigate();
  const { openTransactionDialog, openPortfolioDialog } = useDialogContext();
  const { setTheme } = useTheme();
  const portfolios = userPortfolios();
  
  // Check if there are any real portfolios (excluding "All" portfolio with id -1)
  const hasRealPortfolios = portfolios.some(p => p.id !== -1);
  
  // Use useTransactions hook with portfolioId -1 to get all transactions
  const { data: transactions, isLoading: isTransactionsLoading } = useTransactions(-1);

  // Fetch asset data when an asset is selected
  const { data: assetData, isLoading: isAssetLoading } = useQuery({
    queryKey: ["assetFetch", selectedAssetSymbol],
    queryFn: async () => {
      if (!selectedAssetSymbol) return null;
      const res = await fetch("/fetchAssetChart?q=" + selectedAssetSymbol);
      if (!res.ok) {
        throw new Error(`Error fetching asset data for ${selectedAssetSymbol}: ${res.statusText}`);
      }
      const resJson = await res.json();
      return resJson as AssetType;
    },
    enabled: !!selectedAssetSymbol,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Update selectedAsset when assetData changes
  React.useEffect(() => {
    if (assetData) {
      setSelectedAsset(assetData);
      setIsAssetSheetOpen(true);
    }
  }, [assetData]);

  // Extract unique assets from transactions
  const assets = React.useMemo(() => {
    if (!transactions) return [];
    const uniqueAssets = new Set<string>();
    transactions.forEach(transaction => {
      // Handle both string and object asset formats
      const assetSymbol = typeof transaction.asset === 'string' 
        ? transaction.asset 
        : transaction.asset?.symbol;
      if (assetSymbol) {
        uniqueAssets.add(assetSymbol);
      }
    });
    return Array.from(uniqueAssets);
  }, [transactions]);

  const handleAction = (action: string) => {
    setOpen(false);
    switch (action) {
      case 'create-portfolio':
        openPortfolioDialog();
        break;
      case 'create-transaction':
        openTransactionDialog();
        break;
      default:
        break;
    }
  };

  const handlePortfolioSelect = (portfolioId: number) => {
    setOpen(false);
    navigate(`/portfolio?id=${portfolioId}`);
  };

  const handleTransactionSelect = (transactionId: number) => {
    setOpen(false);
    navigate(`/transactions?id=${transactionId}`);
  };

  const handleAssetSelect = (assetSymbol: string) => {
    setOpen(false);
    setSelectedAssetSymbol(assetSymbol);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button variant="outline" className="flex items-center justify-between w-full hover:bg-accent hover:text-accent-foreground" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-2">
          <span>Search...</span>
        </div>
        <div className="hidden gap-1 sm:flex">
          <kbd className="bg-background text-muted-foreground pointer-events-none flex h-5 items-center justify-center gap-1 rounded border px-1 font-sans text-[0.7rem] font-medium select-none [&amp;_svg:not([class*='size-'])]:size-3">
            {isMac ? "⌘" : "Ctrl"}
          </kbd>
          <kbd className="bg-background text-muted-foreground pointer-events-none flex h-5 items-center justify-center gap-1 rounded border px-1 font-sans text-[0.7rem] font-medium select-none [&amp;_svg:not([class*='size-'])]:size-3 aspect-square">
            K
          </kbd>
        </div>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search portfolios, transactions, assets..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {/* Actions Section */}
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => handleAction('create-portfolio')}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Create Portfolio</span>
            </CommandItem>
            <CommandItem 
              onSelect={hasRealPortfolios ? () => handleAction('create-transaction') : undefined}
              disabled={!hasRealPortfolios}
            >
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <span>Create Transaction</span>
              {!hasRealPortfolios && (
                <div className="ml-auto text-xs text-muted-foreground">Requires portfolio</div>
              )}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Portfolios Section */}
          <CommandGroup heading="Portfolios">
            {portfolios.length > 0 ? (
              portfolios.map((portfolio) => (
                <CommandItem 
                  key={portfolio.id} 
                  onSelect={() => handlePortfolioSelect(portfolio.id)}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>{portfolio.name}</span>
                  <div className="ml-auto text-xs text-muted-foreground">
                    {portfolio.currency.code}
                  </div>
                </CommandItem>
              ))
            ) : (
              <CommandItem disabled>
                <span className="text-muted-foreground">No portfolios found</span>
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* Transactions Section */}
          <CommandGroup heading="Transactions">
            {isTransactionsLoading ? (
              <CommandItem disabled>
                <span className="text-muted-foreground">Loading transactions...</span>
              </CommandItem>
            ) : transactions && transactions.length > 0 ? (
              transactions.slice(0, 10).map((transaction) => (
                <CommandItem 
                  key={transaction.id} 
                  onSelect={() => handleTransactionSelect(transaction.id)}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>{transaction.type} {typeof transaction.asset === 'string' ? transaction.asset : transaction.asset?.symbol}</span>
                  <div className="ml-auto text-xs text-muted-foreground">
                    {formatDate(parseInt(transaction.date))}
                  </div>
                </CommandItem>
              ))
            ) : (
              <CommandItem disabled>
                <span className="text-muted-foreground">No transactions found</span>
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* Assets Section */}
          <CommandGroup heading="Assets">
            {assets.length > 0 ? (
              assets.map((asset) => (
                <CommandItem 
                  key={asset} 
                  onSelect={() => handleAssetSelect(asset)}
                >
                  <Coins className="mr-2 h-4 w-4" />
                  <span>{asset}</span>
                  {isAssetLoading && selectedAssetSymbol === asset && (
                    <div className="ml-auto text-xs text-muted-foreground">Loading...</div>
                  )}
                </CommandItem>
              ))
            ) : (
              <CommandItem disabled>
                <span className="text-muted-foreground">No assets found</span>
              </CommandItem>
            )}
          </CommandGroup>

          <CommandSeparator />

          {/* Configuration Section */}
          <CommandGroup heading="Configuration">
            <CommandItem 
              onSelect={hasRealPortfolios ? () => {
                setOpen(false);
                navigate('/portfolio-settings');
              } : undefined}
              disabled={!hasRealPortfolios}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Portfolio Settings</span>
              {!hasRealPortfolios && (
                <div className="ml-auto text-xs text-muted-foreground">Requires portfolio</div>
              )}
            </CommandItem>
            <CommandItem onSelect={() => {
              setOpen(false);
              navigate('/currency-settings');
            }}>
              <Currency className="mr-2 h-4 w-4" />
              <span>Currency Settings</span>
            </CommandItem>
            <CommandItem 
              onSelect={hasRealPortfolios ? () => {
                setOpen(false);
                navigate('/recurring-transactions');
              } : undefined}
              disabled={!hasRealPortfolios}
            >
              <Clock className="mr-2 h-4 w-4" />
              <span>Recurring Transactions</span>
              {!hasRealPortfolios && (
                <div className="ml-auto text-xs text-muted-foreground">Requires portfolio</div>
              )}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Theme Section */}
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => {
              setTheme("light");
              setOpen(false);
            }}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Mode</span>
            </CommandItem>
            <CommandItem onSelect={() => {
              setTheme("dark");
              setOpen(false);
            }}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Mode</span>
            </CommandItem>
            <CommandItem onSelect={() => {
              setTheme("system");
              setOpen(false);
            }}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System Theme</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <AssetDetailSheet
        open={isAssetSheetOpen}
        onOpenChange={setIsAssetSheetOpen}
        asset={selectedAsset}
        transactions={transactions || []}
      />
    </>
  );
}
