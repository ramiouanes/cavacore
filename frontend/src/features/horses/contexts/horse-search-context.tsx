// src/features/horses/contexts/horse-search-context.tsx

import { createContext, useContext, useState, ReactNode } from 'react';
import { Horse, HorseGender, DisciplineLevel } from '../types';

export type FilterOptions = {
  breed?: string;
  minPrice?: number;
  maxPrice?: number; 
  minAge?: number;
  maxAge?: number;
  color?: string;
  gender?: HorseGender;
  discipline?: string;
  level?: DisciplineLevel;
  location?: string;
  minHeight?: number;
  maxHeight?: number;
  registrationNumber?: string;
};

type SearchContextType = {
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  horses: Horse[];
  setHorses: (horses: Horse[]) => void;
  isLoading: boolean;
  error: Error | null;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

export function HorseSearchProvider({ children }: SearchProviderProps) {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [horses, setHorses] = useState<Horse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  return (
    <SearchContext.Provider 
      value={{ 
        filters, 
        setFilters, 
        searchQuery, 
        setSearchQuery,
        clearFilters,
        horses,
        setHorses,
        isLoading,
        error
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export const useHorseSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useHorseSearch must be used within HorseSearchProvider');
  }
  return context;
};