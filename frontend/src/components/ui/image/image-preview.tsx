import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ImagePreviewProps {
  src: string;
  alt?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function ImagePreview({
  src,
  alt = '',
  aspectRatio = 'square',
  className = '',
  priority = false,
  onLoad,
  onError
}: ImagePreviewProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  }[aspectRatio];

  React.useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setIsLoading(false);
      onLoad?.();
    };
    img.onerror = () => {
      setIsLoading(false);
      setError(true);
      onError?.();
    };
  }, [src, onLoad, onError]);

  return (
    <div className={`relative overflow-hidden rounded-lg ${aspectRatioClass} ${className} bg-background-subtle`}>
      {isLoading && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LoadingSpinner size="md" className="text-primary" />
        </motion.div>
      )}
      
      {error ? (
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <ImageIcon className="w-8 h-8 mb-2" />
          <span className="text-sm">Failed to load image</span>
        </motion.div>
      ) : (
        <motion.img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          className="absolute inset-0 w-full h-full object-cover transition-all"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ 
            opacity: isLoading ? 0 : 1,
            filter: isLoading ? 'blur(10px)' : 'blur(0px)'
          }}
          transition={{ 
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1]
          }}
        />
      )}
      
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none ${
          isMobile ? 'opacity-100' : ''
        }`}
      />
    </div>
  );
}
