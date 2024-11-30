// src/features/deals/contexts/deal-context.tsx

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  Deal
} from '../types/deal.types';
import { dealService } from '../services/deal-service';
import { useAuth } from '@/features/auth/contexts/auth-context';
import { useDealNotifications } from '../hooks/common/use-deal-notifications';

interface DealContextType {
  error: string | null;
  loading: boolean;
  createDeal: (data: Deal) => Promise<Deal>;
  clearError: () => void;
}

const DealContext = createContext<DealContextType | undefined>(undefined);

// interface DealProviderProps {
//   children: ReactNode;
// }

export function DealProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();


  const createDeal = useCallback(async (data: Deal): Promise<Deal> => {
    if (!user) {
      throw new Error('User must be logged in to create a deal');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await dealService.createDeal(data);
      const deal: Deal = {
        ...data,
        ...response
      };
      return deal;
    } catch (err: any) {
      setError(err.message || 'Failed to create deal');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <DealContext.Provider value={{
      error,
      loading,
      createDeal,
      clearError
    }}>
      {children}
    </DealContext.Provider>
  );
}

export function useDeal() {
  const context = useContext(DealContext);
  if (!context) {
    throw new Error('useDeal must be used within a DealProvider');
  }
  return context;
}