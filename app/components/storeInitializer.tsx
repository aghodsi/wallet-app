import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useAuth } from '~/contexts/authContext';

export function StoreInitializer() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, isLoading, session } = useAuth();
  
  // Keep track of previous user to detect changes
  const prevUserRef = useRef<typeof user>(user);
  const prevSessionRef = useRef<typeof session>(session);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip the first render to avoid clearing data on initial load
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      prevUserRef.current = user;
      prevSessionRef.current = session;
      return;
    }

    // Don't react while auth is still loading
    if (isLoading) return;

    const prevUser = prevUserRef.current;
    const prevSession = prevSessionRef.current;

    // User signed out (had user/session, now doesn't)
    if ((prevUser || prevSession) && !user && !session) {
      console.log('🔄 StoreInitializer: User signed out, clearing data');
      queryClient.clear();
      navigate('/', { replace: true });
    }
    
    // User signed in (didn't have user, now does)
    else if (!prevUser && user) {
      console.log('🔄 StoreInitializer: User signed in:', user.id);
      // Invalidate queries to force refetch with new user
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      queryClient.invalidateQueries({ queryKey: ['institutions'] });
    }
    
    // User changed (different user ID)
    else if (prevUser && user && prevUser.id !== user.id) {
      console.log('🔄 StoreInitializer: User changed from', prevUser.id, 'to', user.id);
      queryClient.clear(); // Clear old user's data
      // Force reload to get fresh data for new user
      window.location.reload();
    }

    // Update refs for next comparison
    prevUserRef.current = user;
    prevSessionRef.current = session;
  }, [user, session, isLoading, queryClient, navigate]);

  return null;
}