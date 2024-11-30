// src/features/horses/components/search/enhanced-search-filters.tsx

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Filter, X } from 'lucide-react';
import { useHorseSearch } from '@/features/horses/contexts/horse-search-context';
import { HorseGender, DisciplineLevel } from '../../types';

const HORSE_BREEDS = [
  'Thoroughbred',
  'Arabian',
  'Quarter Horse',
  'Warmblood',
  'Friesian',
  'Andalusian',
  'Appaloosa',
  'Morgan',
  'Paint Horse',
  'Tennessee Walker',
];

const DISCIPLINES = [
  'Dressage',
  'Show Jumping',
  'Eventing',
  'Western Pleasure',
  'Trail Riding',
  'Reining',
  'Barrel Racing',
  'Cross Country',
];

const COLORS = [
  'Bay',
  'Black',
  'Chestnut',
  'Grey',
  'Palomino',
  'Pinto',
  'Roan',
  'Sorrel',
  'White',
  'Buckskin',
];

export function EnhancedSearchFilters() {
  const { filters, setFilters } = useHorseSearch();
  const [isOpen, setIsOpen] = useState(false);

  const handleClearFilters = () => {
    setFilters({});
    setIsOpen(false);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value =>
      value !== undefined && value !== ''
    ).length;
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setIsOpen(true)}
        >
          <Filter className="w-4 h-4 mr-2"/>
          Filters
          {getActiveFilterCount() > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs">
              {getActiveFilterCount()}
            </span>
          )}
        </Button>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:block w-80">
        <div className="space-y-6 p-8 border rounded-xl bg-white/50 backdrop-blur-sm">
          <div>
            <h3 className="font-medium mb-3">Breed</h3>
            <Select
              value={filters.breed || "all"}
              onValueChange={(value) => setFilters({
                ...filters,
                breed: value === "all" ? undefined : value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Breeds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Breeds</SelectItem>
                {HORSE_BREEDS.map((breed) => (
                  <SelectItem key={breed} value={breed.toLowerCase()}>
                    {breed}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-3">Gender</h3>
            <Select
              value={filters.gender || "all"}
              onValueChange={(value) => setFilters({
                ...filters,
                gender: value === "all" ? undefined : value as HorseGender
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Gender</SelectItem>
                {Object.values(HorseGender).map((gender) => (
                  <SelectItem key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-3">Age Range</h3>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="0"
                max="40"
                placeholder="Min"
                value={filters.minAge || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  minAge: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="w-20"
              />
              <span>to</span>
              <Input
                type="number"
                min="0"
                max="40"
                placeholder="Max"
                value={filters.maxAge || ''}
                onChange={(e) => setFilters({
                  ...filters,
                  maxAge: e.target.value ? parseInt(e.target.value) : undefined
                })}
                className="w-20"
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">Color</h3>
            <Select
              value={filters.color || "all"}
              onValueChange={(value) => setFilters({
                ...filters,
                color: value === "all" ? undefined : value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any Color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Color</SelectItem>
                {COLORS.map((color) => (
                  <SelectItem key={color} value={color.toLowerCase()}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <h3 className="font-medium mb-3">Discipline</h3>
            <Select
              value={filters.discipline || "all"}
              onValueChange={(value) => setFilters({
                ...filters,
                discipline: value === "all" ? undefined : value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any Discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Discipline</SelectItem>
                {DISCIPLINES.map((discipline) => (
                  <SelectItem key={discipline} value={discipline.toLowerCase()}>
                    {discipline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={handleClearFilters}
            className="w-full transition-colors duration-300 hover:bg-primary hover:text-white"
          >
            Clear All Filters
          </Button>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-full sm:w-[400px] bg-background p-6">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-2xl font-light tracking-wide text-primary-dark">Filters</SheetTitle>
            <SheetDescription className="text-sm tracking-wide">
              Refine your horse search
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div>
              <Label>Breed</Label>
              <Select
                value={filters.breed || "all"}
                onValueChange={(value) => setFilters({
                  ...filters,
                  breed: value === "all" ? undefined : value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Breeds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Breeds</SelectItem>
                  {HORSE_BREEDS.map((breed) => (
                    <SelectItem key={breed} value={breed.toLowerCase()}>
                      {breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="font-medium mb-3">Gender</h3>
              <Select
                value={filters.gender || "all"}
                onValueChange={(value) => setFilters({
                  ...filters,
                  gender: value === "all" ? undefined : value as HorseGender
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Gender</SelectItem>
                  {Object.values(HorseGender).map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="font-medium mb-3">Age Range</h3>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="0"
                  max="40"
                  placeholder="Min"
                  value={filters.minAge || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    minAge: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  className="w-20"
                />
                <span>to</span>
                <Input
                  type="number"
                  min="0"
                  max="40"
                  placeholder="Max"
                  value={filters.maxAge || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    maxAge: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  className="w-20"
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Color</h3>
              <Select
                value={filters.color || "all"}
                onValueChange={(value) => setFilters({
                  ...filters,
                  color: value === "all" ? undefined : value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any Color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Color</SelectItem>
                  {COLORS.map((color) => (
                    <SelectItem key={color} value={color.toLowerCase()}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="font-medium mb-3">Discipline</h3>
              <Select
                value={filters.discipline || "all"}
                onValueChange={(value) => setFilters({
                  ...filters,
                  discipline: value === "all" ? undefined : value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any Discipline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Discipline</SelectItem>
                  {DISCIPLINES.map((discipline) => (
                    <SelectItem key={discipline} value={discipline.toLowerCase()}>
                      {discipline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                className="flex-1 text-secondary"
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