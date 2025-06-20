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
  Import,
  Moon,
  Sun,
  Monitor,
  LogOut,
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
import { userPortfolios, usePortfolioDispatch } from "~/stateManagement/portfolioContext";
import { useTransactions } from "~/hooks/useTransactions";
import { useNavigate } from "react-router";
import { useDialogContext } from "~/contexts/transactionDialogContext";
import { useTransactionView } from "~/contexts/transactionViewContext";
import { useTheme } from "~/components/theme-provider";
import { formatDate } from "~/lib/dateUtils";
import { AssetDetailSheet } from "~/components/assetDetailSheet";
import type { AssetType } from "~/datatypes/asset";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "~/contexts/authContext";

export function SearchComponent() {
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetType | null>(null);
  const [isAssetSheetOpen, setIsAssetSheetOpen] = useState(false);
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>("");
  const isMac = useIsMac();
  const navigate = useNavigate();
  const { openTransactionDialog, openPortfolioDialog } = useDialogContext();
  const { openTransactionView } = useTransactionView();
  const { setTheme } = useTheme();
  const { signOut, user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const portfolios = userPortfolios();
  const portfolioDispatch = usePortfolioDispatch();
  
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
    const portfolio = portfolios.find(p => p.id === portfolioId);
    if (portfolio) {
      portfolioDispatch({
        type: 'selected',
        portfolio: portfolio
      });
    }
  };

  const handleTransactionSelect = (transactionId: number) => {
    setOpen(false);
    const transaction = transactions?.find(t => t.id === transactionId);
    if (transaction) {
      openTransactionView(transaction);
    }
  };

  const handleAssetSelect = (assetSymbol: string) => {
    setOpen(false);
    setSelectedAssetSymbol(assetSymbol);
  };

  // Effect to handle user login and refresh data
  useEffect(() => {
    if (!authLoading && user) {
      // User has logged in - invalidate and refetch user-specific queries
      console.log('🔄 User logged in, refreshing portfolio data in search component');
      
      // Invalidate user-specific queries to trigger fresh data fetch
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey[0] as string;
          return [
            'transactions', 
            'portfolios'
          ].includes(queryKey);
        }
      });
      
      // Clear any stale component state
      setSelectedAsset(null);
      setSelectedAssetSymbol("");
      setIsAssetSheetOpen(false);
    }
  }, [user, authLoading, queryClient]);

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
          <CommandGroup heading="Select Portfolio">
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
                navigate('/portfolioSettings');
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
              navigate('/currencySettings');
            }}>
              <Currency className="mr-2 h-4 w-4" />
              <span>Currency Settings</span>
            </CommandItem>
            <CommandItem 
              onSelect={hasRealPortfolios ? () => {
                setOpen(false);
                navigate('/recurringTransactions');
              } : undefined}
              disabled={!hasRealPortfolios}
            >
              <Clock className="mr-2 h-4 w-4" />
              <span>Recurring Transactions</span>
              {!hasRealPortfolios && (
                <div className="ml-auto text-xs text-muted-foreground">Requires portfolio</div>
              )}
            </CommandItem>
            <CommandItem onSelect={() => {
              setOpen(false);
              navigate('/import');
            }}>
              <Import className="mr-2 h-4 w-4" />
              <span>Import</span>
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

          <CommandSeparator />

          {/* Account Section */}
          <CommandGroup heading="Account">
            <CommandItem onSelect={async () => {
              setOpen(false);
              
              // Clear all user-bound data from React Query cache
              queryClient.removeQueries({ 
                predicate: (query) => {
                  const queryKey = query.queryKey[0] as string;
                  // Remove user-specific queries but keep global data like currencies and institutions
                  return [
                    'transactions', 
                    'portfolios', 
                    'assetFetch', 
                    'assetSearch'
                  ].includes(queryKey);
                }
              });
              
              // Clear component state
              setSelectedAsset(null);
              setSelectedAssetSymbol("");
              setIsAssetSheetOpen(false);
              
              await signOut();
              navigate('/');
            }}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
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
