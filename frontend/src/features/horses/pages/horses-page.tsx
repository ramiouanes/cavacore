import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
// import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EnhancedSearchFilters } from '../components/search/search-filters';
import { HorseGrid } from '../components/search/horse-grid';
import { HorseSearchProvider, useHorseSearch } from '../contexts/horse-search-context';
import { horseService } from '../services/horse-service';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/is-mobile';


function HorsesPageContent() {
  const navigate = useNavigate();
  const { filters, searchQuery, setSearchQuery } = useHorseSearch();
  const [page, setPage] = useState(1);
  const isMobile = useIsMobile();

  const { data, isLoading, error } = useQuery({
    queryKey: ['horses', filters, searchQuery, page],
    queryFn: () => horseService.searchHorses({
      searchQuery: searchQuery,
      ...filters,
      page,
      limit: 12
    })
  });

  if (error) {
    return (
      <div className="container mx-auto py-12">
        <Card className="p-6 text-center">
          <h3 className="text-lg font-medium text-destructive">Error loading deals</h3>
          <p className="text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header - Fixed portion */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-4 px-4 border-b">
        <div className="w-full max-w-screen-2xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-light tracking-wide text-primary-dark">
              Horse Hub
            </h1>
            <div className="flex w-full md:w-auto justify-center gap-2">

            {isMobile && (
              <EnhancedSearchFilters />
            )}

            

              <Button
                onClick={() => navigate('/horses/create')}
                className="gap-2 font-medium text-secondary"
              >
                <Plus className="w-4 h-4" />
                Create Horse
              </Button>
            </div>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-screen-2xl mx-auto px-4 py-0">
        <div className="flex flex-col lg:flex-row gap-6">

        {!isMobile && (
              <EnhancedSearchFilters />
            )}

          <div className="w-full lg:flex-1">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center py-12"
                >
                  <LoadingSpinner size="lg" />
                </motion.div>
              ) : (
                <HorseGrid
                  horses={data?.horses ?? []}
                  loading={isLoading}
                />
              )}
            </AnimatePresence>

            {/* Pagination... */}

            {data && data.total > 0 && (
              <div className="flex justify-center gap-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="w-32"
                >
                  Previous
                </Button>
                <span className="px-4 py-2 bg-background-subtle rounded-lg text-sm">
                  <span className="hidden md:inline">
                    Page {page} of {Math.ceil(data.total / 12)}
                  </span>
                  <span className="md:hidden">
                    {page}/{Math.ceil(data.total / 12)}
                  </span>
                </span>
                <Button
                  variant="outline"
                  disabled={page * 12 >= data.total}
                  onClick={() => setPage(p => p + 1)}
                  className="w-32"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HorsesPage() {
  return (
    <HorseSearchProvider>
      <HorsesPageContent />
    </HorseSearchProvider>
  );
}
