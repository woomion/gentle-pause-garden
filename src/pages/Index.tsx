
import { useEffect } from 'react';
import PauseHeader from '../components/PauseHeader';
import WelcomeMessage from '../components/WelcomeMessage';
import ReviewBanner from '../components/ReviewBanner';
import AddPauseButton from '../components/AddPauseButton';
import MainTabs from '../components/MainTabs';
import GreaterJoyFundCTA from '../components/GreaterJoyFundCTA';
import SupportCTA from '../components/SupportCTA';
import FooterLinks from '../components/FooterLinks';
import PauseForm from '../components/PauseForm';
import WelcomeModal from '../components/WelcomeModal';
import SignupModal from '../components/SignupModal';
import ItemReviewModal from '../components/ItemReviewModal';
import { useNotifications } from '../hooks/useNotifications';
import { useUserSettings } from '../hooks/useUserSettings';
import { useAuth } from '../contexts/AuthContext';
import { useInvitationHandler } from '../hooks/useInvitationHandler';
import { useModalStates } from '../hooks/useModalStates';
import { useItemReview } from '../hooks/useItemReview';
import { useIndexRedirects } from '../hooks/useIndexRedirects';
import { useWelcomeFlow } from '../hooks/useWelcomeFlow';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { notificationsEnabled, loading: settingsLoading } = useUserSettings();
  
  // Custom hooks for managing different aspects of the page
  const modalStates = useModalStates();
  const itemReview = useItemReview();
  const { userName, handleWelcomeComplete, shouldShowWelcomeModal } = useWelcomeFlow();
  
  // Handle invitation acceptance from URL
  useInvitationHandler();
  
  // Handle redirects for invitations
  useIndexRedirects();

  console.log('Index page render - Auth loading:', authLoading, 'Settings loading:', settingsLoading, 'User:', !!user);
  console.log('Mobile check - User agent:', navigator.userAgent);
  console.log('Mobile check - Screen size:', window.innerWidth, 'x', window.innerHeight);

  // Initialize notifications
  useNotifications(notificationsEnabled);

  // Update welcome modal visibility when user state changes
  useEffect(() => {
    if (user && !authLoading) {
      const firstName = user.user_metadata?.first_name || '';
      const hasCompletedWelcome = localStorage.getItem(`hasCompletedWelcome_${user.id}`);
      if (!hasCompletedWelcome && !firstName) {
        modalStates.setShowWelcomeModal(true);
      }
    }
  }, [user, authLoading, modalStates]);

  const handleStartReview = () => {
    itemReview.resetReviewIndex();
    modalStates.handleStartReview();
  };

  const handleCloseReview = () => {
    modalStates.handleCloseReview();
    itemReview.resetReviewIndex();
  };

  const handleWelcomeCompleteInternal = (name: string) => {
    handleWelcomeComplete(name);
    modalStates.setShowWelcomeModal(false);
  };

  const handleShowSignupInternal = () => {
    // Only show signup modal if user is not authenticated AND hasn't dismissed it
    if (!user && !modalStates.signupModalDismissed) {
      modalStates.handleShowSignup();
    }
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
            itemsCount={itemReview.itemsForReview.length}
            onStartReview={handleStartReview}
          />
          <AddPauseButton onAddPause={modalStates.handleAddPause} />
          <MainTabs />
          <GreaterJoyFundCTA />
          <SupportCTA />
          <FooterLinks />
        </div>
      </div>
      
      {modalStates.showForm && (
        <PauseForm 
          onClose={modalStates.handleCloseForm} 
          onShowSignup={handleShowSignupInternal}
          signupModalDismissed={modalStates.signupModalDismissed}
        />
      )}
      
      {user && (
        <WelcomeModal 
          open={shouldShowWelcomeModal(modalStates.showWelcomeModal)} 
          onComplete={handleWelcomeCompleteInternal} 
        />
      )}
      
      <SignupModal 
        isOpen={modalStates.showSignupModal} 
        onClose={modalStates.handleCloseSignup} 
      />
      
      {modalStates.showReviewModal && (
        <ItemReviewModal
          items={itemReview.itemsForReview}
          currentIndex={itemReview.currentReviewIndex}
          isOpen={modalStates.showReviewModal}
          onClose={handleCloseReview}
          onItemDecided={itemReview.handleItemDecided}
          onNext={itemReview.handleNextReview}
        />
      )}
    </>
  );
};

export default Index;
