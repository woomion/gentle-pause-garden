
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
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
    if (savedReflection) {
      setReflection(savedReflection);
    }
  }, []);

  // Save reflection to localStorage when it changes
  useEffect(() => {
    if (reflection) {
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

        <IntentionSection intention={intention} onSave={handleSaveIntention} />

        <Tabs defaultValue="reflection" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/60 dark:bg-white/10">
            <TabsTrigger value="reflection">Reflection</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reflection">
            <ReflectionTab reflection={reflection} setReflection={setReflection} />
          </TabsContent>
          
          <TabsContent value="stats">
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
