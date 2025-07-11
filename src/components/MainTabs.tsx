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
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="paused" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
          <Timer className="h-4 w-4" />
          <span className="text-xs sm:text-sm">Paused</span>
        </TabsTrigger>
        <TabsTrigger value="partner-feed" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
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