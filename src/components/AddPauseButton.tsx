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
      className="relative w-full bg-lavender hover:bg-lavender-hover text-dark-gray font-medium py-6 sm:py-4 px-6 transition-all duration-200 overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg rounded-2xl"
    >
      {/* Ripple effect */}
      {showRipple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-2 h-2 bg-primary/30 rounded-full animate-ripple"></div>
        </div>
      )}
      
      + Add to Pause
    </button>
  );
};

export default AddPauseButton;