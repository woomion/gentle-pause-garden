
import { useState } from 'react';
import { ArrowLeft, Calendar, TrendingUp, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PausedItemCard from '../components/PausedItemCard';
import StatsTab from '../components/StatsTab';
import ReflectionTab from '../components/ReflectionTab';
import { usePausedItems } from '../hooks/usePausedItems';

const PauseLog = () => {
  const { items } = usePausedItems();
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reflection, setReflection] = useState('');

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

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center mb-6">
          <Link to="/" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-taupe dark:text-cream" />
          </Link>
          <h1 className="text-2xl font-semibold text-taupe dark:text-cream">Your Pause Log</h1>
        </div>

        <Tabs defaultValue="log" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="log" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Log
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="reflection" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Reflection
            </TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🪴</div>
                <p className="text-taupe dark:text-cream mb-2">Your pause garden is empty</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Start pausing items to see them grow here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <PausedItemCard
                    key={item.id}
                    item={item}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats">
            <StatsTab stats={stats} />
          </TabsContent>

          <TabsContent value="reflection">
            <ReflectionTab reflection={reflection} setReflection={setReflection} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PauseLog;
