
import React from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  React.useEffect(() => {
    console.log('🎬 LoadingScreen: Starting...');
    
    try {
      // Check if user has seen the loading screen before
      const hasSeenLoading = localStorage.getItem('pocket-pause-seen-loading');
      console.log('🎬 LoadingScreen: Has seen before:', !!hasSeenLoading);
      
      const duration = hasSeenLoading ? 2000 : 5000; // 2s for returning users, 5s for new users
      console.log('🎬 LoadingScreen: Duration set to:', duration + 'ms');
      
      const timer = setTimeout(() => {
        try {
          console.log('🎬 LoadingScreen: Timer completed, marking as seen and calling onComplete');
          
          // Mark that user has seen the loading screen
          if (!hasSeenLoading) {
            localStorage.setItem('pocket-pause-seen-loading', 'true');
            console.log('🎬 LoadingScreen: Marked as seen in localStorage');
          }
          
          onComplete();
        } catch (error) {
          console.error('❌ LoadingScreen: Error in timer completion:', error);
          // Still call onComplete to avoid getting stuck
          onComplete();
        }
      }, duration);

      return () => {
        console.log('🎬 LoadingScreen: Cleanup - clearing timer');
        clearTimeout(timer);
      };
    } catch (error) {
      console.error('❌ LoadingScreen: Error in useEffect:', error);
      // If anything fails, just complete immediately
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
            POCKET || PAUSE
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
