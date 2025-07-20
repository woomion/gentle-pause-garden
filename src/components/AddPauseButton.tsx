import { useState, useEffect } from 'react';

interface AddPauseButtonProps {
  onAddPause: () => void;
  isCompact?: boolean; // Add prop to control size
}

const AddPauseButton = ({ onAddPause, isCompact = false }: AddPauseButtonProps) => {
  const [showRipple, setShowRipple] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 100); // Compact after scrolling 100px
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    setShowRipple(true);
    
    // Reset ripple after animation
    setTimeout(() => setShowRipple(false), 600);
    
    onAddPause();
  };

  // Determine if button should be compact
  const shouldBeCompact = isCompact || isScrolled;

  return (
    <button
      onClick={handleClick}
      className={`relative w-full bg-lavender hover:bg-lavender-hover text-dark-gray font-medium px-6 transition-all duration-300 overflow-hidden transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg rounded-2xl ${
        shouldBeCompact 
          ? 'py-4 sm:py-3' 
          : 'py-20 sm:py-8'
      }`}
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