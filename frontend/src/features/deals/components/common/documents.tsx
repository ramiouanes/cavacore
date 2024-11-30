import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDropzone } from 'react-dropzone';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Check,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DealDocument, DocumentsProps } from '../../types/document.types';
import { DocumentPreview } from './document-preview';
// import { DocumentPreview } from './document-preview';


// interface DealDocument {
//   id: string;
//   type: string;
//   name: string;
//   url: string;
//   uploadedBy: string;
//   uploadDate: string;
//   status: 'pending' | 'approved' | 'rejected';
//   version: number;
//   metadata?: {
//     size?: number;
//     mimeType?: string;
//     checksum?: string;
//     reviewedBy?: string;
//     reviewDate?: string;
//     rejectionReason?: string;
//   };
// }

// interface DocumentsProps {
//   documents: DealDocument[];
//   onUpload?: (files: File[]) => void;
//   onDownload?: (document: DealDocument) => void;
//   onPreview?: (document: DealDocument) => void;
//   onDelete?: (document: DealDocument) => void;
//   onApprove?: (document: DealDocument) => void;
//   onReject?: (document: DealDocument) => void;
//   className?: string;
//   canManage?: boolean;
// }

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
};

const getValidationMessage = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return `File ${file.name} exceeds maximum size of 15MB`;
  }

  if (!Object.entries(ACCEPTED_TYPES).some(([mime, exts]) =>
    exts.some(ext => file.name.toLowerCase().endsWith(ext))
  )) {
    return `File ${file.name} has invalid type. Accepted: PDF, DOC, DOCX, JPG, PNG`;
  }

  return null;
};

const getDocumentStatus = (doc: DealDocument) => {
  if (doc.status === 'rejected') return 'error';
  if (doc.status === 'pending') return 'warning';
  return 'success';
};


export function Documents({
  documents,
  onUpload,
  onDownload,
  onDelete,
  onApprove,
  onReject,
  className,
  canManage = false
}: DocumentsProps) {
  const [selectedDoc, setSelectedDoc] = useState<DealDocument | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const [uploadProgress] = useState<Record<string, number>>({});
  const [previewDoc, setPreviewDoc] = useState<DealDocument | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});



  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles, rejectedFiles) => {
      // Clear previous errors
      setValidationErrors({});

      // Validate each rejected file
      rejectedFiles.forEach(({ file, errors }) => {
        setValidationErrors(prev => ({
          ...prev,
          [file.name]: errors.map(e => e.message).join(', ')
        }));
      });

      // Validate accepted files
      const newErrors: Record<string, string> = {};
      acceptedFiles.forEach(file => {
        const error = getValidationMessage(file);
        if (error) newErrors[file.name] = error;
      });

      if (Object.keys(newErrors).length > 0) {
        setValidationErrors(prev => ({ ...prev, ...newErrors }));
        return;
      }

      if (onUpload) {
        try {
          await onUpload(acceptedFiles);
        } catch (error) {
          setValidationErrors(prev => ({
            ...prev,
            upload: error instanceof Error ? error.message : 'Upload failed'
          }));
        }
      }
    },
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true
  });



  const getStatusColor = (status: DealDocument['status']) => {
    switch (status) {
      case 'approved':
        return 'text-green-500';
      case 'rejected':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status: DealDocument['status']) => {
    switch (status) {
      case 'approved':
        return Check;
      case 'rejected':
        return X;
      default:
        return AlertCircle;
    }
  };

  const handlePreview = useCallback((document: DealDocument) => {
    console.log('Previewing document:', document);
    setPreviewDoc(document);
  }, []);


  const handleAction = async (action: 'delete' | 'approve' | 'reject') => {
    if (!selectedDoc) return;

    try {
      setLoading(selectedDoc.id);
      switch (action) {
        case 'delete':
          if (onDelete) await onDelete(selectedDoc.id);
          setShowDeleteDialog(false);
          toast({
            title: 'Document deleted',
            description: 'The document has been deleted successfully'
          });
          break;

        case 'approve':
          if (onApprove) await onApprove(selectedDoc.id);
          toast({
            title: 'Document approved',
            description: 'The document has been approved successfully'
          });
          break;

        case 'reject':
          if (onReject) await onReject(selectedDoc.id, rejectReason);
          setShowRejectDialog(false);
          setRejectReason('');
          toast({
            title: 'Document rejected',
            description: 'The document has been rejected'
          });
          break;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action} document`,
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
      setSelectedDoc(null);
    }
  };


  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Documents ({documents.length})</h3>
        {canManage && onUpload && (
          <Button
            {...getRootProps()}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <input {...getInputProps()} />
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        )}
      </div>

      {isDragActive && (
        <div className="border-2 border-dashed border-primary rounded-lg p-8 mb-4 text-center">
          <p>Drop files here to upload</p>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {documents.map((doc) => {
            const StatusIcon = getStatusIcon(doc.status);

            return (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{doc.name}</p>
                          <div className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                            getStatusColor(doc.status)
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {doc.status}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                          {doc.metadata?.size && ` • ${Math.round(doc.metadata.size / 1024)
                            } KB`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {uploadProgress[doc.id] !== undefined && (
                        <Progress
                          value={uploadProgress[doc.id]}
                          className="w-24"
                        />
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handlePreview(doc)}
                            className="gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </DropdownMenuItem>
                          {onDownload && (
                            <DropdownMenuItem
                              onClick={() => onDownload(doc)}
                              className="gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </DropdownMenuItem>
                          )}
                          {canManage && (
                            <>
                              {doc.status === 'pending' && onApprove && (
                                <DropdownMenuItem
                                  onClick={() => onApprove(doc.id)}
                                  className="gap-2 text-green-500"
                                >
                                  <Check className="w-4 h-4" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {doc.status === 'pending' && onReject && (
                                <DropdownMenuItem
                                  onClick={() => onReject(doc.id, rejectReason)}
                                  className="gap-2 text-destructive"
                                >
                                  <X className="w-4 h-4" />
                                  Reject
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedDoc(doc);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="gap-2 text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {doc.metadata?.rejectionReason && doc.status === 'rejected' && (
                    <div className="mt-2 pt-2 border-t text-sm text-destructive">
                      Rejection reason: {doc.metadata.rejectionReason}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDoc?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading === selectedDoc?.id}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction('delete')}
              disabled={loading === selectedDoc?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading === selectedDoc?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Document</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting "{selectedDoc?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              value={rejectReason}
              className="h-12 bg-white/50 focus:bg-white transition-colors duration-300"
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              disabled={loading === selectedDoc?.id}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading === selectedDoc?.id}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction('reject')}
              disabled={loading === selectedDoc?.id || !rejectReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading === selectedDoc?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog
        open={showApproveDialog}
        onOpenChange={setShowApproveDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve "{selectedDoc?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading === selectedDoc?.id}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAction('approve')}
              disabled={loading === selectedDoc?.id}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading === selectedDoc?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onDownload={onDownload}
        />
      )}

    </div>
  );
}