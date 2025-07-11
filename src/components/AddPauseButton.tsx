
import { useState } from 'react';

interface AddPauseButtonProps {
  onAddPause: () => void;
}

const AddPauseButton = ({ onAddPause }: AddPauseButtonProps) => {
  const [showRipple, setShowRipple] = useState(false);

  const handleClick = () => {
    setShowRipple(true);
    
    // Reset ripple after animation
    setTimeout(() => setShowRipple(false), 600);
    
    onAddPause();
  };

  return (
    <button
      onClick={handleClick}
      className="relative w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] shadow-lg min-h-[56px] flex items-center justify-center touch-manipulation"
      style={{ 
        boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
        minHeight: '56px' // Ensures thumb-friendly size
      }}
    >
      {/* Ripple effect */}
      {showRipple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 bg-white/30 rounded-full animate-ripple"></div>
        </div>
      )}
      
      <span className="font-bold text-base tracking-wide">
        ADD NEW PAUSE ITEM
      </span>
    </button>
  );
};

export default AddPauseButton;
