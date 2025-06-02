
import { useState } from 'react';

interface AddPauseButtonProps {
  onAddPause: () => void;
}

const AddPauseButton = ({ onAddPause }: AddPauseButtonProps) => {
  const [showRipple, setShowRipple] = useState(false);
  const [showAffirmation, setShowAffirmation] = useState(false);

  const handleClick = () => {
    setShowRipple(true);
    setShowAffirmation(true);
    
    // Reset ripple after animation
    setTimeout(() => setShowRipple(false), 600);
    
    // Hide affirmation after showing it briefly
    setTimeout(() => setShowAffirmation(false), 2000);
    
    onAddPause();
  };

  return (
    <div className="mb-6">
      <button
        onClick={handleClick}
        className="relative w-full bg-lavender hover:bg-lavender/80 text-dark-gray font-medium py-4 px-6 rounded-2xl transition-all duration-200 overflow-hidden transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {/* Ripple effect */}
        {showRipple && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-2 bg-white/30 rounded-full animate-ripple"></div>
          </div>
        )}
        
        ADD NEW PAUSE ITEM
      </button>
      
      {/* Affirmation message */}
      {showAffirmation && (
        <div className="mt-3 text-center text-taupe text-sm font-medium animate-fade-in">
          You paused. That's presence.
        </div>
      )}
    </div>
  );
};

export default AddPauseButton;
