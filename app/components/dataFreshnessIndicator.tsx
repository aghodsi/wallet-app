import { useQueries, useQuery } from "@tanstack/react-query";
import type { AssetType } from "~/datatypes/asset";
import { userPortfolios } from "~/stateManagement/portfolioContext";
import { useTimezone } from "~/contexts/timezoneContext";
import { useMemo, useState, useEffect } from "react";
import { apiGet, handleApiResponse } from "~/lib/api-client";

// Hook to get all unique asset symbols from all portfolios
function useAllAssetSymbols() {
  const portfolios = userPortfolios();
  const selectedPortfolio = portfolios.find((p) => p.selected);
  
  // Fetch all transactions to get asset symbols
  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await apiGet("/api/transactions");
      return handleApiResponse(response);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  return useMemo(() => {
    // Filter transactions by selected portfolio and extract unique asset symbols
    const filteredTransactions = selectedPortfolio && selectedPortfolio.id >= 0
      ? transactions.filter((t: any) => t.portfolioId === selectedPortfolio.id)
      : transactions;
    
    const uniqueAssets = [...new Set(filteredTransactions.map((t: any) => t.asset))];
    return uniqueAssets.filter(Boolean) as string[]; // Remove any null/undefined values and type as string array
  }, [transactions, selectedPortfolio]);
}

export function DataFreshnessIndicator() {
  const assetSymbols = useAllAssetSymbols();
  
  // Fetch asset data for all symbols
  const assetQueries = useQueries({
    queries: assetSymbols.map((symbol: string) => ({
      queryKey: ["assetFresh", symbol],
      queryFn: async () => {
        const res = await fetch("/fetchAssetChart?q=" + symbol);
        if (!res.ok) {
          throw new Error(`Error fetching asset data for ${symbol}: ${res.statusText}`);
        }
        const resJson = await res.json();
        return resJson as AssetType;
      },
      staleTime: 15 * 60 * 1000, // 15 minutes
      enabled: !!symbol,
    })),
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dataFreshness = useMemo(() => {
    if (!mounted) return "Loading...";
    
    const assets = assetQueries.map(q => q.data).filter(Boolean) as AssetType[];
    if (assets.length === 0) return "No data";
    
    const lastUpdated = assets.reduce((latest, asset) => {
      let assetDate;
      try {
        // Try parsing as ISO string first
        if (asset.lastUpdated.includes('T') || asset.lastUpdated.includes('-')) {
          assetDate = new Date(asset.lastUpdated);
        } else {
          // Assume it's an epoch timestamp
          const timestamp = parseInt(asset.lastUpdated);
          // If it's a 10-digit number, it's in seconds; if 13 digits, it's in milliseconds
          assetDate = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
        }
        
        // Validate the date
        if (isNaN(assetDate.getTime())) {
          console.warn(`Invalid date for asset ${asset.symbol}: ${asset.lastUpdated}`);
          return latest;
        }
        
        return assetDate > latest ? assetDate : latest;
      } catch (error) {
        console.warn(`Error parsing date for asset ${asset.symbol}: ${asset.lastUpdated}`, error);
        return latest;
      }
    }, new Date(0));
    
    // If no valid dates were found, show "Unknown"
    if (lastUpdated.getTime() === 0) return "Unknown";
    
    const now = new Date();
    const timeDiff = now.getTime() - lastUpdated.getTime();
    
    // Prevent negative time differences
    if (timeDiff < 0) return "Future date";
    
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }, [assetQueries, mounted]);

  // Determine status color based on data freshness
  const getStatusColor = (freshness: string) => {
    if (freshness === "Just now" || freshness.includes("m ago")) {
      const minutes = freshness.includes("m ago") ? parseInt(freshness.split("m")[0]) : 0;
      if (minutes <= 15) return "bg-green-500"; // Live/fresh data
      if (minutes <= 60) return "bg-yellow-500"; // Slightly stale
    }
    if (freshness.includes("h ago")) {
      const hours = parseInt(freshness.split("h")[0]);
      if (hours <= 6) return "bg-yellow-500"; // Stale
      return "bg-red-500"; // Very stale
    }
    if (freshness.includes("d ago") || freshness.includes("mo ago")) {
      return "bg-red-500"; // Very old
    }
    return "bg-gray-500"; // Unknown/loading
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
      <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor(dataFreshness)}`}></div>
      <span>Last Data Sync: {dataFreshness}</span>
    </div>
  );
}
