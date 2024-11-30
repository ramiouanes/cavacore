// src/features/deals/components/document-preview.tsx

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Image, X, Download, Loader2 } from 'lucide-react';
import { DealDocument } from '../../types/document.types';
import { dealService } from '../../services/deal-service';


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface DocumentPreviewProps {
  document: DealDocument | null;
  onClose: () => void;
  onDownload?: (document: DealDocument) => Promise<void>;
}

export function DocumentPreview({ document, onClose, onDownload }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  useEffect(() => {
    if (!document) return;
    console.log('DocumentPreview', document);

    const loadPreview = async () => {
      try {
        setLoading(true);
        const url = await dealService.previewDocument(document.dealId!, document);
        setPreviewUrl(url);
      } catch (err) {
        setError('Failed to load preview');
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [document]);


  return (
    <Dialog open={!!document} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col [&>button]:hidden">
        <DialogHeader className="pb-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {document?.metadata?.mimeType?.startsWith('image/') ? (
                <Image className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
              {document?.documentType}
            </div>
            <div className="flex items-center gap-2">
              {onDownload && document && (
                <Button variant="outline" size="icon" onClick={() => onDownload(document)}>
                  <Download className="w-4 h-4" />
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative bg-muted rounded-lg mt-0">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2" />
                <p>{error}</p>
              </div>
            </div>
          )} 
            <embed
              src={previewUrl || ''}
              type={document?.metadata?.mimeType || 'application/pdf'}
              className="w-full h-full"
            />
          

        </div>
      </DialogContent>
    </Dialog>
  );
}


