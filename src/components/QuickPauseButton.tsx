import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

interface QuickPauseButtonProps {
  onQuickPause: () => void;
}

const QuickPauseButton = ({ onQuickPause }: QuickPauseButtonProps) => {
  const [showRipple, setShowRipple] = useState(false);

  const handleClick = () => {
    setShowRipple(true);
    
    // Reset ripple after animation
    setTimeout(() => setShowRipple(false), 600);
    
    onQuickPause();
  };

  return (
    <button
      onClick={handleClick}
      className="relative flex items-center justify-center w-10 h-10 text-black dark:text-white transition-all duration-200 overflow-hidden transform hover:scale-105 active:scale-95"
      style={{ 
        backgroundColor: '#C9B1FF', 
        boxShadow: '0 2px 8px rgba(201, 177, 255, 0.3)',
        borderRadius: '12px'
      }}
      title="Quick pause in-store"
    >
      {/* Ripple effect */}
      {showRipple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1 h-1 bg-lavender/30 rounded-full animate-ripple"></div>
        </div>
      )}
      
      <ShoppingBag size={18} />
    </button>
  );
};

export default QuickPauseButton;