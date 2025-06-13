import { useQuery } from '@tanstack/react-query';
import type { TransactionType } from '~/datatypes/transaction';


export function useAllTransactions(enabled: boolean = true) {
  return useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json() as TransactionType[];
      return data;
    },
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTransactions(portfolioId: number | null) {


  const allTransactionsQuery = useAllTransactions();

  return {
    data: allTransactionsQuery.data,
    isLoading: allTransactionsQuery.isLoading,
    error: allTransactionsQuery.error,
    refetch: allTransactionsQuery.refetch,
  }

}