import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, Users, BarChart3 } from 'lucide-react';
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
    <div className="w-full">
      <div className="grid w-full grid-cols-2 mb-6 h-16 sm:h-10 rounded-full" style={{ backgroundColor: '#DDE7DD' }}>
        <Button 
          variant="ghost"
          onClick={() => setShowMyPauses(!showMyPauses)}
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-full border-0 font-normal shadow-none px-0.5 sm:px-2 h-auto"
          style={{ 
            backgroundColor: showMyPauses ? '#BFD1BF' : 'transparent',
            color: showMyPauses ? '#7A5DD9' : 'inherit'
          }}
        >
          <User className="h-5 w-5 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">My Pauses</span>
        </Button>
        <Button 
          variant="ghost"
          onClick={() => setShowPartnerPauses(!showPartnerPauses)}
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-full border-0 font-normal shadow-none px-0.5 sm:px-2 h-auto"
          style={{ 
            backgroundColor: showPartnerPauses ? '#BFD1BF' : 'transparent',
            color: showPartnerPauses ? '#7A5DD9' : 'inherit'
          }}
        >
          <div className="relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <Users className="h-5 w-5 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Partner Pauses</span>
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