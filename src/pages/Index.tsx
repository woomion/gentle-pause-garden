
import { useEffect, useState, useRef } from 'react';
import PauseHeader from '../components/PauseHeader';
import WelcomeMessage from '../components/WelcomeMessage';
import ReviewBanner from '../components/ReviewBanner';
import AddPauseButton, { AddPauseButtonRef } from '../components/AddPauseButton';
import MainTabs from '../components/MainTabs';
import FooterLinks from '../components/FooterLinks';
import PauseForm from '../components/PauseForm';
import SignupModal from '../components/SignupModal';
import ItemReviewModal from '../components/ItemReviewModal';
import { useNotifications } from '../hooks/useNotifications';
import { useUserSettings } from '../hooks/useUserSettings';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

import { useModalStates } from '../hooks/useModalStates';
import { useItemReview } from '../hooks/useItemReview';
import { useIndexRedirects } from '../hooks/useIndexRedirects';
import { useSharedContent } from '../hooks/useSharedContent';
import GetApp from './GetApp';
import GuestModeIndicator from '../components/GuestModeIndicator';
const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { notificationsEnabled, loading: settingsLoading } = useUserSettings();
  const [sectionsExpanded, setSectionsExpanded] = useState(false);
  const addPauseButtonRef = useRef<AddPauseButtonRef>(null);
  const { sharedContent, clearSharedContent } = useSharedContent();
  const [searchParams] = useSearchParams();
  const isGuest = searchParams.get('guest') === '1';
  
  // Custom hooks for managing different aspects of the page
  const modalStates = useModalStates();
  const itemReview = useItemReview();
  
  // Handle redirects for invitations
  useIndexRedirects();

  console.log('Index page render - Auth loading:', authLoading, 'Settings loading:', settingsLoading, 'User:', !!user);
  console.log('Mobile check - User agent:', navigator.userAgent);
  console.log('Mobile check - Screen size:', window.innerWidth, 'x', window.innerHeight);

  // Initialize notifications
  useNotifications(notificationsEnabled);

  // Handle shared content from other apps
  useEffect(() => {
    if (sharedContent?.url && addPauseButtonRef.current) {
      modalStates.handleAddPause({ url: sharedContent.url });
      clearSharedContent();
    }
  }, [sharedContent]);

  const handleStartReview = () => {
    itemReview.resetReviewIndex();
    modalStates.handleStartReview('solo');
  };


  const handleCloseReview = () => {
    modalStates.handleCloseReview();
    itemReview.resetReviewIndex();
  };

  const handleShowSignupInternal = () => {
    // Only show signup modal if user is not authenticated AND hasn't dismissed it
    if (!user && !modalStates.signupModalDismissed) {
      modalStates.handleShowSignup();
    }
  };

  const handleFormClose = () => {
    // Clear the URL input when form closes after successful pause
    if (addPauseButtonRef.current) {
      addPauseButtonRef.current.clearUrl();
    }
    modalStates.handleCloseForm();
  };

  // Show loading screen while auth is loading
  if (authLoading) {
    console.log('Showing auth loading screen');
    return (
      <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-foreground text-lg">Loading...</div>
          <div className="mt-2 text-sm text-muted-foreground">Please wait</div>
        </div>
      </div>
    );
  }

// Show landing page for signed-out users unless guest preview is enabled
if (!user && !isGuest) {
  return <GetApp />;
}
console.log('Rendering main Index content');

  return (
    <>
      <div className={`min-h-screen min-h-[100dvh] bg-background transition-colors duration-300 overflow-y-auto ${
        sectionsExpanded ? 'pb-60 sm:pb-48 md:pb-56 lg:pb-64' : 'pb-36 sm:pb-48 md:pb-56 lg:pb-64'
      }`}>
        <div className="max-w-sm md:max-w-lg lg:max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pt-12 sm:pt-16">
          <PauseHeader />
          <GuestModeIndicator show={!user} />
          <WelcomeMessage firstName={user?.user_metadata?.first_name} />
          
          {/* Wisdom Orb Remnant - Hidden for now */}
          {/* 
          <div className="relative mb-6">
            <div className="absolute top-0 right-8 z-20">
              <button
                onClick={() => setWisdomOrbExpanded(!wisdomOrbExpanded)}
                className="relative group focus:outline-none"
              >
                {!wisdomOrbExpanded ? (
                  // Large glowing orb - very visible
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-75 animate-pulse"></div>
                    <div className="absolute inset-0 bg-purple-400 rounded-full blur-lg opacity-60 animate-pulse"></div>
                    <div className="relative w-6 h-6 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 rounded-full shadow-2xl shadow-purple-500/80 hover:scale-125 transition-all duration-300 cursor-pointer border-2 border-purple-300/50"></div>
                  </div>
                ) : (
                  // Expanded message
                  <div className="relative animate-scale-in">
                    <div className="absolute inset-0 bg-purple-400/20 dark:bg-purple-300/20 rounded-lg blur-md"></div>
                    <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-purple-200/50 dark:border-purple-400/30 rounded-lg px-3 py-2 shadow-lg max-w-xs">
                      <p className="text-xs text-gray-700 dark:text-gray-300 italic">
                        "I used to have 12 tabs open with carts... now I pause first. It's so freeing." 
                      </p>
                      <div className="mt-1 text-[10px] text-purple-600/70 dark:text-purple-400/70">
                        — another traveler ✨
                      </div>
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>
          */}
          <ReviewBanner 
            itemsCount={itemReview.itemsForReview.length}
            onStartReview={handleStartReview}
          />
          <MainTabs onSectionToggle={setSectionsExpanded} />
        </div>
      </div>
      
      {/* Sticky Footer with Add Pause Button and Footer Links */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 pt-4 pb-6 sm:pb-4 pb-safe z-40">
        <div className="max-w-sm md:max-w-lg lg:max-w-2xl mx-auto">
          <AddPauseButton ref={addPauseButtonRef} onAddPause={modalStates.handleAddPause} isCompact={sectionsExpanded} />
          <FooterLinks />
        </div>
      </div>
      
      {modalStates.showForm && (
        <PauseForm 
          onClose={handleFormClose} 
          onShowSignup={handleShowSignupInternal}
          signupModalDismissed={modalStates.signupModalDismissed}
          initialData={modalStates.formInitialData}
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
