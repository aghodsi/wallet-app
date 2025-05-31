import { userPortfolios } from "~/stateManagement/portfolioContext";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import { PortfolioCreation } from "~/components/portfolioCreation";
import type { InstitutionType } from "~/datatypes/institution";
import type { CurrencyType } from "~/datatypes/currency";
import { fetchCurrencies, fetchInstitutions } from "~/db/function";
import { useFetcher, useParams, useSearchParams } from "react-router";
import { Toaster } from "~/components/ui/sonner";
import { toast } from "sonner";
import { TransactionCreation } from "~/components/transactionCreation";
import { set } from "date-fns";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const institutions = await fetchInstitutions();
  const currencies = await fetchCurrencies();

  const institudionsWithType = institutions.map((i) => ({
    id: i.id,
    name: i.name,
    isDefault: i.isDefault || false,
    website: i.website || undefined,
    apiKey: i.apiKey || undefined,
    apiSecret: i.apiSecret || undefined,
    isNew: false,
  })) as InstitutionType[];
  const currencieswithType = currencies.map((c) => ({
    ...c,
    exchangeRate: c.exchangeRate || 1,
    isDefault: c.isDefault || false,
  })) as CurrencyType[];
  return {
    institutions: institudionsWithType,
    currencies: currencieswithType,
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const portfolios = userPortfolios();
  const [openPortfolio, setOpenPortfolio] = useState(false);
  const [openTransaction, setOpenTransaction] = useState(false);
  console.log("Portfolios from Home:", portfolios);

  const fetcher = useFetcher();

  useEffect(() => {
    const action = searchParams.get("action");

    setOpenPortfolio(action === "createPortfolio");
    setOpenTransaction(action === "createTransaction");
  }, [searchParams]);

  return (
    <>
      <h1 className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">
        No portfolio. Let's create{" "}
        <Button
          variant="ghost"
          onClick={() => setOpenTransaction(true)}
          className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text"
        >
          one
        </Button>
        .
      </h1>
      <TransactionCreation
        open={openTransaction}
        openChange={setOpenTransaction}
        onCreate={(t) => {
          console.log("Transaction created:", t);
          toast.info("Adding transaction...");
          // Submit the transaction data to the server
          const formData = new FormData();
          formData.append("transaction", JSON.stringify(t));
          fetcher.submit(formData, {
            method: "post",
            action: "/createTransaction",
          });
          if (!fetcher.data?.error) {
            toast.success("Transaction added successfully!");
            setOpenTransaction(false);
          } else {
            toast.error(
              "Error creating transaction: " + fetcher.data?.error.message
            );
          }
        }}
        portfolios={portfolios}
        selectedPortfolioId={portfolios[0]?.id || 0}
        currencies={loaderData.currencies}
      />

      <PortfolioCreation
        open={openPortfolio}
        openChange={setOpenPortfolio}
        onCreate={(p) => {
          console.log("Portfolio created:", p);
          toast.info("Creating portfolio...");
          // Submit the portfolio data to the server
          const formData = new FormData();
          formData.append("portfolio", JSON.stringify(p));
          fetcher.submit(formData, {
            method: "post",
            action: "/createPortfolio",
          });
          if (!fetcher.data?.error) {
            toast.success("Portfolio created successfully!");
            setOpenPortfolio(false);
          } else {
            toast.error(
              "Error creating portfolio: " + fetcher.data?.error.message
            );
          }
        }}
        currencies={loaderData.currencies}
        institutions={loaderData.institutions}
      />

      <Toaster />
    </>
  );
}
