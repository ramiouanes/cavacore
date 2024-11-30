import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { PedigreeEntry } from '../../types';
import { ArrowDownToLine } from 'lucide-react';

interface PedigreeTreeProps {
  sire: PedigreeEntry;
  dam: PedigreeEntry;
  horseName: string;
  horseBreed: string;
  onSireUpdate?: (field: keyof PedigreeEntry, value: string) => void;
  onDamUpdate?: (field: keyof PedigreeEntry, value: string) => void;
}

export function PedigreeTree({ 
  sire, 
  dam, 
  horseName, 
  horseBreed 
}: PedigreeTreeProps) {
  const lineVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        duration: 0.5,
        ease: "easeInOut"
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="w-full py-8">
      <div className="relative flex flex-col items-center">
        {/* SVG Connection Lines */}
        <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"  // Add this
        preserveAspectRatio="none"  // Add this
        style={{ zIndex: 0 }}
        >
            <motion.path
                d="M50,20 L25,40"  // Updated path
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-muted-foreground"
                variants={lineVariants}
                initial="hidden"
                animate="visible"
            />
            <motion.path
                d="M50,20 L75,40"  // Updated path
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-muted-foreground"
                variants={lineVariants}
                initial="hidden"
                animate="visible"
            />
        </svg>

        {/* Horse Position (Center) */}
        <motion.div
          className="relative z-10 mb-12"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <Card className="px-6 py-3 bg-primary text-secondary-foreground">
            <div className="flex flex-col items-center gap-1">
              <span className="font-medium text-secondary">{horseName || 'Horse Name'}</span>
              <span className="text-sm text-secondary opacity-90">{horseBreed || 'Breed'}</span>
            </div>
          </Card>
        </motion.div>

        {/* Parents Level */}
        <div className="w-full flex justify-between px-4 relative z-10">
          {/* Sire */}
          <motion.div
            className="w-[45%]"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              <h4 className="font-medium text-sm text-primary mb-1">Sire</h4>
              <div className="space-y-1">
                <p className="text-sm truncate">{sire.name || 'Not Specified'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {sire.breed || 'Breed not specified'}
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Dam */}
          <motion.div
            className="w-[45%]"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              <h4 className="font-medium text-sm text-primary mb-1">Dam</h4>
              <div className="space-y-1">
                <p className="text-sm truncate">{dam.name || 'Not Specified'}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {dam.breed || 'Breed not specified'}
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}