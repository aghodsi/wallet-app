import type { Route } from "./+types/portfolioSettings";
import {
  fetchInstitutions,
  fetchCurrencies,
} from "~/db/actions";
import { PortfolioSettings } from "~/components/portfolioSettings";

export async function loader({ }: Route.LoaderArgs) {
  const institutions = await fetchInstitutions();
  const currencies = await fetchCurrencies();

  return {
    institutions,
    currencies,
  };
}

export default function PortfolioSettingsPage({ loaderData }: { loaderData: any }) {
  const { institutions, currencies } = loaderData;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Portfolio Settings</h1>
      <PortfolioSettings
        institutions={institutions}
        currencies={currencies}
      />
    </div>
  );
}
