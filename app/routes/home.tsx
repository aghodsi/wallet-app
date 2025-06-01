import { usePortfolioDispatch, userPortfolios } from "~/stateManagement/portfolioContext";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import { PortfolioCreation } from "~/components/portfolioCreation";
import type { InstitutionType } from "~/datatypes/institution";
import type { CurrencyType } from "~/datatypes/currency";
import { fetchCurrencies, fetchInstitutions } from "~/db/actions";
import { useFetcher, useParams, useSearchParams } from "react-router";
import { Toaster } from "~/components/ui/sonner";
import { toast } from "sonner";
import { TransactionCreation } from "~/components/transactionCreation";

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
  const portfolioDispatch = usePortfolioDispatch()
  const [openPortfolio, setOpenPortfolio] = useState(false);
  const [openTransaction, setOpenTransaction] = useState(false);
  console.log("Portfolios from Home:", portfolios);

  const fetcher = useFetcher();

  useEffect(() => {
    const action = searchParams.get("action");

    setOpenPortfolio(action === "createPortfolio");
    setOpenTransaction(action === "createTransaction");
  }, [searchParams]);

  // Handle fetcher responses
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.error) {
        const errorMessage =
          fetcher.data.error.message || "Unknown error occurred";
        toast.error(`Error: ${errorMessage}`);
      } else {
        // Determine what was created based on the action
        if (fetcher.data.action == "createTransaction") {
          toast.success("Transaction added successfully!");
          setOpenTransaction(false);
        } else {
          toast.success("Portfolio created successfully!");
          console.log("Portfolios after creation:", fetcher.data);
          // portfolioDispatch({
          //   type: "added",
          //   portfolio: fetcher.data.map((p) => ({
          //     id: p.id,
          //     name: p.name,
          //     currency: p.currency
          //   ),
          // });
          setOpenPortfolio(false);
        }
      }
    }
  }, [fetcher.state, fetcher.data]);

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
          const formData = new FormData();
          formData.append("transaction", JSON.stringify(t));
          fetcher.submit(formData, {
            method: "post",
            action: "/createTransaction",
          });
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
          const formData = new FormData();
          formData.append("portfolio", JSON.stringify(p));
          fetcher.submit(formData, {
            method: "post",
            action: "/createPortfolio",
          });
        }}
        currencies={loaderData.currencies}
        institutions={loaderData.institutions}
      />
      <Toaster />
    </>
  );
}
