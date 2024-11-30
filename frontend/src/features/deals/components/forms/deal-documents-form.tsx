import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormStep } from '@/components/forms/form-step';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import {
  AlertCircle,
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DealType, DealDocument } from '../../types/deal.types';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { authService } from '@/features/auth/services/auth-service';
import { FormField } from '@/components/forms/form-step';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParams } from 'react-router-dom';
import { useDealNotifications } from '../../hooks/common/use-deal-notifications';

// interface DocumentData {
//   id: string;
//   preview?: string;
//   type: string;
//   documentType?: string;
//   uploadProgress?: number;
//   name: string;
//   file?: File;
//   status: 'pending' | 'uploading' | 'complete' | 'error';
//   metadata?: Record<string, any>;
//   errorMessage?: string;

// }


// interface DealDocumentsFormProps {
//   onSubmit: (files: DocumentFile[]) => void;
//   onBack: () => void;
//   initialData?: DocumentFile[];
//   dealType: DealType;
//   currentStep: number;
//   totalSteps: number;
//   title: string;
//   description: string;
// }

interface DocumentFile extends DealDocument {
  uploadProgress?: number;
  errorMessage?: string;
  preview?: string;
  file?: File;
}

interface DealDocumentsFormProps {
  onSubmit: (files: DocumentFile[]) => void;
  onBack: () => void;
  initialData?: DocumentFile[];
  dealType: DealType;
  currentStep: number;
  totalSteps: number;
  title: string;
  description: string;

}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
};

const REQUIRED_DOCUMENTS: Record<DealType, string[]> = {
  [DealType.FULL_SALE]: [
    'Bill of Sale',
    'Transfer of Ownership',
    'Medical Records',
    'Liability Release'
  ],
  [DealType.LEASE]: [
    'Lease Agreement',
    'Insurance Certificate',
    'Condition Report'
  ],
  [DealType.PARTNERSHIP]: [
    'Partnership Agreement',
    'Financial Terms',
    'Ownership Share Documentation'
  ],
  [DealType.BREEDING]: [
    'Breeding Contract',
    'Health Certificate',
    'Registration Papers'
  ],
  [DealType.TRAINING]: [
    'Training Agreement',
    'Liability Release',
    'Training Schedule'
  ]
};

export function DealDocumentsForm({
  onSubmit,
  onBack,
  initialData = [],
  dealType,
  currentStep,
  totalSteps,
  title,
  description
}: DealDocumentsFormProps) {
  const [files, setFiles] = useState<DocumentFile[]>(initialData);
  const [errors, setErrors] = useState<string[]>([]);

  const { id } = useParams();

  useDealNotifications(id);

  const handleFilesChange = (files: DocumentFile[]) => {
    setFiles(files);
    setErrors([]);
  };

  const handleError = (error: string) => {
    setErrors(prev => [...prev, error]);
  };

  const handleSubmit = useCallback(() => {
    if (validateSubmission()) {
      onSubmit(files);
    }
  }, [files, onSubmit]);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    const newErrors = rejectedFiles.map(rejection =>
      `${rejection.file.name}: ${rejection.errors[0].message}`
    );

    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors]);
      return;
    }

    const user = await authService.getCurrentUser();

    // Process accepted files
    const newFiles = acceptedFiles.map(file =>
      Object.assign(file, {
        id: uuidv4(),
        documentType: REQUIRED_DOCUMENTS[dealType][0],
        file: file,
        url: URL.createObjectURL(file),
        preview: file.type.startsWith('image') ? URL.createObjectURL(file) : undefined,
        // uploadedBy: user.id.toString(),
        // uploadDate: new Date().toISOString(),
        // url: URL.createObjectURL(file),
        
        // metadata: {},
        // uploadProgress: 0,
        // version: 0,
        status: 'pending' as const
      })
    );

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true
  });

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const updateDocumentType = (id: string, type: string) => {
    setFiles(prev => prev.map(file =>
      file.id === id ? { ...file, documentType: type } : file
    ));
  };

  const validateSubmission = (): boolean => {
    const newErrors: string[] = [];
    const requiredDocs = REQUIRED_DOCUMENTS[dealType];
    const documentTypes = files.map(f => f.documentType);

    // Check if all required document types are present
    requiredDocs.forEach(docType => {
      if (!documentTypes.includes(docType)) {
        newErrors.push(`Missing required document: ${docType}`);
      }
    });

    // Check if all files have document types assigned
    files.forEach((file, index) => {
      if (!file.documentType) {
        newErrors.push(`Please select document type for ${file.file?.name}`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };



  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const getMissingDocuments = () => {
    const requiredDocs = REQUIRED_DOCUMENTS[dealType];
    const currentDocs = files.map(f => f.documentType);
    return requiredDocs.filter(doc => !currentDocs.includes(doc));
  };

  return (
    <FormStep
      title={title}
      description={description}
      currentStep={currentStep}
      totalSteps={totalSteps}
      isValid={errors.length === 0}
      onNext={handleSubmit}
      onPrev={onBack}
    >
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-medium">Required Documents</h3>
              </div>
              <Badge variant="outline" className="gap-1">
                {files.length} / {REQUIRED_DOCUMENTS[dealType].length} Uploaded
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {REQUIRED_DOCUMENTS[dealType].map((doc) => (
                <div
                  key={doc}
                  className={cn(
                    "p-2 rounded-lg border flex items-center gap-2",
                    files.some(f => f.documentType === doc)
                      ? "border-primary/20 bg-primary/5"
                      : "border-destructive/20 bg-destructive/5"
                  )}
                >
                  {files.some(f => f.documentType === doc) ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  )}
                  <span className="text-sm">{doc}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 transition-colors text-center",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted hover:border-primary/50",
            "cursor-pointer"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, DOC, DOCX, JPG, PNG (max 15MB)
            </p>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {files.map((file) => (
            <motion.div
              key={file.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium truncate">{file.file?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.file?.size ?? 0 / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id??'')}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <FormField
                      label=''
                    // required
                    >
                      <Select
                        value={file.documentType || ''}
                        onValueChange={(value) => updateDocumentType(file.id??'', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {REQUIRED_DOCUMENTS[dealType].map((type) => (
                            <SelectItem
                              key={type}
                              value={type}
                              className="capitalize"
                            >
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Badge
                        variant={file.status === 'rejected' ? 'destructive' : 'outline'}
                        className="capitalize"
                      >
                        {file.status}
                      </Badge>
                    </FormField>

                    {file.uploadProgress !== undefined && (
                      <Progress
                        value={file.uploadProgress}
                        className="mt-2"
                      />
                    )}

                    {file.errorMessage && (
                      <p className="text-sm text-destructive mt-2">
                        {file.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {(errors.length > 0 || getMissingDocuments().length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg bg-destructive/10 p-4"
            >
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm font-medium">Please address the following:</p>
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
                {getMissingDocuments().map((doc, index) => (
                  <motion.li
                    key={`missing-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-destructive"
                  >
                    Missing required document: {doc}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </FormStep>
  );
}