import { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, Expand } from 'lucide-react';
import { ImagePreview } from './image-preview';
import { useSwipeable } from 'react-swipeable';

interface ImageGalleryProps {
  images: Array<{
    url: string;
    thumbnailUrl?: string;
    caption?: string;
  }>;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
}

export function ImageGallery({
  images,
  aspectRatio = 'landscape'
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handlers = useSwipeable({
    onSwipedLeft: () => navigate('next'),
    onSwipedRight: () => navigate('prev'),
    trackMouse: !isMobile,
    preventScrollOnSwipe: true
  });

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentIndex(current => {
      if (direction === 'prev') {
        return current === 0 ? images.length - 1 : current - 1;
      }
      return current === images.length - 1 ? 0 : current + 1;
    });
  };

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div 
          className="relative rounded-lg overflow-hidden bg-background-subtle"
          {...handlers}
        >
          <ImagePreview
            src={images[currentIndex].url}
            alt={images[currentIndex].caption || ''}
            aspectRatio={aspectRatio}
            priority
          />

          {/* Navigation Controls */}
          {images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between p-4">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('prev');
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('next');
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          )}

          {/* Image Counter */}
          {images.length > 1 && (
  <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm text-white text-sm z-10">

  {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Fullscreen Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
            onClick={() => setShowFullscreen(true)}
          >
            <Expand className="w-4 h-4" />
          </Button>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-6 gap-2">
            {images.map((image, index) => (
              <button
                key={image.url}
                onClick={() => setCurrentIndex(index)}
                className={`relative rounded-lg overflow-hidden transition-all ${
                  index === currentIndex 
                    ? 'ring-2 ring-primary' 
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <ImagePreview
                  src={image.thumbnailUrl || image.url}
                  alt={image.caption || ''}
                  aspectRatio="square"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
      <div className="relative w-full h-full" {...handlers}>
            <ImagePreview
              src={images[currentIndex].url}
              alt={images[currentIndex].caption || ''}
              className="w-full h-[90vh] object-contain"
              priority
            />

            {/* Fullscreen Navigation */}
            <div className="absolute inset-0 flex items-center justify-between p-4">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
                onClick={() => navigate('prev')}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
                onClick={() => navigate('next')}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm"
              onClick={() => setShowFullscreen(false)}
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Fullscreen Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/20 backdrop-blur-sm text-white text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}