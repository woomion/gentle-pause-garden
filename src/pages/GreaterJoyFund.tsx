
import { useState, useEffect } from 'react';
import { ArrowLeft, PenTool, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntentionSection from '../components/IntentionSection';
import ReflectionTab from '../components/ReflectionTab';
import StatsTab from '../components/StatsTab';
import PauseHeader from '../components/PauseHeader';
import FooterLinks from '../components/FooterLinks';
import GreaterJoyDonation from '../components/GreaterJoyDonation';
import { usePausedItems } from '../hooks/usePausedItems';

const GreaterJoyFund = () => {
  const [activeTab, setActiveTab] = useState('reflection');
  const [intention, setIntention] = useState('');
  const [reflection, setReflection] = useState('');
  const { items } = usePausedItems();

  const handleSaveIntention = (newIntention: string) => {
    setIntention(newIntention);
    localStorage.setItem('greaterJoyIntention', newIntention);
  };

  // Load intention and reflection on component mount
  useEffect(() => {
    const savedIntention = localStorage.getItem('greaterJoyIntention');
    const savedReflection = localStorage.getItem('greaterJoyReflection');
    if (savedIntention) {
      setIntention(savedIntention);
    }
    if (savedReflection && savedReflection.trim().length > 2) {
      // Only load saved reflection if it has meaningful content (more than 2 characters)
      setReflection(savedReflection);
    } else if (savedReflection && savedReflection.trim().length <= 2) {
      // Clear localStorage if it contains very short/meaningless content
      localStorage.removeItem('greaterJoyReflection');
    }
  }, []);

  // Save reflection to localStorage when it changes (only if it has meaningful content)
  useEffect(() => {
    if (reflection && reflection.trim().length > 0) {
      localStorage.setItem('greaterJoyReflection', reflection);
    }
  }, [reflection]);

  // Calculate stats from items
  const stats = {
    totalPauses: items.length,
    weeklyPauses: items.filter(item => {
      const itemDate = new Date(item.pausedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return itemDate >= weekAgo;
    }).length,
    monthlyPauses: items.filter(item => {
      const itemDate = new Date(item.pausedAt);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return itemDate >= monthAgo;
    }).length,
    totalAmount: items.reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    weeklyAmount: items.filter(item => {
      const itemDate = new Date(item.pausedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return itemDate >= weekAgo;
    }).reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    monthlyAmount: items.filter(item => {
      const itemDate = new Date(item.pausedAt);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return itemDate >= monthAgo;
    }).reduce((sum, item) => sum + (Number(item.price) || 0), 0),
    topEmotion: items.length > 0 ? (items[0].emotion || 'curious') : 'curious'
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-6 py-8">
        <PauseHeader />

        <div className="mt-8 mb-8">
          <Link 
            to="/"
            className="inline-flex items-center text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="text-sm">Back to home</span>
          </Link>
          
          <h1 className="text-2xl font-semibold text-black dark:text-cream mb-2">Your Greater Joy Fund</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-8">
            A growing reflection of your mindful choices
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-16 sm:h-10 rounded-full" style={{ backgroundColor: '#DDE7DD' }}>
            <TabsTrigger 
              value="reflection" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-3xl sm:rounded-full data-[state=active]:border-0 data-[state=active]:font-normal data-[state=inactive]:font-normal data-[state=active]:shadow-none data-[state=active]:px-1 data-[state=active]:sm:px-2 data-[state=inactive]:px-2 data-[state=inactive]:sm:px-3"
              style={{ 
                backgroundColor: activeTab === 'reflection' ? '#BFD1BF' : 'transparent',
                color: activeTab === 'reflection' ? '#7A5DD9' : 'inherit'
              }}
            >
              <PenTool className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Reflection</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 rounded-3xl sm:rounded-full data-[state=active]:border-0 data-[state=active]:font-normal data-[state=inactive]:font-normal data-[state=active]:shadow-none data-[state=active]:px-1 data-[state=active]:sm:px-2 data-[state=inactive]:px-2 data-[state=inactive]:sm:px-3"
              style={{ 
                backgroundColor: activeTab === 'stats' ? '#BFD1BF' : 'transparent',
                color: activeTab === 'stats' ? '#7A5DD9' : 'inherit'
              }}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Stats</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="reflection" className="mt-0">
            <IntentionSection intention={intention} onSave={handleSaveIntention} />
            <ReflectionTab reflection={reflection} setReflection={setReflection} />
          </TabsContent>
          
          <TabsContent value="stats" className="mt-0">
            <StatsTab stats={stats} />
          </TabsContent>
        </Tabs>

        <GreaterJoyDonation />

        <FooterLinks />
      </div>
    </div>
  );
};

export default GreaterJoyFund;
