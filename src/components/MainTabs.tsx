import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Users, BarChart3 } from 'lucide-react';
import PausedSection from './PausedSection';
import PauseLogSection from './PauseLogSection';
import PartnerFeedTab from './PartnerFeedTab';
import StatsTab from './StatsTab';
import { useSubscription } from '@/hooks/useSubscription';
import { useItemComments } from '@/hooks/useItemComments';
import { useAuth } from '@/contexts/AuthContext';

const MainTabs = () => {
  const [activeTab, setActiveTab] = useState('paused');
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
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6 h-16 sm:h-12 rounded-full bg-muted/30 p-1">
        <TabsTrigger 
          value="paused" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary/20 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground transition-all duration-200 font-medium py-2 sm:py-1.5"
        >
          <User className="h-4 w-4 sm:h-4 sm:w-4" />
          <span className="text-sm sm:text-base leading-none">My Pauses</span>
        </TabsTrigger>
        <TabsTrigger 
          value="partner-feed" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-full data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary/20 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground transition-all duration-200 font-medium py-2 sm:py-1.5"
        >
          <div className="relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <Users className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="text-sm sm:text-base leading-none">Partner Pauses</span>
            {user && totalUnreadCount > 0 && (
              <div className="absolute -top-2 -right-2 text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg bg-primary/20 text-primary border border-primary/30">
                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
              </div>
            )}
          </div>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="paused" className="mt-0">
        <PausedSection />
      </TabsContent>

      <TabsContent value="partner-feed" className="mt-0">
        <PartnerFeedTab />
      </TabsContent>
    </Tabs>
  );
};

export default MainTabs;