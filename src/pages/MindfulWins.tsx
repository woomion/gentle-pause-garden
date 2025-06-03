
import { useState, useEffect } from 'react';
import { ArrowLeft, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// For now, we'll use mock data that matches the mockup
const mockMindfulWins = [
  {
    id: '1',
    itemName: 'Arizona Vegan Matte Black Birkenstock',
    emotion: 'burnt out',
    letGoDate: 'May 28',
    storeName: 'Birkenstock Store'
  },
  {
    id: '2',
    itemName: 'Montana Short Free People',
    emotion: 'sad',
    letGoDate: 'May 21',
    storeName: 'Free People'
  },
  {
    id: '3',
    itemName: 'Your Court Dress Z Supply',
    emotion: 'resentful',
    letGoDate: 'May 5',
    storeName: 'Z Supply'
  },
  {
    id: '4',
    itemName: 'Arizona Vegan Matte Black Birkenstock',
    emotion: 'resentful',
    letGoDate: 'May 28',
    storeName: 'Birkenstock Store'
  },
  {
    id: '5',
    itemName: 'Montana Short Free People',
    emotion: 'overwhelmed',
    letGoDate: 'May 21',
    storeName: 'Free People'
  },
  {
    id: '6',
    itemName: 'Your Court Dress Z Supply',
    emotion: 'curious',
    letGoDate: 'May 5',
    storeName: 'Z Supply'
  }
];

const MindfulWins = () => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [filteredItems, setFilteredItems] = useState(mockMindfulWins);
  const [showFilters, setShowFilters] = useState(false);

  const emotions = ['burnt out', 'sad', 'resentful', 'overwhelmed', 'curious'];

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
    if (selectedFilter) {
      setFilteredItems(mockMindfulWins.filter(item => item.emotion === selectedFilter));
    } else {
      setFilteredItems(mockMindfulWins);
    }
  }, [selectedFilter]);

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
