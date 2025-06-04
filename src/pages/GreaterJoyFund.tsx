
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EditIntentionModal from '../components/EditIntentionModal';
import GreaterJoyHeader from '../components/GreaterJoyHeader';
import IntentionSection from '../components/IntentionSection';
import ReflectionTab from '../components/ReflectionTab';
import StatsTab from '../components/StatsTab';
import { pausedItemsStore } from '../stores/pausedItemsStore';
import { pauseLogStore } from '../stores/pauseLogStore';

const GreaterJoyFund = () => {
  const [intention, setIntention] = useState("");
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [reflection, setReflection] = useState("");
  const [stats, setStats] = useState({
    totalPauses: 0,
    weeklyPauses: 0,
    monthlyPauses: 0,
    totalAmount: 0,
    weeklyAmount: 0,
    monthlyAmount: 0,
    topEmotion: 'overwhelmed'
  });

  // Load intention from localStorage on mount
  useEffect(() => {
    const savedIntention = localStorage.getItem('joyFundIntention');
    if (savedIntention) {
      setIntention(savedIntention);
    }
  }, []);

  // Save intention to localStorage when it changes
  const handleIntentionSave = (newIntention: string) => {
    setIntention(newIntention);
    localStorage.setItem('joyFundIntention', newIntention);
  };

  useEffect(() => {
    const calculateStats = () => {
      const pausedItems = pausedItemsStore.getItems();
      const pauseLogItems = pauseLogStore.getItems();
      const allItems = [...pausedItems, ...pauseLogItems];

      console.log('Calculating stats with items:', allItems);

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate pauses
      const totalPauses = allItems.length;
      const weeklyPauses = allItems.filter(item => {
        const itemDate = 'pausedAt' in item ? new Date(item.pausedAt) : new Date(item.letGoDate);
        return itemDate >= oneWeekAgo;
      }).length;
      const monthlyPauses = allItems.filter(item => {
        const itemDate = 'pausedAt' in item ? new Date(item.pausedAt) : new Date(item.letGoDate);
        return itemDate >= oneMonthAgo;
      }).length;

      // Calculate amounts (only from items with price data)
      const itemsWithPrice = pausedItems.filter(item => item.price && !isNaN(parseFloat(item.price.replace(/[$,]/g, ''))));
      const totalAmount = itemsWithPrice.reduce((sum, item) => {
        return sum + parseFloat(item.price.replace(/[$,]/g, ''));
      }, 0);

      const weeklyItems = itemsWithPrice.filter(item => new Date(item.pausedAt) >= oneWeekAgo);
      const weeklyAmount = weeklyItems.reduce((sum, item) => {
        return sum + parseFloat(item.price.replace(/[$,]/g, ''));
      }, 0);

      const monthlyItems = itemsWithPrice.filter(item => new Date(item.pausedAt) >= oneMonthAgo);
      const monthlyAmount = monthlyItems.reduce((sum, item) => {
        return sum + parseFloat(item.price.replace(/[$,]/g, ''));
      }, 0);

      // Find most common emotion
      const emotions = allItems.map(item => item.emotion).filter(Boolean);
      const emotionCounts = emotions.reduce((acc, emotion) => {
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topEmotion = Object.entries(emotionCounts).length > 0 
        ? Object.entries(emotionCounts).sort(([,a], [,b]) => b - a)[0][0]
        : 'overwhelmed';

      const newStats = {
        totalPauses,
        weeklyPauses,
        monthlyPauses,
        totalAmount,
        weeklyAmount,
        monthlyAmount,
        topEmotion
      };

      console.log('New stats calculated:', newStats);
      setStats(newStats);
    };

    calculateStats();

    const unsubscribePaused = pausedItemsStore.subscribe(calculateStats);
    const unsubscribeLog = pauseLogStore.subscribe(calculateStats);

    return () => {
      unsubscribePaused();
      unsubscribeLog();
    };
  }, []);

  return (
    <div className="min-h-screen transition-colors duration-300 relative bg-[#FAF6F1] dark:bg-[#200E3B]">
      <div className="max-w-md mx-auto px-6 py-8">
        <GreaterJoyHeader />
        
        <IntentionSection 
          intention={intention}
          onEdit={() => setIsEditingIntention(true)}
        />

        <Tabs defaultValue="reflection" className="mb-8">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-transparent p-0 h-auto gap-2">
            <TabsTrigger 
              value="reflection" 
              className="rounded-full font-medium border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 data-[state=active]:bg-[#CAB6F7] data-[state=active]:text-black data-[state=active]:border-[#CAB6F7] text-gray-600 dark:text-gray-300 py-2 px-4"
            >
              Reflection
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="rounded-full font-medium border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 data-[state=active]:bg-[#CAB6F7] data-[state=active]:text-black data-[state=active]:border-[#CAB6F7] text-gray-600 dark:text-gray-300 py-2 px-4"
            >
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reflection" className="mt-0">
            <ReflectionTab 
              reflection={reflection}
              setReflection={setReflection}
            />
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <StatsTab stats={stats} />
          </TabsContent>
        </Tabs>

        <div className="mt-16 text-center text-xs space-y-1" style={{ color: '#A6A1AD' }}>
          <p>|| Pocket Pause—your conscious spending companion</p>
        </div>
      </div>

      {isEditingIntention && (
        <EditIntentionModal
          intention={intention}
          onSave={handleIntentionSave}
          onClose={() => setIsEditingIntention(false)}
        />
      )}
    </div>
  );
};

export default GreaterJoyFund;
