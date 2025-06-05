
import { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePauseLog } from '../hooks/usePauseLog';
import PauseHeader from '../components/PauseHeader';
import FooterLinks from '../components/FooterLinks';

const PauseLog = () => {
  const { items } = usePauseLog();
  const [emotionFilter, setEmotionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get unique emotions from items
  const uniqueEmotions = useMemo(() => {
    const emotions = items.map(item => item.emotion).filter(Boolean);
    return [...new Set(emotions)];
  }, [items]);

  // Filter items based on selected filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const emotionMatch = emotionFilter === 'all' || item.emotion === emotionFilter;
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      return emotionMatch && statusMatch;
    });
  }, [items, emotionFilter, statusFilter]);

  const getEmotionColor = (emotion: string) => {
    const emotionColors: Record<string, string> = {
      'bored': '#F6E3D5',
      'overwhelmed': '#E9E2F7',
      'burnt out': '#FBF3C2',
      'sad': '#DCE7F5',
      'inspired': '#FBE7E6',
      'deserving': '#E7D8F3',
      'curious': '#DDEEDF',
      'anxious': '#EDEAE5',
      'lonely': '#CED8E3',
      'celebratory': '#FAEED6',
      'resentful': '#EAC9C3',
      'something else': '#F0F0EC'
    };
    return emotionColors[emotion] || '#F0F0EC';
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-6 py-8">
        <PauseHeader />
        
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-taupe dark:text-cream mb-6">What You've Let Go Of</h1>
          
          {/* Filter label */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-taupe dark:text-cream" />
            <span className="text-sm text-taupe dark:text-cream font-medium">Filters</span>
          </div>

          {/* Filter dropdowns */}
          <div className="flex gap-4">
            <Select value={emotionFilter} onValueChange={setEmotionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All emotions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All emotions</SelectItem>
                {uniqueEmotions.map(emotion => (
                  <SelectItem key={emotion} value={emotion}>{emotion}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All outcomes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outcomes</SelectItem>
                <SelectItem value="purchased">Purchased</SelectItem>
                <SelectItem value="let-go">Let go</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🪴</div>
              <p className="text-taupe dark:text-cream mb-2">No items found</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Try adjusting your filters or add some paused items first
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white/60 dark:bg-white/10 rounded-2xl p-4 border border-lavender/30 dark:border-gray-600"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-black dark:text-[#F9F5EB] text-lg">
                    {item.itemName}
                  </h3>
                </div>
                
                <p className="text-black dark:text-[#F9F5EB] text-sm mb-3">
                  {item.storeName}
                </p>
                
                <div className="mb-2">
                  <span 
                    className="inline-block px-2 py-1 rounded text-xs font-medium"
                    style={{ 
                      backgroundColor: getEmotionColor(item.emotion),
                      color: '#000'
                    }}
                  >
                    {item.emotion}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {item.status === 'purchased' 
                    ? `Purchased on ${item.letGoDate}`
                    : `Let go of on ${item.letGoDate}`
                  }
                </p>
              </div>
            ))
          )}
        </div>

        <FooterLinks />
      </div>
    </div>
  );
};

export default PauseLog;
