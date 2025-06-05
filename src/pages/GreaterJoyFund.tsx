
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntentionSection from '../components/IntentionSection';
import ReflectionTab from '../components/ReflectionTab';
import StatsTab from '../components/StatsTab';
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
        <div className="flex items-center mb-6">
          <Link to="/" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-taupe dark:text-cream" />
          </Link>
          <h1 className="text-lg font-medium text-taupe dark:text-cream">Back to Home</h1>
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
      </div>
    </div>
  );
};

export default GreaterJoyFund;
