import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { ImagePreview } from './image-preview';
import { Plus, X } from 'lucide-react';
import type { MediaItem } from '@/features/horses/types';
// import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { v4 as uuidv4 } from 'uuid';

interface ImageUploadProps {
  maxFiles?: number;
  value?: MediaItem[];
  onChange?: (files: MediaItem[]) => void;
  onError?: (error: string) => void;
}

export function ImageUpload({
  maxFiles = 20,
  value = [],
  onChange,
  onError
}: ImageUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: async (acceptedFiles) => {
      // Handle file drops
      if (value.length + acceptedFiles.length > maxFiles) {
        onError?.(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const newFiles = await Promise.all(
        acceptedFiles.map(async (file) => ({
          id: uuidv4(),
          file,
          preview: URL.createObjectURL(file),
          type: 'image' as const,
          caption: '',
          isMain: false
        }))
      );

      onChange?.([...value, ...newFiles]);
    }
  });

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition-colors">
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Plus className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {value.map((item) => (
          
          <div key={item.id} className="relative group">
                              <div className="relative aspect-square">

            <ImagePreview
              src={item.preview || ''}
              alt={item.caption || ''}
              aspectRatio="square"
              className="rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                const newFiles = value.filter(f => f.id !== item.id);
                onChange?.(newFiles);
                if (item.preview) URL.revokeObjectURL(item.preview);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
            {item.isMain && (
                      <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                        Main Image
                      </div>
                    )}

</div>


            <div className="p-3 space-y-2">
            <Input
                placeholder="Add caption..."
                value={item.caption}
                onChange={() => item.caption = value[0].caption}
                className="h-12 bg-white/50 focus:bg-white transition-colors duration-300"
                />
            
            {!item.isMain && (
                <Button
                variant="outline"
                size="sm"
                className="text-primary hover:text-primary/80 transition-colors"
                onClick={() => {
                    const updatedFiles = value.map(file => ({
                        ...file,
                        isMain: file.id === item.id
                    }));
                    onChange?.(updatedFiles);
                }}
                >
                Set as Main Image
                </Button>
            )}
            
            </div>

          </div>

          
        ))}
      </div>
    </div>
  );
}

