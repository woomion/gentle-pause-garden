import { useState } from 'react';
import { ChevronRight, User, Users } from 'lucide-react';
import PausedSection from './PausedSection';
import { useAuth } from '@/contexts/AuthContext';
import { supabasePausedItemsStore } from '@/stores/supabasePausedItemsStore';
import { pausedItemsStore } from '@/stores/pausedItemsStore';

const MyPausesTab = () => {
  const [showMyPauses, setShowMyPauses] = useState(false);
  const { user } = useAuth();

  // Get count of paused items (excluding those ready for review)
  const getPausedItemsCount = () => {
    if (user) {
      const allItems = supabasePausedItemsStore.getItems();
      const reviewItems = supabasePausedItemsStore.getItemsForReview();
      const reviewItemIds = new Set(reviewItems.map(item => item.id));
      const nonReviewItems = allItems.filter(item => {
        const itemUserId = item.originalUserId;
        const sharedWithPartners = item.sharedWithPartners || [];
        return !reviewItemIds.has(item.id) && itemUserId === user.id && sharedWithPartners.length === 0;
      });
      return nonReviewItems.length;
    } else {
      const allItems = pausedItemsStore.getItems();
      const reviewItems = pausedItemsStore.getItemsForReview();
      const reviewItemIds = new Set(reviewItems.map(item => item.id));
      return allItems.filter(item => !reviewItemIds.has(item.id)).length;
    }
  };

  const pausedItemsCount = getPausedItemsCount();

  return (
    <div className="space-y-4">
      {/* My Pauses Section */}
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
                Paused for now
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pausedItemsCount} item{pausedItemsCount !== 1 ? 's' : ''} paused
              </p>
            </div>
          </div>
          <ChevronRight 
            className={`w-5 h-5 text-gray-400 transition-transform ${showMyPauses ? 'rotate-90' : ''}`} 
          />
        </button>
        
        {showMyPauses && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <PausedSection forceShow={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPausesTab;