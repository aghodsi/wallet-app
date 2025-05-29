import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { fetchCurrenciesByIds, fetchDefaultCurrency, fetchInstitutionByIds, fetchPortfolios } from "./db/fetcher";
import SidebarLayout from "./components/_sidebar_layout";
import { PortfolioProvider } from "./stateManagement/portfolioContext";
import type { PortfolioType } from "./datatypes/portfolio";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export async function loader({ params }: Route.LoaderArgs) {
  const pf_from_db = await fetchPortfolios();
  const currencyIds = pf_from_db.map((pf) => pf.currency);
  const institutionIds = pf_from_db.map((pf) => pf.institutionId);
  const currencies = await fetchCurrenciesByIds(currencyIds);
  const institutions = await fetchInstitutionByIds(institutionIds);
  
  const portFoliosMapped = pf_from_db.map((pf) => ({
    id: pf.id,
    name: pf.name,
    currency: currencies.find((c) => c.id === pf.currency) ?? { id: 1, code: "USD", name: "US Dollar", symbol: "$", exchangeRate: 1, lastUpdated: new Date().toISOString() },
    symbol: pf.symbol ?? undefined,
    type: pf.type ?? "Investment",
    institution: institutions.find((i) => i.id === pf.institutionId) ?? { id: 1, name: "Default Institution", isDefault: true, website: "", apiKey: "", apiSecret: "", apiUrl: "", lastUpdated: new Date().toISOString(), isNew: false },
    selected: false
  } as PortfolioType));

  if (portFoliosMapped && portFoliosMapped.length > 1) {
    const defaultCurrencyRow = await fetchDefaultCurrency(); 
    const defaultCurrency = defaultCurrencyRow.map((c) => ({ id: c.id, code: c.code, name: c.name, symbol: c.symbol, exchangeRate: c.exchangeRate ?? 1, lastUpdated: c.lastUpdated, isDefault: c.isDefault === 1, isNew: false }));

    portFoliosMapped.push({
      id: -1, // Use a negative ID to indicate this is a special "All" portfolio
      name: "All",
      currency: defaultCurrency[0] ?? { id: 1, code: "USD", name: "US Dollar", symbol: "$", exchangeRate: 1, lastUpdated: new Date().toISOString() },
      symbol: "GalleryVerticalEnd",
      type: "Investment",
      institution: { id: 1, name: "All Institutions", isDefault: true, website: "", apiKey: "", apiSecret: "", apiUrl: "", lastUpdated: new Date().toISOString(), isNew: false },
      selected: true,
    });
  }
  return { portFoliosMapped };
}

export default function App({
  loaderData,
}: Route.ComponentProps) {
  const portfolios = loaderData.portFoliosMapped;
  return (
    <>
      <PortfolioProvider initialPortfolios={portfolios}>
        <SidebarLayout>
          <Outlet />
        </SidebarLayout>
      </PortfolioProvider>
    </>
  )

}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
