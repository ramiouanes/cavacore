import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const handleCancelConfirmation = (mode: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const dialog = document.createElement('div');
    document.body.appendChild(dialog);

    const CancelDialog = () => {
      const [open, setOpen] = useState(true);

      useEffect(() => {
        if (!open) {
          setTimeout(() => {
            document.body.removeChild(dialog);
          }, 150);
        }
      }, [open]);

      const dialogTitle = mode === 'edit' ? 'Cancel Deal Editing' : 'Cancel Deal Creation';

      const action = mode === 'edit' ? 'Editing' : 'Creating';

      return (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent className="max-w-[400px] p-6 gap-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-semibold">
                {dialogTitle}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base text-muted-foreground">
                Are you sure you want to cancel? All progress will be lost and cannot be recovered.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel 
                onClick={() => {
                  setOpen(false);
                  resolve(false);
                }}
                className="hover:bg-secondary/80"
              >
                Keep {action}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setOpen(false);
                  resolve(true);
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                {dialogTitle}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    };

    createRoot(dialog).render(<CancelDialog />);
  });
};