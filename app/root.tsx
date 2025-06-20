import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { Route } from "./+types/root";
import "./app.css";
import {
  fetchCurrenciesByIds,
  fetchDefaultCurrency,
  fetchInstitutionByIds,
  fetchPortfolios,
  fetchCurrencies,
  fetchInstitutions,
} from "./db/actions";
import SidebarLayout from "./components/_sidebar_layout";
import { PortfolioProvider } from "./stateManagement/portfolioContext";
import { TransactionDialogProvider } from "./contexts/transactionDialogContext";
import { CurrencyDisplayProvider } from "./contexts/currencyDisplayContext";
import { TimezoneProvider } from "./contexts/timezoneContext";
import { AuthProvider } from "./contexts/authContext";
import type { PortfolioType } from "./datatypes/portfolio";
import { cronService } from "./services/cronService";
import { ThemeProvider } from "./components/theme-provider";

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

const queryClient = new QueryClient();

export async function loader({ request }: Route.LoaderArgs) {
  // Get current user session
  const { auth } = await import("~/lib/auth");
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;

  // Fetch portfolios for the current user (or all if no user)
  const pf_from_db = await queryClient.fetchQuery({
    queryKey: ["portfolios", userId], 
    queryFn: () => fetchPortfolios(userId),
  });
  const currencyIds = pf_from_db.map((pf) => pf.currency);
  const institutionIds = pf_from_db.map((pf) => pf.institutionId);
  const currencies = await queryClient.fetchQuery({
    queryKey: ["currencies", currencyIds],  
    queryFn: () => fetchCurrenciesByIds(currencyIds),
  });
  const institutions = await queryClient.fetchQuery({
    queryKey: ["institutions", institutionIds],
    queryFn: () => fetchInstitutionByIds(institutionIds),
  });

  // Fetch all currencies for transaction creation
  const allCurrencies = await queryClient.fetchQuery({
    queryKey: ["allCurrencies"],
    queryFn: fetchCurrencies,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch all institutions for portfolio creation
  const allInstitutions = await queryClient.fetchQuery({
    queryKey: ["allInstitutions"],
    queryFn: fetchInstitutions,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  const portFoliosMapped = pf_from_db.map(
    (pf) =>
      ({
        id: pf.id,
        name: pf.name,
        currency: currencies.find((c) => c.id === pf.currency) ?? {
          id: 1,
          code: "USD",
          name: "US Dollar",
          symbol: "$",
          exchangeRate: 1,
          lastUpdated: "0",
        },
        symbol: pf.symbol ?? undefined,
        type: pf.type ?? "Investment",
          institution: institutions.find((i) => i.id === pf.institutionId) ?? {
            id: 1,
            name: "Default Institution",
            isDefault: true,
            website: "",
            apiKey: "",
            apiSecret: "",
            apiUrl: "",
            lastUpdated: "0",
            isNew: false,
          },
        selected: false,
      } as PortfolioType)
  );

  if (portFoliosMapped && portFoliosMapped.length > 1) {
    const defaultCurrencyRow = await fetchDefaultCurrency();
    const defaultCurrency = defaultCurrencyRow.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      symbol: c.symbol,
      exchangeRate: c.exchangeRate ?? 1,
      lastUpdated: c.lastUpdated,
      isDefault: c.isDefault === 1,
      isNew: false,
    }));

    portFoliosMapped.push({
      id: -1, // Use a negative ID to indicate this is a special "All" portfolio
      name: "All",
      currency: defaultCurrency[0] ?? {
        id: -1,
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        exchangeRate: -1,
        lastUpdated: "0",
      },
      symbol: "GalleryVerticalEnd",
      type: "Investment",
      institution: {
        id: -1,
        name: "All Institutions",
        isDefault: true,
        website: "",
        apiKey: "",
        apiSecret: "",
        apiUrl: "",
        lastUpdated: "0",
        isNew: false,
      },
      cashBalance: 0,
      selected: false, // Default to false, let state management handle selection
      createdAt: "0",
    });
  }

  // Portfolio selection is now handled in the PortfolioProvider context
  // Transform allCurrencies to match CurrencyType interface
  const transformedCurrencies = allCurrencies.map(currency => ({
    ...currency,
    exchangeRate: currency.exchangeRate || 1,
    isDefault: Boolean(currency.isDefault)
  }));

  // Transform allInstitutions to match InstitutionType interface
  const transformedInstitutions = allInstitutions.map(institution => ({
    ...institution,
    isDefault: Boolean(institution.isDefault),
    isNew: false,
    website: institution.website || "",
    apiKey: institution.apiKey || "",
    apiSecret: institution.apiSecret || "",
    apiUrl: institution.apiUrl || "",
    lastUpdated: institution.lastUpdated || "0"
  }));

  // Initialize the cron service to schedule recurring transactions
  try {
    await cronService.initialize();
  } catch (error) {
    console.error('Failed to initialize CronService:', error);
    // Don't throw error to prevent app from breaking if cron service fails
  }

  return { portFoliosMapped, allCurrencies: transformedCurrencies, allInstitutions: transformedInstitutions };
}

export default function App({ loaderData }: Route.ComponentProps) {
  const portfolios = loaderData.portFoliosMapped;
  const currencies = loaderData.allCurrencies;
  const institutions = loaderData.allInstitutions;
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="wallet-ui-theme">
          <AuthProvider>
            <div data-auth-state="authenticated" style={{ display: 'none' }}></div>
            <PortfolioProvider initialPortfolios={portfolios}>
              <CurrencyDisplayProvider>
                <TimezoneProvider>
                  <TransactionDialogProvider currencies={currencies} institutions={institutions}>
                    <SidebarLayout>
                      <Outlet />
                    </SidebarLayout>
                  </TransactionDialogProvider>
                </TimezoneProvider>
              </CurrencyDisplayProvider>
            </PortfolioProvider>
          </AuthProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </>
  );
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
