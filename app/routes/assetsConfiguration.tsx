import { getAllAssetsWithDateRange } from "~/db/actions";
import { formatDate, formatDateTime } from "~/lib/dateUtils";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

export async function loader() {
  try {
    const assets = await getAllAssetsWithDateRange();
    
    // Group assets by symbol and merge their data
    const assetsBySymbol = new Map();
    
    assets.forEach((asset: any) => {
      const symbol = asset.symbol;
      
      if (!assetsBySymbol.has(symbol)) {
        assetsBySymbol.set(symbol, {
          symbol,
          longName: asset.longName,
          shortName: asset.shortName,
          exchangeName: asset.exchangeName,
          currency: asset.currency,
          allQuotes: [],
          lastUpdatedTimestamps: []
        });
      }
      
      const groupedAsset = assetsBySymbol.get(symbol);
      
      // Merge quotes from all instances of this asset
      if (asset.quotes && Array.isArray(asset.quotes)) {
        groupedAsset.allQuotes.push(...asset.quotes);
      }
      
      // Keep track of all lastUpdated timestamps
      groupedAsset.lastUpdatedTimestamps.push(parseInt(asset.lastUpdated));
      
      // Use the most complete information (prefer non-null values)
      if (asset.longName && !groupedAsset.longName) groupedAsset.longName = asset.longName;
      if (asset.shortName && !groupedAsset.shortName) groupedAsset.shortName = asset.shortName;
      if (asset.exchangeName && !groupedAsset.exchangeName) groupedAsset.exchangeName = asset.exchangeName;
    });
    
    // Process each grouped asset to extract date information
    const processedAssets = Array.from(assetsBySymbol.values()).map((groupedAsset: any) => {
      let oldestDate = null;
      let newestDate = null;
      
      if (groupedAsset.allQuotes.length > 0) {
        const allDates = groupedAsset.allQuotes
          .map((quote: any) => quote.date)
          .filter((date: any) => date)
          .map((date: any) => {
            // Handle various date formats (epoch timestamps, ISO strings, etc.)
            const timestamp = typeof date === 'string' && !isNaN(Number(date)) 
              ? Number(date) 
              : new Date(date).getTime();
            return timestamp;
          })
          .filter((timestamp: number) => !isNaN(timestamp))
          .sort((a: number, b: number) => a - b);
        
        if (allDates.length > 0) {
          oldestDate = allDates[0];
          newestDate = allDates[allDates.length - 1];
        }
      }
      
      // Use the newest quote date as the "last updated" time
      const lastQuoteDate = newestDate;
      
      // Calculate staleness based on the newest quote date
      const now = Date.now();
      let isStale = true;
      
      if (lastQuoteDate) {
        const currentDate = new Date(now);
        const lastQuoteDateTime = new Date(lastQuoteDate);
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        
        // Check if it's a weekday (Monday to Friday)
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        
        if (isWeekday) {
          // On weekdays, consider stale if older than 1 hour
          isStale = (now - lastQuoteDate) > (1 * 60 * 60 * 1000); // 1 hour in milliseconds
        } else {
          // On weekends, consider stale if older than 24 hours
          isStale = (now - lastQuoteDate) > (24 * 60 * 60 * 1000); // 24 hours in milliseconds
        }
      }
      
      return {
        id: groupedAsset.symbol, // Use symbol as unique ID
        symbol: groupedAsset.symbol,
        longName: groupedAsset.longName,
        shortName: groupedAsset.shortName,
        exchangeName: groupedAsset.exchangeName,
        currency: groupedAsset.currency,
        oldestQuoteDate: oldestDate,
        newestQuoteDate: newestDate,
        isStale,
        lastUpdatedTimestamp: lastQuoteDate, // Use the newest quote date as last updated
        entryCount: groupedAsset.allQuotes.length
      };
    });

    return { assets: processedAssets };
  } catch (error) {
    console.error("Error loading assets:", error);
    return { assets: [], error: "Failed to load assets" };
  }
}

export default function AssetsConfiguration({ loaderData }: { loaderData: { assets: any[], error?: string } }) {
  const { assets, error } = loaderData;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Assets</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assets Configuration</h1>
        <p className="text-muted-foreground">
          View all assets in your portfolio with their data freshness information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assets Overview</CardTitle>
          <CardDescription>
            All assets with their oldest and newest data points, plus staleness indicators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assets found in your portfolio.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Exchange</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Oldest Entry</TableHead>
                    <TableHead>Latest Entry</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">{asset.symbol}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{asset.longName || asset.shortName || "N/A"}</div>
                          {asset.shortName && asset.longName && asset.shortName !== asset.longName && (
                            <div className="text-sm text-muted-foreground">{asset.shortName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{asset.exchangeName || "N/A"}</TableCell>
                      <TableCell>{asset.currency}</TableCell>
                      <TableCell>
                        {asset.oldestQuoteDate ? (
                          <div className="text-sm">
                            {formatDateTime(asset.oldestQuoteDate)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {asset.newestQuoteDate ? (
                          <div className="text-sm">
                            {formatDateTime(asset.newestQuoteDate)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No data</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDateTime(asset.lastUpdatedTimestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={asset.isStale ? "destructive" : "secondary"}
                          className={asset.isStale ? "bg-orange-100 text-orange-800 border-orange-200" : ""}
                        >
                          {asset.isStale ? "Stale" : "Fresh"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
