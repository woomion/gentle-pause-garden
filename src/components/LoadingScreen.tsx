
import React from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500); // Show for 2.5 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="animate-scale-in animation-delay-300">
          <h1 className="text-foreground font-medium text-2xl sm:text-3xl tracking-wide mb-4">
            POCKET || PAUSE
          </h1>
        </div>
        
        {/* Animated Tagline */}
        <div className="animate-fade-in animation-delay-1000">
          <p className="text-muted-foreground text-sm sm:text-base">
            Mindful shopping starts here
          </p>
        </div>
        
        {/* Subtle loading indicator */}
        <div className="mt-8 animate-fade-in animation-delay-1500">
          <div className="w-8 h-8 mx-auto">
            <div className="w-full h-full border-2 border-lavender border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
