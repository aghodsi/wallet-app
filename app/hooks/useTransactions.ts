import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { TransactionType } from '~/datatypes/transaction';


export function useAllTransactions(enabled: boolean = true) {
  const queryClient = useQueryClient();
  
  const query = useQuery({
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

  // Listen for auth state changes and invalidate queries
  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      if (event.detail.type === 'signout') {
        console.log('🔄 Clearing transaction data due to sign out');
        // Invalidate and clear transaction queries
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.setQueryData(['transactions', 'all'], []);
      } else if (event.detail.type === 'signin') {
        console.log('🔄 Refreshing transaction data due to sign in');
        // Invalidate queries to force refetch with new user context
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      }
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange as EventListener);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange as EventListener);
    };
  }, [queryClient]);

  return query;
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
