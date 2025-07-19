import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PausedSection from './PausedSection';
import PauseLogSection from './PauseLogSection';
import PartnerFeedTab from './PartnerFeedTab';
import StatsTab from './StatsTab';
import { useSubscription } from '@/hooks/useSubscription';
import { useItemComments } from '@/hooks/useItemComments';
import { useAuth } from '@/contexts/AuthContext';

const MainTabs = () => {
  const [showMyPauses, setShowMyPauses] = useState(false);
  const [showPartnerPauses, setShowPartnerPauses] = useState(false);
  const { hasPausePartnerAccess } = useSubscription();
  const { user } = useAuth();
  
  // Always call the hook, but handle errors gracefully
  const itemCommentsHook = useItemComments(user?.id || null);
  
  // Safely get total unread count with comprehensive error handling
  let totalUnreadCount = 0;
  
  try {
    if (user?.id && itemCommentsHook && typeof itemCommentsHook.getTotalUnreadCount === 'function') {
      totalUnreadCount = itemCommentsHook.getTotalUnreadCount();
    }
  } catch (error) {
    console.error('Error getting unread count:', error);
    totalUnreadCount = 0;
  }
  
  // Ensure totalUnreadCount is a valid number
  if (typeof totalUnreadCount !== 'number' || isNaN(totalUnreadCount)) {
    totalUnreadCount = 0;
  }
  
  // Debug: Log the unread count
  console.log('🔔 MainTabs - User:', user?.id || 'none');
  console.log('🔔 MainTabs - Total unread count:', totalUnreadCount);
  console.log('🔔 MainTabs - Should show badge:', user && totalUnreadCount > 0);

  return (
    <div className="w-full mt-4 sm:mt-8">
      <div className="flex w-full gap-1 mb-2 sm:mb-12 h-16 sm:h-10">
        <Button 
          variant="ghost"
          onClick={() => {
            setShowMyPauses(!showMyPauses);
            setShowPartnerPauses(false);
          }}
          className="flex-1 flex flex-col sm:flex-row items-center gap-0 rounded-l-full border-0 font-normal shadow-none px-0.5 sm:px-2 h-auto hover:bg-transparent focus:bg-transparent active:bg-transparent"
        >
          <div className="flex flex-col items-center gap-0">
            <span className={`text-base sm:text-base ${showMyPauses ? 'text-purple-600 font-medium' : ''}`}>
              My Pauses
            </span>
            {showMyPauses ? (
              <ChevronUp className="h-3 w-3 mt-0.5 text-purple-600" strokeWidth={3} />
            ) : (
              <ChevronDown className="h-3 w-3 mt-0.5" strokeWidth={3} />
            )}
          </div>
        </Button>
        <Button 
          variant="ghost"
          onClick={() => {
            setShowPartnerPauses(!showPartnerPauses);
            setShowMyPauses(false);
          }}
          className="flex-1 flex flex-col sm:flex-row items-center gap-0 rounded-r-full border-0 font-normal shadow-none px-0.5 sm:px-2 h-auto hover:bg-transparent focus:bg-transparent active:bg-transparent"
        >
          <div className="relative flex flex-col items-center gap-0">
            <span className={`text-base sm:text-base ${showPartnerPauses ? 'text-purple-600 font-medium' : ''}`}>
              Partner Pauses
            </span>
            {showPartnerPauses ? (
              <ChevronUp className="h-3 w-3 mt-0.5 text-purple-600" strokeWidth={3} />
            ) : (
              <ChevronDown className="h-3 w-3 mt-0.5" strokeWidth={3} />
            )}
            {user && totalUnreadCount > 0 && (
              <div className="absolute -top-2 -right-2 text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg" style={{ backgroundColor: '#D8B4FE', color: '#000' }}>
                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
              </div>
            )}
          </div>
        </Button>
      </div>

      {showMyPauses && (
        <div className="mt-0 mb-6">
          <PausedSection />
        </div>
      )}

      {showPartnerPauses && (
        <div className="mt-0">
          <PartnerFeedTab />
        </div>
      )}
    </div>
  );
};

export default MainTabs;