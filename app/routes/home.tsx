import { userPortfolios } from "~/stateManagement/portfolioContext";
import type { Route } from "./+types/home";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { PortfolioCreation } from "~/components/portfolioCreation";
import type { InstitutionType } from "~/datatypes/institution";
import type { CurrencyType } from "~/datatypes/currency";
import { fetchCurrencies, fetchInstitutions } from "~/db/fetcher";
import { useFetcher } from "react-router";
import { Toaster } from "~/components/ui/sonner";
import { toast } from "sonner";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
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
  const portfolios = userPortfolios();
  const [open, setOpen] = useState(false);
  console.log("Portfolios from Home:", portfolios);

  const fetcher = useFetcher();

  if (!portfolios || portfolios.length === 0) {
    return (
      <>
        <h1 className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">
          No portfolio. Let's create{" "}
          <Button variant="ghost" onClick={() => setOpen(true)} className="bg-gradient-to-r from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text">
            one
          </Button>
          .
        </h1>

        <PortfolioCreation
          open={open}
          openChange={setOpen}
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
              toast.success("Portfolio created successfully!")
              setOpen(false);
            }else{
              toast.error("Error creating portfolio: " + fetcher.data?.error.message);
            }
          }}
          currencies={loaderData.currencies}
          institutions={loaderData.institutions}
        />

        <Toaster />
      </>
    );
  }
  // redirect to the portfolio list page if portfolios exist
  return "Hello World!";
}
