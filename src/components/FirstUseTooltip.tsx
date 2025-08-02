import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface FirstUseTooltipProps {
  show: boolean;
  onDismiss: () => void;
}

const FirstUseTooltip = ({ show, onDismiss }: FirstUseTooltipProps) => {
  if (!show) return null;

  return (
    <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="relative">
        {/* Gentle pulsing glow */}
        <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm animate-pulse"></div>
        
        {/* Main tooltip */}
        <div className="relative bg-white dark:bg-gray-800 border border-border rounded-lg px-4 py-3 shadow-lg max-w-xs">
          <button
            onClick={onDismiss}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-gray-800 border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={12} />
          </button>
          
          <p className="text-sm text-foreground font-medium">
            Ready to pause your first item? Paste a link
          </p>
          
          {/* Arrow pointing down */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border"></div>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800"></div>
        </div>
      </div>
    </div>
  );
};

export default FirstUseTooltip;