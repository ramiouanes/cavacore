import { motion, AnimatePresence } from 'framer-motion';
import { DealCard } from './deal-card';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Deal } from '../../types/deal.types';
import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button';
// import { Horse } from '@/features/horses/types/index';

// interface DealCardProps extends Deal{
//   deal: dealWithHorse;
//   horse: Horse;
//   showActions?: boolean;
// }

interface DealGridProps {
  deals: Deal[];
  horseId: Deal["basicInfo"]["horseId"];
  loading?: boolean;
  showCreateCard?: boolean;
  className?: string;
}

export function DealGrid({
  deals,
  loading,
  showCreateCard = true,
  className
}: DealGridProps) {
  const navigate = useNavigate();

  const AddDealCard = () => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => navigate('/deals/create')}
      className="relative aspect-square rounded-lg border border-dashed border-primary/20 bg-background hover:border-primary/50 transition-colors cursor-pointer group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 group-hover:from-primary/10 group-hover:to-primary/20 transition-colors" />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center border border-primary/20 group-hover:border-primary/50 transition-colors">
          <Plus className="w-8 h-8 text-primary/50 group-hover:text-primary transition-colors" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-primary">Create New Deal</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Start a new deal process
          </p>
        </div>
      </div>
    </motion.div>
  );


  if (loading) {
    return (
      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/3] bg-muted rounded-lg" />
            <div className="space-y-2 mt-4">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className={cn(
        "hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}>
        <div className="text-center py-12">
          <h1 className="text-xl font-medium text-muted-foreground">No deals found</h1>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
          <AddDealCard />
        </div>
      </div>
    );
  }

  return (
    <>
    {/* Mobile horizontal scroll */}
    <div className="lg:hidden w-screen relative left-1/2 right-1/2 -mx-[50vw]">
        <div className="w-full overflow-x-auto">
          <div className="inline-flex gap-4 px-4 pb-6">
            {showCreateCard && (
              <div className="w-[280px] shrink-0">
                <AddDealCard />
              </div>
            )}
            {deals.map((deal) => (
              <div key={deal.id} className="w-[280px] shrink-0">
                <DealCard
                    deal={deal}
                    {...deal}
                  />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop grid */}
      <div className={cn(
        "hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}>
        {showCreateCard && <AddDealCard />}
        <AnimatePresence mode="popLayout">
          {deals.map((deal) => (
            <motion.div
              key={deal.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <DealCard
                deal={deal}
                horse={deal.horse}
                id={deal.id}
                basicInfo={deal.basicInfo}
                terms={deal.terms}
                timeline={deal.timeline}
                participants={deal.participants}
                documents={deal.documents}
                createdById={deal.createdById}
                createdAt={deal.createdAt}
                updatedAt={deal.updatedAt}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}