import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ValuesSetup } from './ValuesSetup';

interface ValuesSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  existingValues?: string[];
}

export const ValuesSetupModal: React.FC<ValuesSetupModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  existingValues
}) => {
  const handleComplete = () => {
    onComplete();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <ValuesSetup 
          onComplete={handleComplete}
          existingValues={existingValues}
        />
      </DialogContent>
    </Dialog>
  );
};