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
  
  // Safely get total unread count with error handling
  let totalUnreadCount = 0;
  try {
    const { getTotalUnreadCount } = useItemComments(user?.id || null);
    totalUnreadCount = getTotalUnreadCount();
  } catch (error) {
    console.error('Error getting unread count:', error);
  }
  
  // Debug: Log the unread count
  console.log('🔔 MainTabs - User:', user?.id || 'none');
  console.log('🔔 MainTabs - Total unread count:', totalUnreadCount);
  console.log('🔔 MainTabs - Should show badge:', user && totalUnreadCount > 0);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6 h-16 sm:h-10 rounded-full" style={{ backgroundColor: '#DDE7DD' }}>
        <TabsTrigger 
          value="paused" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-full data-[state=active]:border-0 data-[state=active]:font-normal data-[state=inactive]:font-normal data-[state=active]:shadow-none data-[state=active]:px-0.5 data-[state=active]:sm:px-2 data-[state=inactive]:px-2 data-[state=inactive]:sm:px-3"
          style={{ 
            backgroundColor: activeTab === 'paused' ? '#BFD1BF' : 'transparent',
            color: activeTab === 'paused' ? '#7A5DD9' : 'inherit'
          }}
        >
          <User className="h-5 w-5 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">My Pauses</span>
        </TabsTrigger>
        <TabsTrigger 
          value="partner-feed" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-full data-[state=active]:border-0 data-[state=active]:font-normal data-[state=inactive]:font-normal data-[state=active]:shadow-none data-[state=active]:px-0.5 data-[state=active]:sm:px-2 data-[state=inactive]:px-2 data-[state=inactive]:sm:px-3"
          style={{ 
            backgroundColor: activeTab === 'partner-feed' ? '#BFD1BF' : 'transparent',
            color: activeTab === 'partner-feed' ? '#7A5DD9' : 'inherit'
          }}
        >
          <div className="relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <Users className="h-5 w-5 sm:h-5 sm:w-5" />
            <span className="text-sm sm:text-base">Partner Pauses</span>
            {user && totalUnreadCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium shadow-lg">
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