import { userPortfolios } from "~/stateManagement/portfolioContext";
import { FactCards } from "~/components/portfolio/factCardsComponents";
import { ChartAreaInteractive } from "~/components/portfolio/chartsInteractiveComponent";
import type { Route } from "./+types/portfolio";
import { fetchAllTransactions } from "~/db/actions";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { AssetType } from "~/datatypes/asset";

export async function loader({ request, params }: Route.LoaderArgs) {
  const transactions = await fetchAllTransactions();
  return { transactions };
}

export default function Portfolio({ loaderData }: Route.ComponentProps) {
  const portfolios = userPortfolios();
  const selectedPortfolio = portfolios.find((p) => p.selected);
  // TanStack Query for asset search
  const transactionQueries = useQueries({
    queries: loaderData.transactions.map((transaction) => {
      return {
        queryKey: ["assetFetch", transaction.asset],
        queryFn: async () => {
          const res = await fetch("/fetchAssetChart?q=" + transaction.asset);
          if (!res.ok) {
            throw new Error(
              `Error fetching asset data for ${transaction.asset}: ${res.statusText}`
            );
          }
          const resJson = await res.json();
          console.log(`Fetched asset data for ${transaction.asset}:`, resJson);
          // Ensure the response matches the AssetType structure
          return resJson as AssetType;
        },
        staleTime: 15 * 60 * 1000, // 15 minutes
        enabled: !!transaction.asset,
      };
    }),
  });

  transactionQueries.forEach((query, index) => {
    if (query.isLoading) {
      console.log(
        `Loading transaction asset data for transaction ${index + 1}`
      );
    } else if (query.isError) {
      console.error(
        `Error fetching asset data for transaction ${index + 1}:`,
        query.error
      );
    }
    console.log(`Fetched asset data for transaction ${index + 1}:`, query.data);
  });

  console.log("Transactions Loader Data:", loaderData.transactions);

  // Compute filtered transactions directly without useState
  const transactions =
    selectedPortfolio && selectedPortfolio.id >= 0
      ? loaderData.transactions.filter(
          (t) => t.portfolioId === selectedPortfolio.id
        )
      : loaderData.transactions || [];

  console.log("Selected Portfolio:", selectedPortfolio);
  console.log("Filtered Transactions:", transactions);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <FactCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        {transactions && transactions.length > 0 ? (
          <div className="px-4 lg:px-6">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <ul className="list-disc pl-5">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="py-1">
                  {transaction.asset} - {transaction.quantity} @ $
                  {transaction.price} on{" "}
                  {new Date(transaction.date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="px-4 lg:px-6">
            <h2 className="text-lg font-semibold">
              No transactions found for this portfolio.
            </h2>
          </div>
        )}
        {/* <DataTable data={data} /> */}
      </div>
    </div>
  );
}
