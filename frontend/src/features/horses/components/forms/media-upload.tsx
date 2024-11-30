// src/features/horses/components/forms/media-upload.tsx

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormStep } from '@/components/forms/form-step';
import { ImageUpload } from '@/components/ui/image/image-upload';
import { AlertCircle } from 'lucide-react';
import { MediaItem } from '../../types';

interface MediaUploadFormProps {
  onSubmit: (files: MediaItem[]) => void;
  onBack: () => void;
  maxFiles?: number;
  minFiles?: number;
  initialData?: MediaItem[];
  onUploadProgress?: (progress: number) => void;
}

export function MediaUploadForm({
  onSubmit,
  onBack,
  maxFiles = 20,
  minFiles = 2,
  initialData = [],
  onUploadProgress
}: MediaUploadFormProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaItem[]>(initialData);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFilesChange = (files: MediaItem[]) => {
    setMediaFiles(files);
    setErrors([]);
  };

  const handleError = (error: string) => {
    setErrors(prev => [...prev, error]);
  };

  const handleSubmit = useCallback(() => {
    if (mediaFiles.length < minFiles) {
      setErrors([`Please upload at least ${minFiles} images`]);
      return;
    }

    onSubmit(mediaFiles);
  }, [mediaFiles, minFiles, onSubmit]);

  return (
    <FormStep
      title="Media Upload"
      description="Upload photos of your horse (minimum 2, maximum 20)"
      currentStep={2}
      totalSteps={5}
      isValid={mediaFiles.length >= minFiles && errors.length === 0}
      onNext={handleSubmit}
      onPrev={onBack}
    >
      <div className="space-y-6">
        <ImageUpload
          maxFiles={maxFiles}
          value={mediaFiles}
          onChange={handleFilesChange}
          onError={handleError}
        />

        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg bg-destructive/10 p-4"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm font-medium">Upload Errors:</p>
              </div>
              <ul className="mt-2 space-y-1">
                {errors.map((error, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-destructive"
                  >
                    {error}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {mediaFiles.length} of {maxFiles} images uploaded
          </span>
          {mediaFiles.length < minFiles && (
            <span className="text-destructive">
              Minimum {minFiles} required
            </span>
          )}
        </div>
      </div>
    </FormStep>
  );
}