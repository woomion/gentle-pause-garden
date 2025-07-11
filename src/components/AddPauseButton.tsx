
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
      className="relative w-full bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-white font-medium py-4 px-6 rounded-2xl transition-all duration-200 overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
      style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
    >
      {/* Ripple effect */}
      {showRipple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 bg-lavender/30 rounded-full animate-ripple"></div>
        </div>
      )}
      
      ADD NEW PAUSE ITEM
    </button>
  );
};

export default AddPauseButton;
