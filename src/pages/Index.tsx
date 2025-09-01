
import { useEffect, useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import PauseHeader from '../components/PauseHeader';
import { WelcomeWithValues } from '../components/WelcomeWithValues';
import ReviewBanner from '../components/ReviewBanner';
import AddPauseButton, { AddPauseButtonRef } from '../components/AddPauseButton';
import MainTabs from '../components/MainTabs';
import FooterLinks from '../components/FooterLinks';


import SignupModal from '../components/SignupModal';
import ItemReviewModal from '../components/ItemReviewModal';
import UsageLimitModal from '../components/UsageLimitModal';
import { useNotifications } from '../hooks/useNotifications';
import { useUserSettings } from '../hooks/useUserSettings';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { useUsageLimit } from '../hooks/useUsageLimit';

import { useModalStates } from '../hooks/useModalStates';
import { useItemReview } from '../hooks/useItemReview';
import { useIndexRedirects } from '../hooks/useIndexRedirects';
import { useSharedContent } from '../hooks/useSharedContent';
import GuestModeIndicator from '../components/GuestModeIndicator';
import { usePausedItems } from '../hooks/usePausedItems';
import PausedItemDetail from '../components/PausedItemDetail';
import PillQuickPauseBar from '../components/pill/PillQuickPauseBar';
import PillItem from '../components/pill/PillItem';
import ReadyToReviewPill from '../components/pill/ReadyToReviewPill';
import DesktopItemCard from '../components/DesktopItemCard';
import { useInstalledApp } from '../hooks/useInstalledApp';
import { Button } from '../components/ui/button';
import { platformNotificationService } from '../services/platformNotificationService';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { notificationsEnabled, loading: settingsLoading } = useUserSettings();
  // Removed sectionsExpanded state - no longer needed
  const addPauseButtonRef = useRef<AddPauseButtonRef>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { sharedContent, clearSharedContent } = useSharedContent();
  const [searchParams] = useSearchParams();
  const pillParam = searchParams.get('pill');
  const pillMode = pillParam ? pillParam === '1' : true;
  const usageLimit = useUsageLimit();
  
  // Custom hooks for managing different aspects of the page
  const modalStates = useModalStates();
  const itemReview = useItemReview();

  // Pill mode state (sorting and items)
  const { items, loading: itemsLoading, getItemsForReview, removeItem, updateItem } = usePausedItems();
  const [showImages, setShowImages] = useState(() => {
    const saved = localStorage.getItem('pocketpause-show-images');
    return saved !== null ? JSON.parse(saved) : true;
  });
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
  
  
  const now = Date.now();
  // First get ready items from the store function (authoritative source)
  const storeReadyItems = getItemsForReview ? getItemsForReview() : [];
  const readyItemIds = new Set(storeReadyItems.map(item => item.id));
  
  // Filter sorted items to exclude ready items (prevent duplicates)
  const currentPausedItems = sortedItems.filter((item) => {
    // Use the exact same timing logic as the stores for consistency
    const itemCheckInTime = item.checkInDate ? item.checkInDate.getTime() : Infinity;
    const isActuallyReady = itemCheckInTime <= now;
    const isInReadyList = readyItemIds.has(item.id);
    
    // Debug logging to see what's happening
    if (isActuallyReady || isInReadyList) {
      console.log('🔍 Filtering out item from paused list:', {
        itemId: item.id,
        itemName: item.itemName,
        isActuallyReady,
        isInReadyList,
        checkInTime: item.checkInTime,
        checkInDate: item.checkInDate
      });
    }
    
    // Item should be filtered out if EITHER condition is true
    const shouldRemoveFromPausedList = isInReadyList || isActuallyReady;
    
    // Return true to KEEP in paused list, false to REMOVE from paused list
    return !shouldRemoveFromPausedList;
  });
  
  // State for ready count with automatic updates
  const [readyCount, setReadyCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [compactQuickBar, setCompactQuickBar] = useState(false);
  const [hideBottomArea, setHideBottomArea] = useState(false); // Start open by default
  const [lastScrollY, setLastScrollY] = useState(0);
  const [sharedPrefill, setSharedPrefill] = useState<string | undefined>(undefined);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const installed = useInstalledApp();
  
  // Update ready count automatically every minute and when items change
  useEffect(() => {
    const updateReadyCount = () => {
      if (getItemsForReview) {
        const count = getItemsForReview().length;
        console.log('🔄 Updating ready count:', count);
        setReadyCount(count);
      }
    };

    // Update immediately
    updateReadyCount();
    
    // Set up interval to update every minute
    const interval = setInterval(updateReadyCount, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [getItemsForReview, items]); // Re-run when items change
  
  // Handle redirects for invitations
  useIndexRedirects();

  console.log('Index page render - Auth loading:', authLoading, 'Settings loading:', settingsLoading, 'User:', !!user);
  console.log('Mobile check - User agent:', navigator.userAgent);
  console.log('Mobile check - Screen size:', window.innerWidth, 'x', window.innerHeight);

  // Initialize notifications
  const { enableNotifications, testNotification } = useNotifications(notificationsEnabled);
  
  // Debug notification status
  const [notificationStatus, setNotificationStatus] = useState<string>('checking...');
  
  useEffect(() => {
    const checkNotificationStatus = () => {
      if (!('Notification' in window)) {
        setNotificationStatus('Browser does not support notifications');
        return;
      }
      
      const permission = Notification.permission;
      const serviceEnabled = platformNotificationService.getEnabled();
      const settingsEnabled = notificationsEnabled;
      
      setNotificationStatus(`Permission: ${permission}, Service: ${serviceEnabled}, Settings: ${settingsEnabled}`);
    };
    
    checkNotificationStatus();
    const interval = setInterval(checkNotificationStatus, 2000);
    return () => clearInterval(interval);
  }, [notificationsEnabled]);
  
  const handleRequestNotificationPermission = async () => {
    try {
      console.log('🔔 Requesting notification permission...');
      const success = await platformNotificationService.requestPermission();
      console.log('🔔 Permission request result:', success);
      
      if (success) {
        testNotification();
      } else {
        alert('Please allow notifications in your browser settings');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  // Handle shared content from other apps or PWA share target
  useEffect(() => {
    if (!sharedContent) return;
    const incoming = sharedContent.url || sharedContent.text || '';
    if (!incoming && !sharedContent.title) return;

    if (pillMode) {
      setSharedPrefill(incoming || sharedContent.title);
      setCompactQuickBar(false); // ensure Pause button is visible
    } else if (addPauseButtonRef.current) {
      modalStates.handleAddPause({
        link: sharedContent.url,
        itemName: sharedContent.title || sharedContent.text,
      });
    }
    clearSharedContent();
  }, [sharedContent, pillMode]);

  // Enhanced intelligent collapse - window scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollingDown = scrollTop > lastScrollY;
      const isMobile = window.innerWidth < 768;
      
      // Enhanced intelligent collapse logic for both mobile and desktop
      if (isMobile) {
        // Mobile: More responsive collapsing for better UX on small screens
        if (scrollingDown && scrollTop > 15) {
          setCompactQuickBar(true);
          if (scrollTop > 35) {
            setHideBottomArea(true);
          }
        } else if (!scrollingDown && scrollTop < 10) {
          setCompactQuickBar(false);
          setHideBottomArea(false);
        } else if (scrollTop === 0) {
          // Always expand when at top
          setCompactQuickBar(false);
          setHideBottomArea(false);
        }
      } else {
        // Desktop: Gentler collapsing with larger thresholds
        if (scrollingDown && scrollTop > 40) {
          setCompactQuickBar(true);
          if (scrollTop > 100) {
            setHideBottomArea(true);
          }
        } else if (!scrollingDown && scrollTop < 30) {
          setCompactQuickBar(false);
          setHideBottomArea(false);
        } else if (scrollTop === 0) {
          // Always expand when at top
          setCompactQuickBar(false);
          setHideBottomArea(false);
        }
      }
      
      setLastScrollY(scrollTop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Debug scroll container dimensions
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      console.log('📐 Container dimensions:', {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        offsetHeight: container.offsetHeight,
        canScroll: container.scrollHeight > container.clientHeight
      });
    }
  }, [items]); // Removed sectionsExpanded dependency

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

// Show main app to everyone - no more landing page redirect
console.log('Rendering main Index content');

  return (
    <>
      <div className="min-h-screen min-h-[100dvh] bg-background transition-colors duration-300 flex flex-col md:bg-gradient-to-br md:from-background md:via-background/95 md:to-accent/10">
        {/* Header area - moved outside container for precise alignment */}
        <div className={`flex-shrink-0 ${installed ? 'pt-4 sm:pt-6 md:pt-8 lg:pt-10' : 'pt-8 sm:pt-12 md:pt-14 lg:pt-16'}`}>
          <div className="max-w-sm md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
            <PauseHeader onProfileModalChange={(isOpen) => {
              console.log('Profile modal changed:', isOpen);
              setProfileModalOpen(isOpen);
              // When profile modal is open on desktop, collapse pause area to smallest form
              if (isOpen) {
                console.log('Collapsing pause area - setting compact=true');
                setCompactQuickBar(true);
                setHideBottomArea(false); // Keep footer visible but compact
              }
            }} />
          </div>
        </div>
        
        {/* Content area with exact same container */}
        <div className={`flex-shrink-0 max-w-sm md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12`}>
          <WelcomeWithValues />
          
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto max-w-sm md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 pb-40"
        >
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
              {readyCount > 0 && (
                <div className="mb-3 md:mb-6 w-full md:w-auto">
                  <ReadyToReviewPill count={readyCount} onClick={handleStartReview} />
                </div>
              )}
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newValue = !showImages;
                      setShowImages(newValue);
                      localStorage.setItem('pocketpause-show-images', JSON.stringify(newValue));
                    }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-muted/60 rounded-full transition-colors"
                    title={showImages ? 'Hide images' : 'Show images'}
                    aria-label={showImages ? 'Hide images' : 'Show images'}
                  >
                    {showImages ? (
                      <>
                        <Eye size={16} className="text-muted-foreground" />
                        <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">Images on</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={16} className="text-muted-foreground" />
                        <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">Images off</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-end gap-2 text-xs md:text-sm w-full" aria-label="Sort items">
                  <span className="text-muted-foreground">Sort:</span>
                  <button
                    className={`px-2 py-1 rounded-full border transition-all duration-200 md:px-3 md:py-2 ${sortMode === 'soonest' ? 'bg-primary/15 text-primary border-primary/30 md:bg-primary/20 md:shadow-sm' : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted md:hover:bg-muted/60'}`}
                    onClick={() => setSortMode('soonest')}
                    aria-label="Sort by ending soon"
                    title="Sort by ending soon"
                  >
                    Ending soon
                  </button>
                  <button
                    className={`px-2 py-1 rounded-full border transition-all duration-200 md:px-3 md:py-2 ${sortMode === 'newest' ? 'bg-primary/15 text-primary border-primary/30 md:bg-primary/20 md:shadow-sm' : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted md:hover:bg-muted/60'}`}
                    onClick={() => setSortMode('newest')}
                    aria-label="Sort by recently paused"
                    title="Sort by recently paused"
                  >
                    Recently paused
                  </button>
                </div>
              </div>


              {/* Current Paused Items Section */}
              {currentPausedItems.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-1 md:text-sm md:mb-4">
                    Paused Items ({currentPausedItems.length})
                  </div>
                  
                  {/* Desktop Grid Layout - 3 columns */}
                  <div className="hidden md:block">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 auto-rows-fr">
                      {itemsLoading ? (
                        Array.from({ length: 6 }, (_, i) => (
                          <div key={i} className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-xl shadow-sm animate-pulse">
                            <div className="h-1 w-full bg-muted/30 mb-4" />
                            <div className="p-4">
                              <div className="flex gap-3 mb-3">
                                <div className="w-16 h-16 bg-muted/40 rounded-lg" />
                                <div className="flex-1">
                                  <div className="h-4 bg-muted/40 rounded mb-2" />
                                  <div className="h-3 bg-muted/30 rounded mb-1" />
                                  <div className="h-3 bg-muted/30 rounded w-1/2" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        currentPausedItems.map((it) => (
                          <DesktopItemCard
                            key={it.id}
                            item={it}
                            showImages={showImages}
                            onClick={() => {
                              setSelectedItem(it);
                              setShowItemDetail(true);
                            }}
                            onEdit={(item, updates) => updateItem(item.id, updates)}
                            onDelete={removeItem}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Mobile List Layout */}
                  <div className="md:hidden space-y-2">
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
                </div>
              )}

              {/* Empty state */}
              {!itemsLoading && storeReadyItems.length === 0 && currentPausedItems.length === 0 && (
                <div className="text-center py-8 md:py-16 md:bg-card/20 md:backdrop-blur-sm md:rounded-2xl md:border md:border-border/30">
                  <div className="text-muted-foreground text-sm md:text-base">No paused items yet</div>
                  <div className="text-xs text-muted-foreground mt-1 md:text-sm md:mt-2">Add something below to get started</div>
                </div>
              )}
              
              <div aria-hidden className="h-16" />
            </>
          ) : (
            <>
              <ReviewBanner 
                itemsCount={itemReview.itemsForReview.length}
                onStartReview={handleStartReview}
              />
              {/* MainTabs component removed - My Pauses section no longer available */}
            </>
          )}

        </div>
      </div>
      
      {/* Fixed bottom area */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 bg-background border-t ${hideBottomArea ? 'translate-y-full' : 'translate-y-0'}`}
           style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {/* Container: full width on mobile, constrained on desktop */}
        <div className="w-full md:max-w-4xl lg:max-w-6xl md:mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4">
          {pillMode ? (
            <PillQuickPauseBar
              compact={compactQuickBar}
              prefillValue={sharedPrefill || ''}
              onExpandRequest={() => setCompactQuickBar(false)}
              onUrlEntry={() => {
                setHideBottomArea(false);
              }}
              onBarcodeScanned={() => {
                setHideBottomArea(false);
              }}
              onCollapseChange={(collapsed) => {
                setHideBottomArea(collapsed);
              }}
            />
          ) : (
            <AddPauseButton ref={addPauseButtonRef} onAddPause={modalStates.handleAddPause} isCompact={false} />
          )}
          {/* Only show FooterLinks when bottom area is not hidden */}
          {!hideBottomArea && <FooterLinks />}
        </div>
      </div>
      
      
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
          onEdit={async (item, updates) => {
            console.log('🖼️ Index: onEdit called with updates:', updates);
            await updateItem(item.id, updates);
            // Update the selected item with the new data
            setSelectedItem(currentItem => {
              if (currentItem && currentItem.id === item.id) {
                const updatedItem = { ...currentItem, ...updates };
                console.log('🖼️ Index: Updated selectedItem:', updatedItem);
                return updatedItem;
              }
              return currentItem;
            });
          }}
          currentUserId={user?.id}
        />
      )}

      <UsageLimitModal
        isOpen={usageLimit.showUsageLimitModal}
        onClose={usageLimit.closeUsageLimitModal}
        onSignUp={modalStates.handleShowSignup}
        freeItemsUsed={usageLimit.monthlyItemsUsed}
        maxFreeItems={usageLimit.maxFreeItems}
      />
    </>
  );
};

export default Index;
