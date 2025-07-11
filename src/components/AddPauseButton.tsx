
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
      className="relative w-full bg-lavender hover:bg-lavender/90 text-white dark:text-black font-semibold py-4 px-6 rounded-2xl transition-all duration-200 overflow-hidden transform active:scale-[0.98] shadow-lg"
      style={{ boxShadow: '0 8px 24px rgba(214, 187, 247, 0.4)' }}
    >
      {/* Ripple effect */}
      {showRipple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 bg-white/30 rounded-full animate-ripple"></div>
        </div>
      )}
      
      ADD NEW PAUSE ITEM
    </button>
  );
};

export default AddPauseButton;
