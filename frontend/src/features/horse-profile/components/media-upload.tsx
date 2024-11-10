import { useState, useCallback } from 'react';
import { FormStep, FormField } from '@/components/forms/form-step';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: 'image' | 'document';
}

interface MediaUploadFormProps {
  onSubmit: (files: MediaFile[]) => void;
  onBack: () => void;
  maxFiles?: number;
  minFiles?: number;
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const MediaUploadForm = ({
  onSubmit,
  onBack,
  maxFiles = 20,
  minFiles = 5,
}: MediaUploadFormProps) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'File type not supported. Please upload JPG, PNG, or WebP images.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size too large. Maximum size is 5MB.';
    }
    return null;
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const newErrors: string[] = [];
    const newFiles: MediaFile[] = [];

    Array.from(fileList).forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(`${file.name}: ${error}`);
        return;
      }

      if (mediaFiles.length + newFiles.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      newFiles.push({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        type: 'image'
      });
    });

    setMediaFiles(prev => [...prev, ...newFiles]);
    setErrors(newErrors);
  }, [mediaFiles.length, maxFiles]);

  const removeFile = (id: string) => {
    setMediaFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSubmit = () => {
    if (mediaFiles.length < minFiles) {
      setErrors([`Please upload at least ${minFiles} images`]);
      return;
    }
    onSubmit(mediaFiles);
  };

  return (
    <FormStep
      title="Media Upload"
      description="Upload photos of your horse (minimum 5, maximum 20)"
      currentStep={2}
      totalSteps={5}
      isValid={mediaFiles.length >= minFiles && errors.length === 0}
      onNext={handleSubmit}
      onPrev={onBack}
    >
      <div className="space-y-6">
        <div className="flex flex-col items-center p-8 border-2 border-dashed rounded-lg border-gray-300 hover:border-primary-light transition-colors">
          <Upload className="w-10 h-10 text-gray-400 mb-4" />
          <Button
            variant="outline"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            Select Images
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            onChange={handleFileChange}
          />
          <p className="mt-2 text-sm text-gray-500">
            JPG, PNG or WebP, up to 5MB each
          </p>
        </div>

        {errors.length > 0 && (
          <div className="text-red-500 text-sm">
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaFiles.map((file) => (
            <Card key={file.id} className="relative group">
              <img
                src={file.preview}
                alt="Preview"
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(file.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-sm text-gray-500">
          {mediaFiles.length} of {maxFiles} images uploaded
          {mediaFiles.length < minFiles && (
            <span className="text-red-500 ml-2">
              (Minimum {minFiles} required)
            </span>
          )}
        </div>
      </div>
    </FormStep>
  );
};