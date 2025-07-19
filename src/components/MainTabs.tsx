import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, Users, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import PausedSection from './PausedSection';
import PauseLogSection from './PauseLogSection';
import PartnerFeedTab from './PartnerFeedTab';
import StatsTab from './StatsTab';
import AddPauseButton from './AddPauseButton';
import { useSubscription } from '@/hooks/useSubscription';
import { useItemComments } from '@/hooks/useItemComments';
import { useAuth } from '@/contexts/AuthContext';

const MainTabs = ({ onAddPause }: { onAddPause: () => void }) => {
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
    <div className="w-full flex-1 flex flex-col">
      <div className="flex w-full h-40 max-w-none mx-0">
        <Button 
          variant="ghost"
          onClick={() => {
            setShowMyPauses(!showMyPauses);
            setShowPartnerPauses(false);
          }}
          className="flex-1 flex flex-col items-center justify-center border-0 font-medium shadow-none px-4 h-full rounded-none gap-0"
          style={{ 
            backgroundColor: showMyPauses ? '#D9E36A' : '#D9E36A',
            color: 'black'
          }}
        >
          <span className="text-lg font-medium">My Pauses</span>
          {showMyPauses ? (
            <ChevronUp className="h-4 w-4 mt-0.5" strokeWidth={3} />
          ) : (
            <ChevronDown className="h-4 w-4 mt-0.5" strokeWidth={3} />
          )}
        </Button>
        <Button 
          variant="ghost"
          onClick={() => {
            setShowPartnerPauses(!showPartnerPauses);
            setShowMyPauses(false);
          }}
          className="flex-1 flex flex-col items-center justify-center border-0 font-medium shadow-none px-4 h-full relative rounded-none gap-0"
          style={{ 
            backgroundColor: showPartnerPauses ? '#D9E36A' : '#D9E36A',
            color: 'black'
          }}
        >
          <span className="text-lg font-medium">Partner Pauses</span>
          {showPartnerPauses ? (
            <ChevronUp className="h-4 w-4 mt-0.5" strokeWidth={3} />
          ) : (
            <ChevronDown className="h-4 w-4 mt-0.5" strokeWidth={3} />
          )}
          {user && totalUnreadCount > 0 && (
            <div className="absolute -top-2 -right-2 text-xs h-5 w-5 flex items-center justify-center font-medium" style={{ backgroundColor: '#D8B4FE', color: '#000' }}>
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </div>
          )}
        </Button>
      </div>

      {/* Content sections - no margin bottom to stick to Add Pause button */}
      {showMyPauses && (
        <div className="flex-1 flex flex-col">
          <div className="flex-shrink-0">
            <PausedSection />
          </div>
          <div className="flex-1 w-full">
            <AddPauseButton onAddPause={onAddPause} />
          </div>
        </div>
      )}

      {showPartnerPauses && (
        <div className="flex-1 flex flex-col">
          <div className="flex-shrink-0">
            <PartnerFeedTab />
          </div>
          <div className="flex-1 w-full">
            <AddPauseButton onAddPause={onAddPause} />
          </div>
        </div>
      )}

      {/* Show Add Pause button when no tabs are open */}
      {!showMyPauses && !showPartnerPauses && (
        <div className="flex-1 w-full">
          <AddPauseButton onAddPause={onAddPause} />
        </div>
      )}
    </div>
  );
};

export default MainTabs;