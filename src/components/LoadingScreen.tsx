
import React from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  React.useEffect(() => {
    console.log('🎬 LoadingScreen: Starting...');
    
    try {
      const timer = setTimeout(() => {
        try {
          console.log('🎬 LoadingScreen: Timer completed, marking session as loaded');
          
          // Mark that loading screen was shown this session
          sessionStorage.setItem('pocket-pause-session-loaded', 'true');
          
          onComplete();
        } catch (error) {
          console.error('❌ LoadingScreen: Error in timer completion:', error);
          onComplete();
        }
      }, 3000); // 3 second loading animation

      return () => {
        console.log('🎬 LoadingScreen: Cleanup - clearing timer');
        clearTimeout(timer);
      };
    } catch (error) {
      console.error('❌ LoadingScreen: Error in useEffect:', error);
      setTimeout(onComplete, 100);
    }
  }, [onComplete]);

  console.log('🎬 LoadingScreen: Rendering...');

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo - visible immediately */}
        <div>
          <h1 className="text-foreground font-medium text-2xl sm:text-3xl tracking-wide mb-4">
            Pocket Pause
          </h1>
        </div>
        
        {/* Animated Tagline - fades in after 2 seconds */}
        <div className="animate-fade-in animation-delay-2000">
          <p className="text-muted-foreground text-sm sm:text-base">
            Mindful shopping starts here
          </p>
        </div>
        
        {/* Subtle loading indicator */}
        <div className="mt-8 animate-fade-in animation-delay-3000">
          <div className="w-8 h-8 mx-auto">
            <div className="w-full h-full border-2 border-lavender border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
