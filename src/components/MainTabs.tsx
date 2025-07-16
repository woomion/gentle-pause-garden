import { useState } from 'react';
import { User, Users } from 'lucide-react';
import PausedSection from './PausedSection';
import PartnerFeedTab from './PartnerFeedTab';
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
    <div className="space-y-4">
      {/* My Pauses Button */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setShowMyPauses(!showMyPauses)}
          className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                My Pauses
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Items you've paused for now
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {showMyPauses ? 'Hide' : 'Show'}
            </span>
            <div className={`w-5 h-5 text-gray-400 transition-transform ${showMyPauses ? 'rotate-90' : ''}`}>
              ▶
            </div>
          </div>
        </button>
        
        {showMyPauses && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <PausedSection forceShow={true} />
            </div>
          </div>
        )}
      </div>

      {/* Partner Pauses Button */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setShowPartnerPauses(!showPartnerPauses)}
          className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                Partner Pauses
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Shared pauses with your partners
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && totalUnreadCount > 0 && (
              <div className="text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg" style={{ backgroundColor: '#D8B4FE', color: '#000' }}>
                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
              </div>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {showPartnerPauses ? 'Hide' : 'Show'}
            </span>
            <div className={`w-5 h-5 text-gray-400 transition-transform ${showPartnerPauses ? 'rotate-90' : ''}`}>
              ▶
            </div>
          </div>
        </button>
        
        {showPartnerPauses && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <PartnerFeedTab />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainTabs;