
import { useEffect, useState, useRef } from 'react';
import { Eye, EyeOff, ArrowUp, ArrowDown, Columns, List } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import PauseHeader from '../components/PauseHeader';
import { WelcomeWithValues } from '../components/WelcomeWithValues';
import ReviewBanner from '../components/ReviewBanner';
import AddPauseButton, { AddPauseButtonRef } from '../components/AddPauseButton';
import MainTabs from '../components/MainTabs';
import FooterLinks from '../components/FooterLinks';
import { TestNotificationButton } from '../components/TestNotificationButton';
import EmptyStateCard from '../components/EmptyStateCard';


import SignupModal from '../components/SignupModal';
import ItemReviewModal from '../components/ItemReviewModal';
import UsageLimitModal from '../components/UsageLimitModal';
import { useNotifications } from '../hooks/useNotifications';
import { useUserSettings } from '../hooks/useUserSettings';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { useUsageLimit } from '../hooks/useUsageLimit';
import { toast } from 'sonner';

import { useModalStates } from '../hooks/useModalStates';
import { useItemReview } from '../hooks/useItemReview';
import { useIndexRedirects } from '../hooks/useIndexRedirects';
import { useSharedContent } from '../hooks/useSharedContent';
import '../utils/notificationDebug'; // Import debug utilities
import '../utils/testItemCreator'; // Import test item creator
import '../utils/autoTokenSetup'; // Auto setup push tokens
import { createTestItem } from '../utils/testItemCreator';
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
import { useIsMobile } from '../hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

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
  // Get ready items from the store function (authoritative source)
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
        checkInDate: item.checkInDate,
        storeReadyItemsCount: storeReadyItems.length,
        storeReadyItemIds: Array.from(readyItemIds)
      });
    }
    
    // Item should be filtered out if it's in the ready list
    // We primarily trust the store's getItemsForReview function
    const shouldRemoveFromPausedList = isInReadyList;
    
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
  const isMobile = useIsMobile();
  const [mobileViewMode, setMobileViewMode] = useState<'carousel' | 'list'>('carousel');
  
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
    const checkNotificationStatus = async () => {
      if (!('Notification' in window)) {
        setNotificationStatus('Browser does not support notifications');
        return;
      }
      
      const permission = Notification.permission;
      const serviceEnabled = platformNotificationService.getEnabled();
      const settingsEnabled = notificationsEnabled;
      
      // Check Progressier subscription status
      let progressierSubscribed = false;
      try {
        progressierSubscribed = await platformNotificationService.isSubscribed();
      } catch (error) {
        console.error('Error checking Progressier subscription:', error);
      }
      
      setNotificationStatus(`Permission: ${permission}, Service: ${serviceEnabled}, Settings: ${settingsEnabled}, Progressier: ${progressierSubscribed}`);
      
      // Debug: Log the full status
      console.log('🔔 Full notification status:', {
        permission,
        serviceEnabled,
        settingsEnabled,
        progressierSubscribed,
        user: !!user,
        userEmail: user?.email,
        authLoading,
        settingsLoading
      });
    };
    
    checkNotificationStatus();
    const interval = setInterval(checkNotificationStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [notificationsEnabled, user]);
  
  
  const handleRequestNotificationPermission = async () => {
    try {
      console.log('🔔 Starting notification setup process...');
      
      // Check if user is logged in first
      if (!user) {
        alert('Please sign in first to enable notifications.');
        return;
      }
      
      // First, request browser permission if needed
      if ('Notification' in window) {
        if (Notification.permission === 'denied') {
          alert('Notifications are blocked. Please go to your browser settings and allow notifications for this site, then try again.');
          return;
        }
        
        if (Notification.permission === 'default') {
          console.log('🔔 Requesting browser permission...');
          const permission = await Notification.requestPermission();
          console.log('🔔 Browser permission result:', permission);
          
          if (permission !== 'granted') {
            alert('Please allow notifications to receive updates when items are ready for review.');
            return;
          }
        }
      }
      
      // Then initialize Progressier and register
      console.log('🔔 Initializing Progressier...');
      const initialized = await platformNotificationService.initialize();
      if (!initialized) {
        alert('Unable to initialize push notifications. Please try again in a few seconds.');
        return;
      }
      
      // Request Progressier subscription
      console.log('🔔 Requesting Progressier subscription...');
      const success = await platformNotificationService.requestPermission();
      console.log('🔔 Progressier subscription result:', success);
      
      if (success) {
        // Enable notifications in user settings
        if (enableNotifications) {
          const settingsUpdated = await enableNotifications();
          if (settingsUpdated) {
            alert('Perfect! You\'ll now receive notifications when items are ready for review.');
            testNotification();
          } else {
            alert('Notifications set up, but there was an issue saving your preferences. Please check your settings.');
          }
        }
      } else {
        alert('Unable to set up push notifications. Please ensure notifications are allowed in your browser settings and try again.');
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      alert('Error setting up notifications. Please try again.');
    }
  };

  // Handle shared content from other apps or PWA share target
  useEffect(() => {
    console.log('📤 Index - Checking for shared content:', sharedContent);
    if (!sharedContent) return;
    const incoming = sharedContent.url || sharedContent.text || '';
    if (!incoming && !sharedContent.title) return;

    console.log('📤 Index - Processing shared content:', { incoming, title: sharedContent.title, pillMode });

    if (pillMode) {
      setSharedPrefill(incoming || sharedContent.title);
      setCompactQuickBar(false); // ensure Pause button is visible
      setHideBottomArea(false); // ensure footer area is visible for shared content
      console.log('📤 Index - Set pill prefill:', incoming || sharedContent.title);
    } else if (addPauseButtonRef.current) {
      console.log('📤 Index - Opening add pause modal');
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
      
      // Enhanced intelligent collapse logic for both mobile and desktop
      if (isMobile) {
        // Mobile: Only compact, never fully hide
        if (scrollingDown && scrollTop > 15) {
          setCompactQuickBar(true);
        } else if (!scrollingDown && scrollTop < 10) {
          setCompactQuickBar(false);
        } else if (scrollTop === 0) {
          setCompactQuickBar(false);
        }
      } else {
        // Desktop: Only compact, never hide completely
        if (scrollingDown && scrollTop > 40) {
          setCompactQuickBar(true);
        } else if (!scrollingDown && scrollTop < 30) {
          setCompactQuickBar(false);
        } else if (scrollTop === 0) {
          // Always expand when at top
          setCompactQuickBar(false);
        }
      }
      
      setLastScrollY(scrollTop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMobile]);

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
        
        {/* Desktop test controls - mirrors mobile test card */}
        <div className="hidden md:block flex-shrink-0 max-w-sm md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="p-3 border border-blue-200 rounded-lg bg-blue-50/50 mt-4">
            <div className="text-sm text-blue-700 mb-2">🧪 Test Notifications</div>
            <div className="space-y-2">
              <Button 
                onClick={async () => {
                  const result = await createTestItem();
                  if (result.success) {
                    // Refresh the items list
                    if (user) {
                      // For logged in users, refresh Supabase store
                      window.location.reload();
                    } else {
                      // For guest users, refresh local store  
                      window.location.reload();
                    }
                    alert('✅ Test item created! Page will refresh to show it.');
                  } else {
                    alert('❌ Error creating test item: ' + (result.error || 'Unknown error'));
                  }
                }}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white mr-2"
              >
                Create Test Item (Ready in 5 min)
              </Button>
              <TestNotificationButton />
            </div>
          </div>
        </div>
        
        {/* Mobile controls - completely independent and stable - OUTSIDE scroll container */}
        <div className="md:hidden flex-shrink-0 max-w-sm md:max-w-4xl lg:max-w-6xl mx-auto">
          {/* Ready to review pill container */}
          {readyCount > 0 && (
            <div className="w-full px-4 mb-3">
              <ReadyToReviewPill count={readyCount} onClick={handleStartReview} />
            </div>
          )}
          
          {/* TEST BUTTON - ALWAYS VISIBLE */}
          <div className="w-full px-4 mb-4">
            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50/50">
              <div className="text-sm text-blue-700 mb-2">🧪 Test Notifications</div>
              <div className="space-y-2">
                 <Button 
                   onClick={async () => {
                     const result = await createTestItem();
                    if (result.success) {
                      // Refresh the items list
                      if (user) {
                        // For logged in users, refresh Supabase store
                        window.location.reload();
                      } else {
                        // For guest users, refresh local store  
                        window.location.reload();
                      }
                      alert('✅ Test item created! Page will refresh to show it.');
                    } else {
                      alert('❌ Error creating test item: ' + (result.error || 'Unknown error'));
                    }
                  }}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white mr-2"
                >
                  Create Test Item (Ready in 5 min)
                </Button>
                <TestNotificationButton />
              </div>
            </div>
          </div>

          {/* Controls container */}
          <div className="w-full px-4 mb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 -ml-3">
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
                    <Eye size={16} className="text-muted-foreground" />
                  ) : (
                    <EyeOff size={16} className="text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => setMobileViewMode(mobileViewMode === 'carousel' ? 'list' : 'carousel')}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-muted/60 rounded-full transition-colors"
                  title={mobileViewMode === 'carousel' ? 'Switch to list view' : 'Switch to carousel view'}
                  aria-label={mobileViewMode === 'carousel' ? 'Switch to list view' : 'Switch to carousel view'}
                >
                  {mobileViewMode === 'carousel' ? (
                    <List size={16} className="text-muted-foreground" />
                  ) : (
                    <Columns size={16} className="text-muted-foreground" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setSortMode(sortMode === 'soonest' ? 'newest' : 'soonest')}
                  className="flex items-center justify-center w-8 h-8 hover:bg-muted/60 rounded-full transition-colors"
                  title={sortMode === 'soonest' ? 'Sort by recently paused' : 'Sort by ending soon'}
                  aria-label={sortMode === 'soonest' ? 'Sort by recently paused' : 'Sort by ending soon'}
                >
                  {sortMode === 'soonest' ? (
                    <ArrowUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ArrowDown size={16} className="text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>
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
              {/* Desktop controls - unchanged */}
              <div className="hidden md:block">
                {readyCount > 0 && (
                  <div className="mb-3 md:mb-6 w-full md:w-auto">
                    <ReadyToReviewPill count={readyCount} onClick={handleStartReview} />
                  </div>
                )}
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
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
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => setSortMode(sortMode === 'soonest' ? 'newest' : 'soonest')}
                      className="flex items-center justify-center w-8 h-8 hover:bg-muted/60 rounded-full transition-colors"
                      title={sortMode === 'soonest' ? 'Sort by recently paused' : 'Sort by ending soon'}
                      aria-label={sortMode === 'soonest' ? 'Sort by recently paused' : 'Sort by ending soon'}
                    >
                      {sortMode === 'soonest' ? (
                        <ArrowUp size={16} className="text-muted-foreground" />
                      ) : (
                        <ArrowDown size={16} className="text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </div>


              {/* Current Paused Items Section - completely separate */}
              {currentPausedItems.length > 0 && (
                <div className="mb-4">
                  {/* Section title - desktop */}
                  <div className="hidden md:block text-xs font-medium text-muted-foreground mb-2 px-1 md:text-sm md:mb-4">
                    Paused Items ({currentPausedItems.length})
                  </div>
                  {/* Mobile paused items title container */}
                  <div className="md:hidden w-full px-4 mb-2">
                    <div className="text-xs font-medium text-muted-foreground text-left">
                      Paused Items ({currentPausedItems.length})
                    </div>
                  </div>
                  
                  {/* Desktop Grid Layout - 3 columns */}
                  <div className="hidden md:block">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 auto-rows-fr max-w-7xl mx-auto">
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

                  {/* Mobile content container */}
                  <div className="md:hidden">
                    {itemsLoading ? (
                      <div className="text-sm text-muted-foreground w-full px-4 max-w-sm mx-auto">Loading…</div>
                    ) : mobileViewMode === 'carousel' ? (
                       <div className="w-full max-w-3xl mx-auto">
                         <Carousel className="w-full px-1">
                            <CarouselContent className="pl-0">
                              {currentPausedItems.map((it) => (
                                <CarouselItem key={it.id} className="basis-full">
                                <DesktopItemCard
                                  item={it}
                                  showImages={showImages}
                                  onClick={() => {
                                    setSelectedItem(it);
                                    setShowItemDetail(true);
                                  }}
                                  onEdit={(item, updates) => updateItem(item.id, updates)}
                                  onDelete={removeItem}
                                />
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                        </Carousel>
                      </div>
                    ) : (
                      <div 
                        className="w-full px-4 space-y-4 max-h-[60vh] overflow-y-scroll [&::-webkit-scrollbar]:hidden" 
                        style={{ 
                          scrollbarWidth: 'none', 
                          msOverflowStyle: 'none'
                        }}
                      >
                        {currentPausedItems.map((it) => (
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
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Beautiful empty state for new users */}
              {!itemsLoading && storeReadyItems.length === 0 && currentPausedItems.length === 0 && (
                <div className="mb-4">
                  {/* Desktop Grid Layout - same as regular items */}
                  <div className="hidden md:block">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 auto-rows-fr max-w-7xl mx-auto">
                      <EmptyStateCard mode="desktop" />
                    </div>
                  </div>

                  {/* Mobile content container - same as regular items */}
                  <div className="md:hidden">
                    {mobileViewMode === 'carousel' ? (
                       <div className="w-full max-w-3xl mx-auto">
                         <Carousel className="w-full px-1">
                            <CarouselContent className="pl-0">
                              <CarouselItem className="basis-full">
                                <EmptyStateCard mode="desktop" />
                              </CarouselItem>
                            </CarouselContent>
                        </Carousel>
                      </div>
                    ) : (
                      <div className="w-full px-4">
                        <EmptyStateCard mode="desktop" />
                      </div>
                    )}
                  </div>

                  {/* Notification setup prompt */}
                  {user && Notification.permission !== 'granted' && (
                    <div className="mt-4 p-4 border border-orange-200 rounded-lg bg-orange-50/50">
                      <div className="text-sm text-orange-700 mb-2">🔔 Get notified when items are ready for review</div>
                      <div className="text-xs text-orange-600 mb-3">
                        Status: {notificationStatus}
                      </div>
                      <Button 
                        onClick={handleRequestNotificationPermission}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Enable Notifications
                      </Button>
                    </div>
                  )}
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
        
        {/* Show notification setup prominently for all users */}
        {user && (
          <div className="max-w-sm md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-4 mb-4">
            {/* Test item creation button */}
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50 mb-4">
              <div className="text-sm text-blue-700 mb-2">🧪 Test Notifications</div>
              <div className="space-y-2">
                <Button 
                  onClick={async () => {
                    const result = await createTestItem();
                    if (result.success) {
                      alert('✅ Test item created! It will be ready for review in 5 minutes.');
                    } else {
                      alert('❌ Error creating test item: ' + (result.error || 'Unknown error'));
                    }
                  }}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white mr-2"
                >
                  Create Test Item (Ready in 5 min)
                </Button>
                <TestNotificationButton />
              </div>
            </div>
            
            {/* Notification setup */}
            {Notification.permission !== 'granted' && (
              <div className="p-4 border border-orange-200 rounded-lg bg-orange-50/50">
                <div className="text-sm text-orange-700 mb-2">🔔 Enable notifications to get alerted when items are ready</div>
                <div className="text-xs text-orange-600 mb-3">
                  Status: {notificationStatus}
                </div>
                <Button 
                  onClick={handleRequestNotificationPermission}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Enable Notifications
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Show notification setup for non-logged-in users */}
        {!user && Notification.permission !== 'granted' && (
          <div className="max-w-sm md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-4 mb-4">
            <div className="p-4 border border-orange-200 rounded-lg bg-orange-50/50">
              <div className="text-sm text-orange-700 mb-2">🔔 Sign in to enable notifications</div>
              <div className="text-xs text-orange-600 mb-3">
                Get alerted when items are ready for review
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Fixed bottom area */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 bg-white border-t w-full ${hideBottomArea ? 'translate-y-full' : 'translate-y-0'}`}
           style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {/* Container: match main content exactly */}
        <div className="max-w-sm md:max-w-4xl lg:max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4">
          {pillMode ? (
            <PillQuickPauseBar
              compact={compactQuickBar}
              prefillValue={sharedPrefill || ''}
              onExpandRequest={() => {
                setCompactQuickBar(false);
                setHideBottomArea(false); // always show footer when expanding
              }}
              onUrlEntry={() => {
                setHideBottomArea(false);
                setCompactQuickBar(false); // expand when user starts typing
              }}
              onBarcodeScanned={() => {
                setHideBottomArea(false);
                setCompactQuickBar(false); // expand when scanning
              }}
              onCollapseChange={(collapsed) => {
                // Mobile only compacts, never hides
                if (isMobile) {
                  setCompactQuickBar(collapsed);
                }
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
