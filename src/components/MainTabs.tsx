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
      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4 mb-6">
        <TabsTrigger value="paused" className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          <span className="hidden sm:inline">Paused</span>
        </TabsTrigger>
        <TabsTrigger value="pause-log" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Log</span>
        </TabsTrigger>
        {hasPausePartnerAccess() && (
          <TabsTrigger value="partner-feed" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Partners</span>
          </TabsTrigger>
        )}
        <TabsTrigger value="stats" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Stats</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="paused" className="mt-0">
        <PausedSection />
      </TabsContent>

      <TabsContent value="pause-log" className="mt-0">
        <PauseLogSection />
      </TabsContent>

      {hasPausePartnerAccess() && (
        <TabsContent value="partner-feed" className="mt-0">
          <PartnerFeedTab />
        </TabsContent>
      )}

      <TabsContent value="stats" className="mt-0">
        <StatsTab stats={{
          totalPauses: 0,
          weeklyPauses: 0,
          monthlyPauses: 0,
          totalAmount: 0,
          weeklyAmount: 0,
          monthlyAmount: 0,
          topEmotion: 'curious'
        }} />
      </TabsContent>
    </Tabs>
  );
};

export default MainTabs;