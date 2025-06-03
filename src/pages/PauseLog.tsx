import { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { pauseLogStore, PauseLogItem } from '../stores/pauseLogStore';

const PauseLog = () => {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [pauseLogItems, setPauseLogItems] = useState<PauseLogItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<PauseLogItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const emotions = ['burnt out', 'sad', 'resentful', 'overwhelmed', 'curious', 'bored', 'inspired', 'deserving', 'anxious', 'lonely', 'celebratory', 'something else'];
  const statuses = ['purchased', 'let-go'];

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

  const deleteItem = (id: string) => {
    pauseLogStore.deleteItem(id);
  };

  useEffect(() => {
    // Load pause log items and set up subscription
    const loadItems = () => {
      setPauseLogItems(pauseLogStore.getItems());
    };

    loadItems();
    const unsubscribe = pauseLogStore.subscribe(loadItems);

    return unsubscribe;
  }, []);

  useEffect(() => {
    let filtered = pauseLogItems;

    // Filter by emotions
    if (selectedEmotions.length > 0) {
      filtered = filtered.filter(item => selectedEmotions.includes(item.emotion));
    }

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(item => selectedStatuses.includes(item.status));
    }

    setFilteredItems(filtered);
  }, [selectedEmotions, selectedStatuses, pauseLogItems]);

  const handleEmotionClick = (emotion: string) => {
    setSelectedEmotions(prev => 
      prev.includes(emotion) 
        ? prev.filter(e => e !== emotion)
        : [...prev, emotion]
    );
  };

  const handleStatusClick = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearAllFilters = () => {
    setSelectedEmotions([]);
    setSelectedStatuses([]);
    setShowFilters(false);
  };

  const getItemCount = filteredItems.length;
  const hasActiveFilters = selectedEmotions.length > 0 || selectedStatuses.length > 0;

  // Empty state when no items have been let go of yet
  if (pauseLogItems.length === 0) {
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
          <h1 className="text-2xl font-semibold text-black mb-6">Your Pause Log</h1>

          {/* Empty state */}
          <div className="bg-white/60 rounded-lg p-8 text-center border border-gray-200 mt-16">
            <p className="text-gray-500 text-lg mb-2">Nothing here yet</p>
            <p className="text-gray-400 text-sm">
              When you decide to let go of paused items, they'll appear here in your pause log.
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
        <h1 className="text-2xl font-semibold text-black mb-6">Your Pause Log</h1>

        {/* Filter Section */}
        <div className="mb-6">
          {hasActiveFilters ? (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
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
              
              {/* Active filters */}
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedEmotions.map(emotion => (
                  <Badge 
                    key={emotion}
                    className="px-3 py-1 text-sm cursor-pointer text-black"
                    style={{ backgroundColor: getEmotionColor(emotion) }}
                    onClick={() => handleEmotionClick(emotion)}
                  >
                    {emotion} ×
                  </Badge>
                ))}
                {selectedStatuses.map(status => (
                  <Badge 
                    key={status}
                    className="px-3 py-1 text-sm cursor-pointer bg-gray-200 text-black"
                    onClick={() => handleStatusClick(status)}
                  >
                    {status === 'purchased' ? 'Purchased' : 'Let go'} ×
                  </Badge>
                ))}
              </div>
              
              <button 
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-black underline"
              >
                Clear all filters
              </button>
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

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-lg p-4 mb-4 border">
              <div className="space-y-4">
                {/* Emotion filters */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Filter by emotion:</h4>
                  <div className="flex flex-wrap gap-2">
                    {emotions.map(emotion => (
                      <Badge
                        key={emotion}
                        className={`cursor-pointer hover:opacity-80 text-black ${
                          selectedEmotions.includes(emotion) ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{ backgroundColor: getEmotionColor(emotion) }}
                        onClick={() => handleEmotionClick(emotion)}
                      >
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Status filters */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Filter by action:</h4>
                  <div className="flex gap-2">
                    {statuses.map(status => (
                      <Badge
                        key={status}
                        className={`cursor-pointer hover:opacity-80 bg-gray-200 text-black ${
                          selectedStatuses.includes(status) ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleStatusClick(status)}
                      >
                        {status === 'purchased' ? 'Purchased' : 'Let go'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white/60 rounded-lg p-4 border border-gray-200 relative">
              <div className="mb-2">
                <h3 className="font-medium text-black">{item.itemName}</h3>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Paused while feeling</span>
                <Badge
                  className="text-xs text-black"
                  style={{ backgroundColor: getEmotionColor(item.emotion), color: '#000' }}
                >
                  {item.emotion}
                </Badge>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {item.status === 'purchased' ? `Purchased on ${item.letGoDate}` : `Let go of on ${item.letGoDate}`}
              </div>
              {item.notes && (
                <div className="text-sm text-gray-700 italic bg-gray-50 p-2 rounded mt-2">
                  "{item.notes}"
                </div>
              )}
              
              {/* Delete button in bottom right */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="absolute bottom-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash size={16} />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent style={{ backgroundColor: '#FAF6F1' }} className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete from Pause Log?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove "{item.itemName}" from your pause log. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteItem(item.id)} className="rounded-2xl">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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

export default PauseLog;
