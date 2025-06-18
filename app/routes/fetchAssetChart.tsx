import { getHistoricalData, type ValidInterval } from "~/api/fetcherYahoo";
import { createAsset, getAllAssetBySymbolOrderedDesc } from "~/db/actions";
import type { AssetType } from "~/datatypes/asset";

interface LoaderArgs {
  request: Request;
}

function defineBestInterval(period1Date: Date, period2Date: Date): ValidInterval {
  let interval = "1d"
  const timeDifferenceInDays = Math.round((period2Date.getTime() - period1Date.getTime()) / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
  const timeDifferenceInHours = Math.round((period2Date.getTime() - period1Date.getTime()) / (1000 * 60 * 60)); // Convert milliseconds to hours
  
  // Yahoo Finance data availability constraints:
  // 1m: last 7 days only
  // 2m, 5m, 15m, 30m: last 60 days only  
  // 60m, 90m: last 730 days only
  // 1d: no limit
  
  const daysSinceNow = Math.round((new Date().getTime() - period1Date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (timeDifferenceInHours <= 1 && daysSinceNow <= 7) {
    interval = "1m"; // 1 minute interval for very short periods within last 7 days
  }
  else if (timeDifferenceInDays <= 1 && daysSinceNow <= 60) {
    interval = "5m"; // 5 minute interval for day-long periods within last 60 days
  }
  else if (timeDifferenceInDays > 1 && timeDifferenceInDays <= 3 && daysSinceNow <= 60) {
    interval = "15m"; // 15 minute interval for short periods within last 60 days
  }
  else if (timeDifferenceInDays > 3 && timeDifferenceInDays <= 7 && daysSinceNow <= 60) {
    interval = "30m"; // 30 minute interval for periods up to a week within last 60 days
  }
  else if (timeDifferenceInDays > 7 && timeDifferenceInDays <= 60 && daysSinceNow <= 730) {
    interval = "60m"; // 60 minute interval for periods up to 2 months within last 2 years
  }
  // in all other cases, we will use daily interval

  return interval as ValidInterval;
}

export async function loader({ request }: LoaderArgs) {
  let url = new URL(request.url);
  let query = url.searchParams.get("q");
  let period1 = url.searchParams.get("period1") || new Date().setFullYear(new Date().getFullYear() - 5); // Default to 5 years ago if period1 is not provided;
  let period2 = url.searchParams.get("period2") || new Date().getTime().toString(); // Default to now if period2 is not provided

  if (!query) {
    return { error: "No query provided" };
  }

  try {
    const assetData = await getAllAssetBySymbolOrderedDesc(query);

    // fetch the most recent asset data from DB
    // If no asset data is found, we will fetch new data from the external API
    // otherwise, data is already sorted by lastUpdated in descending order
    // and we will use that as starting point for fetching new data, but only if the time difference is at least 15 minutes
    // and period1 is not provided in the query params (otherwise, this is a specialized request  )
    let mostRecentAsset =
      assetData && assetData.length > 0 ? assetData[0] : null;
    if (mostRecentAsset) {
      // there is already some chart data in the database. Get the most recent entry
      console.log(`Most recent asset found: ${mostRecentAsset.symbol}, last updated: ${mostRecentAsset.lastUpdated}`);
      // the lastUpdate field is saved as a string, but is in milliseconds, so we can parse it as an integer
      const lastUpdated = new Date(parseInt(mostRecentAsset.lastUpdated));
      if (!url.searchParams.get("period1")) {
        // if period1 is not provided, we will use the last updated date to fetch new data since last update
        console.log(`Using last updated date from the most recent asset: ${lastUpdated}`);
        console.log(`Last entry in the database: ${mostRecentAsset.symbol}, last updated: ${lastUpdated.toLocaleDateString()}`);
        period1 = lastUpdated.getTime().toString();
      }
    }
    const period1Date = new Date(typeof period1 === 'string' ? parseInt(period1) : period1);
    const period2Date = new Date(typeof period2 === 'string' ? parseInt(period2) : period2);
    const timeDifferenceMs = period2Date.getTime() - period1Date.getTime();
    let interval = url.searchParams.get("interval") || defineBestInterval(period1Date, period2Date); // choose a good interval based on the period1 and period2 dates
    console.log(`"Fetching asset chart for query: ${query}
       period1: ${period1} (${period1Date.toLocaleDateString()}),
       period2: ${period2} (${period2Date.toLocaleDateString()}),
       interval:${interval}`);
    console.log(`Time difference in ms: ${timeDifferenceMs}`);
    let assetMapped: AssetType | undefined;
    try {
      if (period1Date < period2Date && (timeDifferenceMs / 60000) >= 15) {
        //only fetch data if the time difference is at least 15 minutes
        console.log(`Attempting to fetch data with interval: ${interval} for period from ${period1Date.toISOString()} to ${period2Date.toISOString()}`);
        
        const externalChartData = await getHistoricalData(
          query,
          period1Date,
          period2Date,
          interval as ValidInterval
        );
        
        //save the external chart data to the database if needed
        if (!externalChartData) {
          console.error(`No chart data returned for ${query} with interval ${interval}`);
          return { error: "No chart data found for the given query" };
        }

        // Check if we got meaningful data
        if (!externalChartData.quotes || externalChartData.quotes.length === 0) {
          console.error(`Empty quotes array returned for ${query} with interval ${interval}. Falling back to daily interval.`);
          
          // Fallback to daily interval if no data with requested interval
          const fallbackData = await getHistoricalData(
            query,
            period1Date,
            period2Date,
            "1d"
          );
          
          if (!fallbackData || !fallbackData.quotes || fallbackData.quotes.length === 0) {
            return { error: "No chart data found even with daily interval fallback" };
          }
          
          console.log(`Fallback successful: received ${fallbackData.quotes.length} data points with daily interval`);
          // Use fallback data
          externalChartData.quotes = fallbackData.quotes;
          externalChartData.meta = fallbackData.meta;
          if (fallbackData.events) {
            externalChartData.events = fallbackData.events;
          }
        } else {
          console.log(`Successfully fetched ${externalChartData.quotes.length} data points with interval ${interval}`);
        }

        externalChartData.events?.splits?.forEach((s) => {
          try{
              s.date.getTime().toString()
          } catch (error) {
            console.error("Error processing split event:", s.date);
          }
        });

        externalChartData.events?.dividends?.forEach((s) => {
          try{
              s.date.getTime().toString()
          } catch (error) {
            console.error("Error processing dividend event:", s.date, typeof s.date);
          }
        });

        // console.log("External chart data fetched successfully:", externalChartData);
        
        assetMapped = {
          id: 1, // this will be auto-generated by the database
          symbol: externalChartData.meta.symbol,
          currency: externalChartData.meta.currency,
          exchangeName: externalChartData.meta.exchangeName,
          fullExchangeName: mostRecentAsset
            ? mostRecentAsset.fullExchangeName!
            : externalChartData.meta.exchangeName || "",
          instrumentType: externalChartData.meta.instrumentType,
          timezone: externalChartData.meta.timezone,
          exchangeTimezoneName: externalChartData.meta.exchangeTimezoneName,
          longName: mostRecentAsset
            ? mostRecentAsset.longName!
            : (externalChartData.meta as any).longName || externalChartData.meta.symbol || "",
          shortName: mostRecentAsset
            ? mostRecentAsset.shortName!
            : (externalChartData.meta as any).shortName || externalChartData.meta.symbol || "",
          quotes: externalChartData.quotes
            .filter((q) => {
              // Filter out quotes with null/undefined/zero close prices which indicate invalid data
              const hasValidClose = q.close !== null && q.close !== undefined && q.close > 0;
              if (!hasValidClose) {
                console.warn(`Filtering out invalid quote for ${query} on ${q.date}: close=${q.close}`);
              }
              return hasValidClose;
            })
            .map((q) => ({
              date: q.date.getTime().toString(), // convert to string for consistency.
              high: q.high === null ? undefined : q.high,
              low: q.low === null ? undefined : q.low,
              open: q.open === null ? undefined : q.open,
              close: q.close === null ? undefined : q.close,
              volume: q.volume === null ? undefined : q.volume,
              adjclose: q.adjclose === null ? undefined : q.adjclose,
            })),
          events: {
            // Convert dividends and splits to the expected format. Storing the date as a string for consistency.
            dividends: externalChartData.events?.dividends
              ? externalChartData.events.dividends.map((d) => {
                  console.log('Processing dividend:', d.date, typeof d.date, d.amount);
                  let timestampMs: number;
                  if (typeof d.date === 'number') {
                    // Yahoo Finance returns Unix timestamp in seconds, convert to milliseconds
                    timestampMs = d.date < 10000000000 ? d.date * 1000 : d.date;
                  } else {
                    // Date object, get milliseconds
                    timestampMs = d.date.getTime();
                  }
                  console.log('Converted dividend timestamp:', timestampMs, new Date(timestampMs).toISOString());
                  return {
                    amount: d.amount,
                    date: timestampMs.toString(),
                  };
                })
              : [],
            splits: externalChartData.events?.splits
              ? externalChartData.events.splits.map((s) => {
                  let timestampMs: number;
                  if (typeof s.date === 'number') {
                    // Yahoo Finance returns Unix timestamp in seconds, convert to milliseconds
                    timestampMs = s.date < 10000000000 ? s.date * 1000 : s.date;
                  } else {
                    // Date object, get milliseconds
                    timestampMs = s.date.getTime();
                  }
                  return {
                    date: timestampMs.toString(),
                    numerator: s.numerator,
                    denominator: s.denominator,
                    splitRatio: s.splitRatio,
                  };
                })
              : [],
          },
          isFromApi: true, // since this data is fetched from an external API
          lastUpdated: new Date().getTime().toString(),
        };
        const res = await createAsset(assetMapped);
        if (!res || res[0].id === undefined) {
          return { error: "Failed to save asset data to the database" };
        }
      } else {
        // No need to fetch new data, use the most recent asset data
        console.log(
          `Using existing asset data for ${query} from last updated date: ${mostRecentAsset ? mostRecentAsset.lastUpdated : "N/A"}`
        );
      }
      // combine the new asset with the existing chart data
      // Combine quotes and events from assetMapped and all assets from assetData
      // Merge data from all existing assets
      const combinedQuotes = [...(assetMapped?.quotes || [])];
      const combinedDividends = [...(assetMapped?.events?.dividends || [])];
      const combinedSplits = [...(assetMapped?.events?.splits || [])];

      // Merge data from all existing assets
      assetData.forEach((asset) => {
        if (asset.quotes) {
          combinedQuotes.push(...asset.quotes);
        }

        if (asset.events?.dividends) {
          combinedDividends.push(...asset.events.dividends);
        }

        if (asset.events?.splits) {
          combinedSplits.push(...asset.events.splits);
        }
      });

      // Create the combined asset data
      // Use mostRecentAsset as fallback if assetMapped is undefined
      const baseAsset = assetMapped || mostRecentAsset;
      if (!baseAsset) {
        return { error: "No asset data available" };
      }

      const combinedAssetData = {
        ...baseAsset,
        quotes: combinedQuotes,
        events: {
          dividends:
            combinedDividends.length > 0 ? combinedDividends : undefined,
          splits: combinedSplits.length > 0 ? combinedSplits : undefined,
        },
      };
      // console.log("Combined Asset Data:", combinedAssetData);
      return combinedAssetData;
    } catch (error) {
      console.error("Error fetching external chart data:", error);
      return { error: "Failed to fetch external chart data" };
    }
  } catch (error) {
    console.error("Error fetching asset chart:", error);
    return { error: "Failed to fetch asset chart" };
  }
}
