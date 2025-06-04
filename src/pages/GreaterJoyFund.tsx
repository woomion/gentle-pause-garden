
import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import EditIntentionModal from '../components/EditIntentionModal';
import { pausedItemsStore } from '../stores/pausedItemsStore';
import { pauseLogStore } from '../stores/pauseLogStore';

const GreaterJoyFund = () => {
  const [intention, setIntention] = useState("More peace in my day");
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [reflection, setReflection] = useState("");
  const [isReflectionComplete, setIsReflectionComplete] = useState(false);
  const [isEditingReflection, setIsEditingReflection] = useState(false);
  const [stats, setStats] = useState({
    totalPauses: 0,
    weeklyPauses: 0,
    monthlyPauses: 0,
    totalAmount: 0,
    weeklyAmount: 0,
    monthlyAmount: 0,
    topEmotion: 'overwhelmed'
  });

  useEffect(() => {
    const calculateStats = () => {
      const pausedItems = pausedItemsStore.getItems();
      const pauseLogItems = pauseLogStore.getItems();
      const allItems = [...pausedItems, ...pauseLogItems];

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

      setStats({
        totalPauses,
        weeklyPauses,
        monthlyPauses,
        totalAmount,
        weeklyAmount,
        monthlyAmount,
        topEmotion
      });
    };

    calculateStats();

    const unsubscribePaused = pausedItemsStore.subscribe(calculateStats);
    const unsubscribeLog = pauseLogStore.subscribe(calculateStats);

    return () => {
      unsubscribePaused();
      unsubscribeLog();
    };
  }, []);

  const handleCompleteReflection = () => {
    if (reflection.trim()) {
      setIsReflectionComplete(true);
      setIsEditingReflection(false);
    }
  };

  const handleEditReflection = () => {
    setIsReflectionComplete(false);
    setIsEditingReflection(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 relative bg-[#FAF6F1] dark:bg-[#200E3B]">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header with back button */}
        <header className="relative mb-8">
          <Link 
            to="/"
            className="absolute left-0 top-6 p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          
          <div className="text-center">
            <Link 
              to="/"
              className="text-black dark:text-[#F9F5EB] font-medium text-lg tracking-wide mb-2 hover:text-taupe transition-colors"
            >
              POCKET || PAUSE
            </Link>
          </div>
        </header>

        {/* Greater Joy Fund Header with more top margin */}
        <div className="mb-8 mt-12">
          <h1 className="text-xl font-medium text-black dark:text-[#F9F5EB] mb-2">
            Your Greater Joy Fund
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            A growing reflection of your mindful choices
          </p>
        </div>

        {/* Intention Card - centerpiece with no background, aligned left */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center flex-1">
              <h2 className="text-xl font-bold text-black dark:text-[#F9F5EB] leading-relaxed flex-1">
                {intention}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditingIntention(true)}
                  className="ml-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-[#F9F5EB] h-8 w-8 bg-transparent hover:bg-transparent inline-flex"
                >
                  <Edit2 size={16} />
                </Button>
              </h2>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
            A place to remember what you're reaching for
          </p>
        </div>

        {/* Outline-style Tabs with proper spacing */}
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
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-black dark:text-[#F9F5EB] mb-6">
                Your reason for pausing—in your own words
              </h3>
              
              {!isReflectionComplete && !isEditingReflection && (
                <>
                  <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                    <p className="mb-4">What are you tending to instead of spending? What feeling are you hoping for? What really matters right now?</p>
                  </div>

                  <div className="relative">
                    <Textarea
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      onFocus={() => setIsEditingReflection(true)}
                      placeholder="Write your reflection here. You can keep it short, or let it unfold."
                      className="min-h-[100px] rounded-xl border border-gray-200/60 dark:border-gray-600 text-black dark:text-[#F9F5EB] resize-none bg-white/70 dark:bg-white/10"
                    />
                  </div>
                </>
              )}

              {isEditingReflection && (
                <>
                  <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                    <p className="mb-4">What are you tending to instead of spending? What feeling are you hoping for? What really matters right now?</p>
                  </div>

                  <div className="relative">
                    <Textarea
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      placeholder="Write your reflection here. You can keep it short, or let it unfold."
                      className="min-h-[100px] rounded-xl border border-gray-200/60 dark:border-gray-600 text-black dark:text-[#F9F5EB] resize-none bg-white/70 dark:bg-white/10"
                      autoFocus
                    />
                    {reflection.trim() && (
                      <Button
                        onClick={handleCompleteReflection}
                        className="absolute top-2 right-2 h-8 w-8 p-0 bg-[#CAB6F7] hover:bg-[#B8A6D2] text-black"
                        size="icon"
                      >
                        <Check size={16} />
                      </Button>
                    )}
                  </div>
                </>
              )}

              {isReflectionComplete && (
                <div className="relative">
                  <div className="flex items-start gap-2">
                    <p className="text-black dark:text-[#F9F5EB] leading-relaxed flex-1">
                      {reflection}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleEditReflection}
                      className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-[#F9F5EB] h-8 w-8 bg-transparent hover:bg-transparent"
                    >
                      <Edit2 size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <div className="space-y-8">
              <h3 className="text-lg font-bold text-black dark:text-[#F9F5EB] mb-6">
                Your pause patterns
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-black dark:text-[#F9F5EB] font-medium">
                    You've paused {stats.weeklyPauses} {stats.weeklyPauses === 1 ? 'time' : 'times'} this week
                  </p>
                  <p className="text-black dark:text-[#F9F5EB] font-medium">
                    {stats.monthlyPauses} {stats.monthlyPauses === 1 ? 'time' : 'times'} this month
                  </p>
                </div>

                {stats.totalAmount > 0 && (
                  <div className="space-y-3">
                    <p className="text-black dark:text-[#F9F5EB] font-medium">
                      In total, you've let go of {formatCurrency(stats.totalAmount)}
                    </p>
                    {stats.weeklyAmount > 0 && (
                      <p className="text-black dark:text-[#F9F5EB]">
                        {formatCurrency(stats.weeklyAmount)} this week
                      </p>
                    )}
                    {stats.monthlyAmount > 0 && (
                      <p className="text-black dark:text-[#F9F5EB]">
                        {formatCurrency(stats.monthlyAmount)} this month
                      </p>
                    )}
                  </div>
                )}

                {stats.totalPauses > 0 && (
                  <div className="space-y-3">
                    <p className="text-black dark:text-[#F9F5EB]">
                      Most of your pauses happen when you feel:{' '}
                      <Badge 
                        className="rounded-full px-3 py-1 text-black font-medium ml-1"
                        style={{ backgroundColor: '#CAB6F7' }}
                      >
                        {stats.topEmotion}
                      </Badge>
                      {' '}(that's helpful to notice!)
                    </p>
                  </div>
                )}

                <div className="pt-6 text-center">
                  <p className="text-black dark:text-[#F9F5EB] font-medium text-base leading-relaxed">
                    {stats.totalPauses > 0 
                      ? "You're noticing. You're pausing. You're choosing."
                      : "Start pausing items to see your mindful choices grow!"
                    }
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-16 text-center text-xs space-y-1" style={{ color: '#A6A1AD' }}>
          <p>|| Pocket Pause—your conscious spending companion</p>
        </div>
      </div>

      {/* Edit Intention Modal */}
      {isEditingIntention && (
        <EditIntentionModal
          intention={intention}
          onSave={setIntention}
          onClose={() => setIsEditingIntention(false)}
        />
      )}
    </div>
  );
};

export default GreaterJoyFund;
