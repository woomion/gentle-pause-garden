
import { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { pauseLogStore, PauseLogItem } from '../stores/pauseLogStore';
import PauseHeader from '../components/PauseHeader';

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
    setShowFilters(false); // Close filter dropdown when an emotion is selected
  };

  const handleStatusClick = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    setShowFilters(false); // Close filter dropdown when a status is selected
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
      <div className="min-h-screen bg-cream dark:bg-[#200E3B]">
        <div className="max-w-md mx-auto px-6 py-8">
          <PauseHeader />

          {/* Back button */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center gap-2 text-black dark:text-[#F9F5EB] hover:text-gray-600 dark:hover:text-gray-300">
              <ArrowLeft size={20} />
              <span className="text-sm">Back to Home</span>
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-6">Your Pause Log</h1>

          {/* Empty state */}
          <div className="bg-white/60 dark:bg-white/10 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-600 mt-16">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Nothing here yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              When you make decisions on your paused items, they'll appear here in your Pause Log.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-16 text-center text-xs text-gray-400 dark:text-gray-500">
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
    <div className="min-h-screen bg-cream dark:bg-[#200E3B]">
      <div className="max-w-md mx-auto px-6 py-8">
        <PauseHeader />

        {/* Back button */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-black dark:text-[#F9F5EB] hover:text-gray-600 dark:hover:text-gray-300">
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Home</span>
          </Link>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-6">Your Pause Log</h1>

        {/* Filter Section */}
        <div className="mb-6">
          {hasActiveFilters ? (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm text-gray-600 dark:text-gray-300">{getItemCount} items</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} className="mr-2" />
                  Filters active
                </Button>
              </div>
              
              {/* Active filters */}
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedEmotions.map(emotion => (
                  <span 
                    key={emotion}
                    className="inline-block px-2 py-1 rounded text-xs font-medium cursor-pointer"
                    style={{ 
                      backgroundColor: getEmotionColor(emotion),
                      color: '#000'
                    }}
                    onClick={() => handleEmotionClick(emotion)}
                  >
                    {emotion} ×
                  </span>
                ))}
                {selectedStatuses.map(status => (
                  <span 
                    key={status}
                    className="inline-block px-2 py-1 rounded text-xs font-medium cursor-pointer bg-gray-200 dark:bg-gray-600 text-black dark:text-white"
                    onClick={() => handleStatusClick(status)}
                  >
                    {status === 'purchased' ? 'Purchased' : 'Let go'} ×
                  </span>
                ))}
              </div>
              
              <button 
                onClick={clearAllFilters}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={16} className="mr-2" />
                Filter
              </Button>
            </div>
          )}

          {/* Filter Dropdown */}
          {showFilters && (
            <div className="bg-white dark:bg-white/10 rounded-lg shadow-lg p-4 mb-4 border border-gray-200 dark:border-gray-600">
              <div className="space-y-4">
                {/* Emotion filters */}
                <div>
                  <h4 className="text-sm font-medium mb-2 text-black dark:text-[#F9F5EB]">Filter by emotion:</h4>
                  <div className="flex flex-wrap gap-2">
                    {emotions.map(emotion => (
                      <span
                        key={emotion}
                        className={`cursor-pointer hover:opacity-80 inline-block px-2 py-1 rounded text-xs font-medium ${
                          selectedEmotions.includes(emotion) ? 'ring-2 ring-blue-500' : ''
                        }`}
                        style={{ 
                          backgroundColor: getEmotionColor(emotion),
                          color: '#000'
                        }}
                        onClick={() => handleEmotionClick(emotion)}
                      >
                        {emotion}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Status filters */}
                <div>
                  <h4 className="text-sm font-medium mb-2 text-black dark:text-[#F9F5EB]">Filter by action:</h4>
                  <div className="flex gap-2">
                    {statuses.map(status => (
                      <span
                        key={status}
                        className={`cursor-pointer hover:opacity-80 bg-gray-200 dark:bg-gray-600 text-black dark:text-white inline-block px-2 py-1 rounded text-xs font-medium ${
                          selectedStatuses.includes(status) ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleStatusClick(status)}
                      >
                        {status === 'purchased' ? 'Purchased' : 'Let go'}
                      </span>
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
            <div key={item.id} className="bg-white/60 dark:bg-white/10 rounded-lg p-4 border border-gray-200 dark:border-gray-600 relative">
              <div className="mb-2">
                <h3 className="font-medium text-black dark:text-[#F9F5EB]">{item.itemName}</h3>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Paused while feeling</span>
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
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {item.status === 'purchased' ? `Purchased on ${item.letGoDate}` : `Let go of on ${item.letGoDate}`}
              </div>
              {item.notes && (
                <div className="text-sm text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-700 p-2 rounded mt-2">
                  "{item.notes}"
                </div>
              )}
              
              {/* Delete button in bottom right */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="absolute bottom-3 right-3 p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                    <Trash size={16} />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">Delete from Pause Log?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                      This will permanently remove "{item.itemName}" from your pause log. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-2xl bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteItem(item.id)} className="rounded-2xl bg-red-500 hover:bg-red-600 text-white">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-xs text-gray-400 dark:text-gray-500">
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
