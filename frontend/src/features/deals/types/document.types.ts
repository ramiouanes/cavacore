// src/features/deals/types/document.types.ts

export interface DocumentMetadata {
    size?: number;
    mimeType?: string;
    checksum?: string;
    reviewedBy?: string;
    reviewDate?: Date;
    rejectionReason?: string;
    [key: string]: any;
  }
  
  export interface DealDocument {
    id: string;
    type: string;
    documentType: string;
    name: string;
    url: string;
    uploadedBy: string;
    uploadDate: string;
    status: 'pending' | 'approved' | 'rejected';
    version: number;
    metadata?: DocumentMetadata;
    dealId?: string;
  }
  
  export interface DocumentUploadProgress {
    id: string;
    progress: number;
  }
  
  export interface DocumentsProps {
    documents: DealDocument[];
    onUpload?: (files: File[]) => Promise<void>;
    onDownload?: (documents: DealDocument | DealDocument[]) => Promise<void>;
    onDelete?: (documentId: string) => Promise<void>;
    onApprove?: (documentId: string) => Promise<void>;
    onReject?: (documentId: string, reason: string) => Promise<void>;
    onPreview?: (document: DealDocument) => void;
    className?: string;
    canManage?: boolean;
    showPreview?: boolean;
  }
  
  export interface DocumentAction {
    documentId: string;
    action: 'approve' | 'reject' | 'delete';
    reason?: string;
  }