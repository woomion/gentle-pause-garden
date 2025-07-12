import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Link, BarChart3 } from 'lucide-react';
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
      <TabsList className="grid w-full grid-cols-2 mb-6 h-16 sm:h-10 rounded-full" style={{ backgroundColor: '#DDE7DD' }}>
        <TabsTrigger 
          value="paused" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-full data-[state=active]:border-0 data-[state=active]:font-normal data-[state=inactive]:font-normal data-[state=active]:shadow-none data-[state=active]:px-0.5 data-[state=active]:sm:px-2 data-[state=inactive]:px-2 data-[state=inactive]:sm:px-3"
          style={{ 
            backgroundColor: activeTab === 'paused' ? '#BFD1BF' : 'transparent',
            color: activeTab === 'paused' ? '#7A5DD9' : 'inherit'
          }}
        >
          <User className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className="text-sm sm:text-sm">My Pauses</span>
        </TabsTrigger>
        <TabsTrigger 
          value="partner-feed" 
          className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-full data-[state=active]:border-0 data-[state=active]:font-normal data-[state=inactive]:font-normal data-[state=active]:shadow-none data-[state=active]:px-0.5 data-[state=active]:sm:px-2 data-[state=inactive]:px-2 data-[state=inactive]:sm:px-3"
          style={{ 
            backgroundColor: activeTab === 'partner-feed' ? '#BFD1BF' : 'transparent',
            color: activeTab === 'partner-feed' ? '#7A5DD9' : 'inherit'
          }}
        >
          <div className="flex items-center gap-1">
            <User className="h-4 w-4 sm:h-3 sm:w-3" />
            <Link className="h-3 w-3 sm:h-2 sm:w-2" />
            <User className="h-4 w-4 sm:h-3 sm:w-3" />
          </div>
          <span className="text-sm sm:text-sm">Partner Pauses</span>
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