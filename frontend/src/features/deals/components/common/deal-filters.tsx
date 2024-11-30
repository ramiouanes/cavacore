import { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  // SheetTrigger,
} from "@/components/ui/sheet";
import { Filter } from 'lucide-react';
import { DealType, DealStage, DealStatus } from '../../types/deal.types';

interface DealFiltersProps {
  filters: Record<string, any>;
  onFilterChange: (filters: Record<string, any>) => void;
  onClearFilters: () => void;
}

export function DealFilters({
  filters,
  onFilterChange,
  onClearFilters
}: DealFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value =>
      value !== undefined && value !== ''
    ).length;
  };

  const handleFilterChange = (key: string, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value === 'all' ? undefined : value
    });
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsOpen(true)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {getActiveFilterCount() > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
              {getActiveFilterCount()}
            </span>
          )}
        </Button>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:block w-70">
        <div className="space-y-6 p-6 border rounded-xl bg-card">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Filters</h3>
            {getActiveFilterCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Deal Type</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(DealType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Status</SelectItem>
                  {Object.values(DealStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Stage</Label>
              <Select
                value={filters.stage || "all"}
                onValueChange={(value) => handleFilterChange('stage', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Stage</SelectItem>
                  {Object.values(DealStage).map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Horse</Label>
              <Input
                value={filters.horseName || ''}
                onChange={(e) => handleFilterChange('horseName', e.target.value)}
                placeholder="Search by horse name"
              />
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
                <span>to</span>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-full sm:w-[400px]">
          <SheetHeader className="space-y-4">
            <SheetTitle className="text-2xl font-light tracking-wide text-primary-dark">
              Filters
            </SheetTitle>
            <SheetDescription>
              Refine your deal search
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 space-y-6">
            {/* Same filter content as desktop */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Deal Type</Label>
                <Select
                  value={filters.type || "all"}
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.values(DealType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Repeat other filter sections */}
              {/* ... */}
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={onClearFilters}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}