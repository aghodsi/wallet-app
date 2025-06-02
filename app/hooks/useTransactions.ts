import { useQuery } from '@tanstack/react-query';
import { fetchTransactionsForPortfolio, fetchAllTransactions } from '~/db/actions';

export function useTransactionsForPortfolio(portfolioId: number) {
  return useQuery({
    queryKey: ['transactions', 'portfolio', portfolioId],
    queryFn: () => fetchTransactionsForPortfolio(portfolioId),
    enabled: portfolioId > 0, // Only fetch if portfolioId is valid
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllTransactions(enabled: boolean = true) {
  return useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: fetchAllTransactions,
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTransactions(portfolioId: number | null) {
  const shouldFetchAll = portfolioId === -1 || portfolioId === null;
  
  const allTransactionsQuery = useAllTransactions(shouldFetchAll);
  const portfolioTransactionsQuery = useTransactionsForPortfolio(portfolioId || 0);
  
  if (shouldFetchAll) {
    return {
      data: allTransactionsQuery.data,
      isLoading: allTransactionsQuery.isLoading,
      error: allTransactionsQuery.error,
      refetch: allTransactionsQuery.refetch,
    };
  }
  
  return {
    data: portfolioTransactionsQuery.data,
    isLoading: portfolioTransactionsQuery.isLoading,
    error: portfolioTransactionsQuery.error,
    refetch: portfolioTransactionsQuery.refetch,
  };
}