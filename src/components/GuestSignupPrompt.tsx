import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuestSignupPromptProps {
  itemName?: string;
  onDismiss: () => void;
}

const GuestSignupPrompt: React.FC<GuestSignupPromptProps> = ({ itemName, onDismiss }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="max-w-md mx-auto bg-card border border-border rounded-2xl shadow-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {itemName ? `"${itemName}" is paused!` : 'Item paused!'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create an account to save it and get a reminder when it's ready for review.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 hover:bg-muted rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button 
            onClick={() => navigate('/auth?redirect=/')} 
            size="sm" 
            className="flex-1 rounded-full"
          >
            Sign up free
          </Button>
          <Button 
            onClick={onDismiss} 
            variant="ghost" 
            size="sm"
            className="rounded-full"
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestSignupPrompt;
