import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SettingsSection from './SettingsSection';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-4">
      <div className="bg-white dark:bg-[#200E3B] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB]">
            Settings
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <SettingsSection />
      </div>
    </div>
  );
};

export default SettingsModal;