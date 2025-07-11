import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Timer, BarChart3 } from 'lucide-react';
import PausedSection from './PausedSection';
import PauseLogSection from './PauseLogSection';
import PartnerFeedTab from './PartnerFeedTab';
import StatsTab from './StatsTab';
import { useSubscription } from '@/hooks/useSubscription';

const MainTabs = () => {
  const [activeTab, setActiveTab] = useState('paused');
  const { hasPausePartnerAccess } = useSubscription();

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6 h-16 sm:h-10 rounded-full" style={{ backgroundColor: '#F5F2FA' }}>
        <TabsTrigger 
          value="paused" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-full data-[state=active]:border-0 data-[state=active]:font-semibold data-[state=inactive]:font-normal data-[state=active]:shadow-none"
          style={{ 
            backgroundColor: activeTab === 'paused' ? '#B5C4AE' : 'transparent',
            color: activeTab === 'paused' ? '#6B7D64' : 'inherit'
          }}
        >
          <Timer className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Paused</span>
        </TabsTrigger>
        <TabsTrigger 
          value="partner-feed" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-full data-[state=active]:border-0 data-[state=active]:font-semibold data-[state=inactive]:font-normal data-[state=active]:shadow-none"
          style={{ 
            backgroundColor: activeTab === 'partner-feed' ? '#B5C4AE' : 'transparent',
            color: activeTab === 'partner-feed' ? '#6B7D64' : 'inherit'
          }}
        >
          <Users className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Partners</span>
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