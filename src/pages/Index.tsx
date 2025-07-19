
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Timer } from 'lucide-react';
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
import { useSharedItemsReview } from '../hooks/useSharedItemsReview';
import SharedItemsReviewPill from '../components/SharedItemsReviewPill';
import { useIndexRedirects } from '../hooks/useIndexRedirects';
import { useWelcomeFlow } from '../hooks/useWelcomeFlow';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { notificationsEnabled, loading: settingsLoading } = useUserSettings();
  const [wisdomOrbExpanded, setWisdomOrbExpanded] = useState(false);
  
  // Custom hooks for managing different aspects of the page
  const modalStates = useModalStates();
  const itemReview = useItemReview();
  const sharedItemsReview = useSharedItemsReview();
  const { userName, handleWelcomeComplete, shouldShowWelcomeModal, shouldShowNameStep } = useWelcomeFlow();
  
  // Handle invitation acceptance from URL
  useInvitationHandler();
  
  // Handle redirects for invitations
  useIndexRedirects();

  console.log('Index page render - Auth loading:', authLoading, 'Settings loading:', settingsLoading, 'User:', !!user);
  console.log('Mobile check - User agent:', navigator.userAgent);
  console.log('Mobile check - Screen size:', window.innerWidth, 'x', window.innerHeight);

  // Initialize notifications
  useNotifications(notificationsEnabled);

  // Update welcome modal visibility for first-time visitors (guests and new users)
  useEffect(() => {
    if (!authLoading) {
      // Force show welcome modal for testing
      modalStates.setShowWelcomeModal(true);
    }
  }, [user, authLoading, modalStates]);

  const handleStartReview = () => {
    itemReview.resetReviewIndex();
    modalStates.handleStartReview('solo');
  };

  const handleStartPartnerReview = () => {
    itemReview.resetReviewIndex();
    modalStates.handleStartReview('partner');
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
      <div className="h-screen h-[100dvh] bg-cream dark:bg-[#200E3B] transition-colors duration-300 flex flex-col">
        {/* Header section with padding only on desktop */}
        <div className="px-4 md:px-6 py-2 md:py-8 flex-shrink-0">
          <div className="max-w-sm md:max-w-lg lg:max-w-2xl mx-auto">
            <PauseHeader showIntroText={true} />
          </div>
        </div>
        
        {/* Review Banners - Full width on mobile, no padding */}
        <div className="w-full flex-shrink-0">
          <ReviewBanner 
            itemsCount={itemReview.itemsForReview.length}
            onStartReview={handleStartReview}
          />
          {user && sharedItemsReview.sharedItemsCount > 0 && (
            <SharedItemsReviewPill
              sharedItemsCount={sharedItemsReview.sharedItemsCount}
              partnerNames={sharedItemsReview.partnerNames}
              onStartReview={handleStartPartnerReview}
            />
          )}
        </div>
        
        {/* Main Tabs - Full width on mobile, includes Add Pause button */}
        <div className="w-full flex-1 flex flex-col">
          <MainTabs onAddPause={modalStates.handleAddPause} />
        </div>
      </div>
      
      {modalStates.showForm && (
        <PauseForm 
          onClose={modalStates.handleCloseForm} 
          onShowSignup={handleShowSignupInternal}
          signupModalDismissed={modalStates.signupModalDismissed}
        />
      )}
      
      <WelcomeModal 
        open={shouldShowWelcomeModal(modalStates.showWelcomeModal)} 
        onComplete={handleWelcomeCompleteInternal}
        showNameStep={shouldShowNameStep()}
      />
      
      <SignupModal 
        isOpen={modalStates.showSignupModal} 
        onClose={modalStates.handleCloseSignup} 
      />
      
      {modalStates.showReviewModal && (
        <ItemReviewModal
          items={modalStates.reviewType === 'partner' ? sharedItemsReview.sharedItemsForReview : itemReview.itemsForReview}
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
