
import { useEffect } from 'react';
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
      if (user) {
        // For authenticated users - show if they haven't completed welcome
        const hasCompletedWelcome = localStorage.getItem(`hasCompletedWelcome_${user.id}`);
        if (!hasCompletedWelcome) {
          modalStates.setShowWelcomeModal(true);
        }
      } else {
        // For guests - show if they haven't completed welcome
        const hasCompletedWelcome = localStorage.getItem('hasCompletedWelcome_guest');
        if (!hasCompletedWelcome) {
          modalStates.setShowWelcomeModal(true);
        }
      }
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
      <div className="min-h-screen min-h-[100dvh] bg-cream dark:bg-[#200E3B] transition-colors duration-300 pb-32">
        <div className="max-w-sm md:max-w-lg lg:max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <PauseHeader />
          <WelcomeMessage firstName={userName} />
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
          <MainTabs />
          
          {/* Greater Joy Fund Section */}
          <div className="mb-4">
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md">
                <GreaterJoyFundCTA />
              </div>
            </div>
          </div>
          
          {/* Pause Log Section */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <Link 
                    to="/pause-log"
                    className="flex items-center justify-between hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <Timer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Decision Log</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">View your pause history</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors text-sm font-medium">
                      View Log
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <SupportCTA />
          <FooterLinks />
        </div>
      </div>
      
      {/* Sticky Footer with Add Pause Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-cream dark:bg-[#200E3B] border-t border-gray-200 dark:border-gray-700 px-4 pt-4 pb-8">
        <div className="max-w-sm md:max-w-lg lg:max-w-2xl mx-auto">
          <AddPauseButton onAddPause={modalStates.handleAddPause} />
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
