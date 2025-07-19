
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
      className="relative w-full h-full min-h-[300px] max-w-none mx-0 text-black dark:text-white font-medium transition-all duration-200 overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center text-xl rounded-none"
      style={{ 
        backgroundColor: '#C9B1FF', 
        boxShadow: '0 4px 12px rgba(201, 177, 255, 0.3), 0 2px 4px rgba(201, 177, 255, 0.2)'
      }}
    >
      {/* Ripple effect */}
      {showRipple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 bg-lavender/30 animate-ripple"></div>
        </div>
      )}
      
      + Add to Pause
    </button>
  );
};

export default AddPauseButton;
