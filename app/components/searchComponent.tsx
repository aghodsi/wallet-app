"use client";

import * as React from "react";
import {
  Plus,
  Wallet,
  TrendingUp,
  Coins,
  ArrowUpDown,
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

export function SearchComponent() {
  const [open, setOpen] = useState(false);
  const isMac = useIsMac();
  const navigate = useNavigate();
  const { openTransactionDialog, openPortfolioDialog } = useDialogContext();
  const portfolios = userPortfolios();
  
  // Use useTransactions hook with portfolioId -1 to get all transactions
  const { data: transactions, isLoading: isTransactionsLoading } = useTransactions(-1);

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
      <Button variant="ghost" className="flex items-center justify-between w-full" onClick={() => setOpen(true)}>
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
            <CommandItem onSelect={() => handleAction('create-transaction')}>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <span>Create Transaction</span>
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
                    {new Date(parseInt(transaction.date)).toLocaleDateString()}
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
                <CommandItem key={asset}>
                  <Coins className="mr-2 h-4 w-4" />
                  <span>{asset}</span>
                </CommandItem>
              ))
            ) : (
              <CommandItem disabled>
                <span className="text-muted-foreground">No assets found</span>
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
