import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { QueryClient } from "@tanstack/react-query";
import type { Route } from "./+types/root";
import "./app.css";
import {
  fetchCurrencies,
  fetchInstitutions,
} from "./db/actions";
import SidebarLayout from "./components/_sidebar_layout";
import { AppProviders } from "./providers/AppProviders";
import { cronService } from "./services/cronService";

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
  const { auth } = await import("./lib/auth");
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;

  console.log("User ID from session:", userId);

  // Only fetch essential data that's needed regardless of auth state
  // Portfolios will be fetched by PortfolioContext when user is authenticated
  
  // Fetch all currencies for transaction creation (needed for dialogs)
  const allCurrencies = await queryClient.fetchQuery({
    queryKey: ["allCurrencies"],
    queryFn: fetchCurrencies,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch all institutions for portfolio creation (needed for dialogs)
  const allInstitutions = await queryClient.fetchQuery({
    queryKey: ["allInstitutions"],
    queryFn: fetchInstitutions,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

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

  return { allCurrencies: transformedCurrencies, allInstitutions: transformedInstitutions };
}

export default function App({ loaderData }: Route.ComponentProps) {
  const currencies = loaderData.allCurrencies;
  const institutions = loaderData.allInstitutions;
  
  return (
    <AppProviders 
      currencies={currencies} 
      institutions={institutions} 
      queryClient={queryClient}
    >
      <SidebarLayout>
        <Outlet />
      </SidebarLayout>
    </AppProviders>
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
