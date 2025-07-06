
import { useState, useEffect } from 'react';
import PauseHeader from '../components/PauseHeader';
import WelcomeMessage from '../components/WelcomeMessage';
import ReviewBanner from '../components/ReviewBanner';
import AddPauseButton from '../components/AddPauseButton';
import PausedSection from '../components/PausedSection';
import PauseLogSection from '../components/PauseLogSection';
import GreaterJoyFundCTA from '../components/GreaterJoyFundCTA';
import FooterLinks from '../components/FooterLinks';
import SupportCTA from '../components/SupportCTA';
import PauseForm from '../components/PauseForm';
import WelcomeModal from '../components/WelcomeModal';
import SignupModal from '../components/SignupModal';
import ItemReviewModal from '../components/ItemReviewModal';
import { useNotifications } from '../hooks/useNotifications';
import { useUserSettings } from '../hooks/useUserSettings';
import { useAuth } from '../contexts/AuthContext';
import { supabasePausedItemsStore, PausedItem } from '../stores/supabasePausedItemsStore';
import { pausedItemsStore, PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupModalDismissed, setSignupModalDismissed] = useState(false);
  const [userName, setUserName] = useState('');
  const [itemsForReview, setItemsForReview] = useState<(PausedItem | LocalPausedItem)[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const { user, loading: authLoading } = useAuth();
  const { notificationsEnabled, loading: settingsLoading } = useUserSettings();

  console.log('Index page render - Auth loading:', authLoading, 'Settings loading:', settingsLoading, 'User:', !!user);
  console.log('Mobile check - User agent:', navigator.userAgent);
  console.log('Mobile check - Screen size:', window.innerWidth, 'x', window.innerHeight);

  // Initialize notifications
  useNotifications(notificationsEnabled);

  // Check if this is the user's first visit or get user's name
  useEffect(() => {
    console.log('Index useEffect triggered - User:', !!user, 'Auth loading:', authLoading);
    
    if (user && !authLoading) {
      // Get user's first name from user metadata or profile
      const firstName = user.user_metadata?.first_name || '';
      setUserName(firstName);
      
      // Check if user needs welcome flow
      const hasCompletedWelcome = localStorage.getItem(`hasCompletedWelcome_${user.id}`);
      if (!hasCompletedWelcome && !firstName) {
        setShowWelcomeModal(true);
      }
    }
  }, [user, authLoading]);

  // Track items for review
  useEffect(() => {
    const updateItemsForReview = () => {
      if (user) {
        const reviewItems = supabasePausedItemsStore.getItemsForReview();
        setItemsForReview(reviewItems);
      } else {
        const reviewItems = pausedItemsStore.getItemsForReview();
        setItemsForReview(reviewItems);
      }
    };

    updateItemsForReview();

    let unsubscribe: (() => void) | undefined;
    let interval: NodeJS.Timeout | undefined;

    if (user) {
      unsubscribe = supabasePausedItemsStore.subscribe(updateItemsForReview);
      interval = setInterval(updateItemsForReview, 60000);
    } else {
      unsubscribe = pausedItemsStore.subscribe(updateItemsForReview);
      interval = setInterval(updateItemsForReview, 60000);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [user]);

  const handleStartReview = () => {
    setCurrentReviewIndex(0);
    setShowReviewModal(true);
  };

  const handleCloseReview = () => {
    setShowReviewModal(false);
    setCurrentReviewIndex(0);
  };

  const handleItemDecided = async (id: string) => {
    if (user) {
      await supabasePausedItemsStore.removeItem(id);
    } else {
      pausedItemsStore.removeItem(id);
    }
    setItemsForReview(prev => prev.filter(item => item.id !== id));
  };

  const handleNextReview = () => {
    setCurrentReviewIndex(prev => prev + 1);
  };

  const handleWelcomeComplete = (name: string) => {
    setUserName(name);
    if (user) {
      localStorage.setItem(`hasCompletedWelcome_${user.id}`, 'true');
    }
    setShowWelcomeModal(false);
  };

  const handleAddPause = () => {
    // Delay to allow ripple animation to complete
    setTimeout(() => {
      setShowForm(true);
    }, 650);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleShowSignup = () => {
    // Only show signup modal if user is not authenticated AND hasn't dismissed it
    if (!user && !signupModalDismissed) {
      setShowSignupModal(true);
    }
  };

  const handleCloseSignup = () => {
    setShowSignupModal(false);
    setSignupModalDismissed(true);
  };

  // Show loading screen while auth is loading
  if (authLoading) {
    console.log('Showing auth loading screen');
    return (
      <div className="min-h-screen min-h-[100dvh] bg-cream dark:bg-[#200E3B] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-black dark:text-[#F9F5EB] text-lg">Loading...</div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Please wait</div>
        </div>
      </div>
    );
  }

  console.log('Rendering main Index content');

  return (
    <>
      <div className="min-h-screen min-h-[100dvh] bg-cream dark:bg-[#200E3B] transition-colors duration-300">
        <div className="max-w-sm md:max-w-lg lg:max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <PauseHeader />
          <WelcomeMessage firstName={userName} />
          <ReviewBanner 
            itemsCount={itemsForReview.length}
            onStartReview={handleStartReview}
          />
          <AddPauseButton onAddPause={handleAddPause} />
          <PausedSection />
          <GreaterJoyFundCTA />
          <PauseLogSection />
          <SupportCTA />
          <FooterLinks />
        </div>
      </div>
      
      {showForm && (
        <PauseForm 
          onClose={handleCloseForm} 
          onShowSignup={handleShowSignup}
          signupModalDismissed={signupModalDismissed}
        />
      )}
      
      {user && (
        <WelcomeModal 
          open={showWelcomeModal} 
          onComplete={handleWelcomeComplete} 
        />
      )}
      
      <SignupModal 
        isOpen={showSignupModal} 
        onClose={handleCloseSignup} 
      />
      
      {showReviewModal && (
        <ItemReviewModal
          items={itemsForReview}
          currentIndex={currentReviewIndex}
          isOpen={showReviewModal}
          onClose={handleCloseReview}
          onItemDecided={handleItemDecided}
          onNext={handleNextReview}
        />
      )}
    </>
  );
};

export default Index;
