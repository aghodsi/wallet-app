import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from "../components/theme-provider";
import { AuthProvider } from "../contexts/authContext";
import { PortfolioProvider } from "../stateManagement/portfolioContext";
import { CurrencyDisplayProvider } from "../contexts/currencyDisplayContext";
import { TimezoneProvider } from "../contexts/timezoneContext";
import { TransactionDialogProvider } from "../contexts/transactionDialogContext";
import { TransactionViewProvider } from "../contexts/transactionViewContext";
import type { CurrencyType } from "../datatypes/currency";
import type { InstitutionType } from "../datatypes/institution";

interface AppProvidersProps {
  children: React.ReactNode;
  currencies: CurrencyType[];
  institutions: InstitutionType[];
  queryClient: QueryClient;
}

export function AppProviders({ 
  children, 
  currencies, 
  institutions, 
  queryClient 
}: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="wallet-ui-theme">
        <AuthProvider>
          <div data-auth-state="authenticated" style={{ display: 'none' }}></div>
          <PortfolioProvider>
            <CurrencyDisplayProvider>
              <TimezoneProvider>
                <TransactionDialogProvider currencies={currencies} institutions={institutions}>
                  <TransactionViewProvider currencies={currencies}>
                    {children}
                  </TransactionViewProvider>
                </TransactionDialogProvider>
              </TimezoneProvider>
            </CurrencyDisplayProvider>
          </PortfolioProvider>
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
