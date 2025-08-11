
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
import { usePausedItems } from '../hooks/usePausedItems';
import PausedItemDetail from '../components/PausedItemDetail';
import PillQuickPauseBar from '../components/pill/PillQuickPauseBar';
import PillItem from '../components/pill/PillItem';
const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { notificationsEnabled, loading: settingsLoading } = useUserSettings();
  const [sectionsExpanded, setSectionsExpanded] = useState(false);
  const addPauseButtonRef = useRef<AddPauseButtonRef>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { sharedContent, clearSharedContent } = useSharedContent();
  const [searchParams] = useSearchParams();
  const isGuest = searchParams.get('guest') === '1';
  const pillParam = searchParams.get('pill');
  const pillMode = pillParam ? pillParam === '1' : true;
  
  // Custom hooks for managing different aspects of the page
  const modalStates = useModalStates();
  const itemReview = useItemReview();

  // Pill mode state (sorting and items)
  const { items, loading: itemsLoading, getItemsForReview, removeItem } = usePausedItems();
  const [sortMode, setSortMode] = useState<'soonest' | 'newest'>(
    (localStorage.getItem('pill_sort') as 'soonest' | 'newest') || 'soonest'
  );
  useEffect(() => {
    localStorage.setItem('pill_sort', sortMode);
  }, [sortMode]);
  const sortedItems = (items || []).slice().sort((a, b) =>
    sortMode === 'soonest'
      ? a.checkInDate.getTime() - b.checkInDate.getTime()
      : b.pausedAt.getTime() - a.pausedAt.getTime()
  );
  const currentPausedItems = sortedItems.filter((i) => i.checkInDate.getTime() > Date.now());
  const readyCount = (getItemsForReview && getItemsForReview())?.length || 0;
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [compactQuickBar, setCompactQuickBar] = useState(false);
  const [sharedPrefill, setSharedPrefill] = useState<string | undefined>(undefined);
  
  // Handle redirects for invitations
  useIndexRedirects();

  console.log('Index page render - Auth loading:', authLoading, 'Settings loading:', settingsLoading, 'User:', !!user);
  console.log('Mobile check - User agent:', navigator.userAgent);
  console.log('Mobile check - Screen size:', window.innerWidth, 'x', window.innerHeight);

  // Initialize notifications
  useNotifications(notificationsEnabled);

  // Handle shared content from other apps or PWA share target
  useEffect(() => {
    if (!sharedContent) return;
    const incoming = sharedContent.url || sharedContent.text || '';
    if (!incoming) return;

    if (pillMode) {
      setSharedPrefill(incoming);
      setCompactQuickBar(false); // ensure Pause button is visible
    } else if (addPauseButtonRef.current) {
      modalStates.handleAddPause({ url: sharedContent.url, text: sharedContent.text });
    }
    clearSharedContent();
  }, [sharedContent, pillMode]);

  // Fallback: also react to window scrolling (if body scrolls instead of the container)
  useEffect(() => {
    const onWinScroll = () => setCompactQuickBar(window.scrollY > 8);
    window.addEventListener('scroll', onWinScroll, { passive: true });
    return () => window.removeEventListener('scroll', onWinScroll);
  }, []);

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
      <div
        ref={scrollContainerRef}
        onScroll={(e) => setCompactQuickBar((e.currentTarget as HTMLDivElement).scrollTop > 8)}
        className={`min-h-screen min-h-[100dvh] bg-background transition-colors duration-300 overflow-y-auto ${
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
          {pillMode ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-2">
                <button
                  onClick={handleStartReview}
                  className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-foreground hover:bg-primary/15"
                >
                  Ready to review ({readyCount})
                </button>
                <div className="flex items-center gap-2 text-xs" aria-label="Sort items">
                  <span className="text-muted-foreground">Sort:</span>
                  <button
                    className={`px-2 py-1 rounded-full border ${sortMode === 'soonest' ? 'bg-primary/15 text-primary border-primary/30' : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'}`}
                    onClick={() => setSortMode('soonest')}
                    aria-label="Sort by ending soon"
                    title="Sort by ending soon"
                  >
                    Ending soon
                  </button>
                  <button
                    className={`px-2 py-1 rounded-full border ${sortMode === 'newest' ? 'bg-primary/15 text-primary border-primary/30' : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'}`}
                    onClick={() => setSortMode('newest')}
                    aria-label="Sort by recently paused"
                    title="Sort by recently paused"
                  >
                    Recently paused
                  </button>
                </div>
              </div>

              {/* Pill list */}
              <div className="space-y-2">
                {itemsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading…</div>
                ) : (
                  currentPausedItems.map((it) => (
                    <PillItem
                      key={it.id}
                      item={it}
                      onClick={() => {
                        setSelectedItem(it);
                        setShowItemDetail(true);
                      }}
                    />
                  ))
                )}
              </div>
              <div aria-hidden className="h-16" />
            </>
          ) : (
            <>
              <ReviewBanner 
                itemsCount={itemReview.itemsForReview.length}
                onStartReview={handleStartReview}
              />
              <MainTabs onSectionToggle={setSectionsExpanded} />
            </>
          )}

        </div>
      </div>
      
      {/* Sticky Footer with Add Pause Button and Footer Links */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 pt-4 pb-6 sm:pb-4 pb-safe z-40">
        <div className="max-w-sm md:max-w-lg lg:max-w-2xl mx-auto">
          {pillMode ? (
            <PillQuickPauseBar compact={compactQuickBar && !sharedPrefill} prefillValue={sharedPrefill} />
          ) : (
            <AddPauseButton ref={addPauseButtonRef} onAddPause={modalStates.handleAddPause} isCompact={sectionsExpanded} />
          )}
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

      {pillMode && selectedItem && (
        <PausedItemDetail
          item={selectedItem}
          items={sortedItems}
          currentIndex={sortedItems.findIndex((i) => i.id === selectedItem.id)}
          isOpen={showItemDetail}
          onClose={() => setShowItemDetail(false)}
          onDelete={(id: string) => {
            removeItem(id);
            setShowItemDetail(false);
          }}
          currentUserId={user?.id}
        />
      )}
    </>
  );
};

export default Index;
