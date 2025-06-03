
import { useState, useEffect } from 'react';
import { ArrowLeft, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// We'll create a separate store for mindful wins items
interface MindfulWinItem {
  id: string;
  itemName: string;
  emotion: string;
  letGoDate: string;
  storeName: string;
}

const MindfulWins = () => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [mindfulWinItems, setMindfulWinItems] = useState<MindfulWinItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MindfulWinItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const emotions = ['burnt out', 'sad', 'resentful', 'overwhelmed', 'curious', 'bored', 'inspired', 'deserving', 'anxious', 'lonely', 'celebratory', 'something else'];

  const getEmotionColor = (emotion: string) => {
    const emotionColors: { [key: string]: string } = {
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

  useEffect(() => {
    // Load mindful wins from localStorage
    const loadMindfulWins = () => {
      try {
        const stored = localStorage.getItem('mindfulWins');
        if (stored) {
          setMindfulWinItems(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load mindful wins:', error);
      }
    };

    loadMindfulWins();
  }, []);

  useEffect(() => {
    if (selectedFilter) {
      setFilteredItems(mindfulWinItems.filter(item => item.emotion === selectedFilter));
    } else {
      setFilteredItems(mindfulWinItems);
    }
  }, [selectedFilter, mindfulWinItems]);

  const handleFilterClick = (emotion: string) => {
    if (selectedFilter === emotion) {
      setSelectedFilter(null);
    } else {
      setSelectedFilter(emotion);
    }
    setShowFilters(false);
  };

  const clearFilter = () => {
    setSelectedFilter(null);
    setShowFilters(false);
  };

  const getItemCount = filteredItems.length;

  // Empty state when no items have been let go of yet
  if (mindfulWinItems.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-md mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center gap-2 text-black hover:text-gray-600">
              <ArrowLeft size={20} />
              <span className="text-sm">Back to Home</span>
            </Link>
            <div className="w-6 h-6 border border-gray-300 rounded"></div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-black mb-6">What You've Let Go Of</h1>

          {/* Empty state */}
          <div className="bg-white/60 rounded-lg p-8 text-center border border-gray-200 mt-16">
            <p className="text-gray-500 text-lg mb-2">Nothing here yet</p>
            <p className="text-gray-400 text-sm">
              When you decide to let go of paused items, they'll appear here as mindful wins.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center text-xs text-gray-400">
            <p>|| Pocket Pause—your conscious spending companion</p>
            <div className="flex justify-center gap-4 mt-2">
              <span>Privacy Policy</span>
              <span>About</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-black hover:text-gray-600">
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Home</span>
          </Link>
          <div className="w-6 h-6 border border-gray-300 rounded"></div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-black mb-6">What You've Let Go Of</h1>

        {/* Filter Section */}
        <div className="mb-6">
          {selectedFilter ? (
            <div className="flex items-center gap-2 mb-4">
              <Badge 
                className="px-3 py-1 text-sm cursor-pointer"
                style={{ backgroundColor: getEmotionColor(selectedFilter) }}
                onClick={clearFilter}
              >
                {selectedFilter} ×
              </Badge>
              <span className="text-sm text-gray-600">{getItemCount} items</span>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} className="mr-2" />
                Filters active
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} className="mr-2" />
                Filter
              </Button>
            </div>
          )}

          {selectedFilter && (
            <p className="text-sm text-gray-600 text-center mb-4">
              Paused while feeling: {selectedFilter}
            </p>
          )}

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-lg p-4 mb-4 border">
              <div className="flex flex-wrap gap-2">
                {emotions.map(emotion => (
                  <Badge
                    key={emotion}
                    className="cursor-pointer hover:opacity-80"
                    style={{ backgroundColor: getEmotionColor(emotion) }}
                    onClick={() => handleFilterClick(emotion)}
                  >
                    {emotion}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white/60 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-black">{item.itemName}</h3>
                <span className="text-sm text-gray-600">Let go of on {item.letGoDate}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Paused while feeling</span>
                <Badge
                  className="text-xs"
                  style={{ backgroundColor: getEmotionColor(item.emotion) }}
                >
                  {item.emotion}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs text-gray-400">
          <p>|| Pocket Pause—your conscious spending companion</p>
          <div className="flex justify-center gap-4 mt-2">
            <span>Privacy Policy</span>
            <span>About</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindfulWins;
