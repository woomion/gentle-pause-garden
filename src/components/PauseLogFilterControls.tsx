
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getEmotionColor } from '../utils/emotionColors';


interface PauseLogFilterControlsProps {
  emotionFilters: string[];
  statusFilters: string[];
  tagFilters: string[];
  uniqueEmotions: string[];
  uniqueTags: string[];
  onEmotionFiltersChange: (filters: string[]) => void;
  onStatusFiltersChange: (filters: string[]) => void;
  onTagFiltersChange: (filters: string[]) => void;
}

const PauseLogFilterControls = ({
  emotionFilters,
  statusFilters,
  tagFilters,
  uniqueEmotions,
  uniqueTags,
  onEmotionFiltersChange,
  onStatusFiltersChange,
  onTagFiltersChange
}: PauseLogFilterControlsProps) => {
  
  
  const handleEmotionToggle = (emotion: string) => {
    if (emotionFilters.includes(emotion)) {
      onEmotionFiltersChange(emotionFilters.filter(e => e !== emotion));
    } else {
      onEmotionFiltersChange([...emotionFilters, emotion]);
    }
  };

  const handleStatusToggle = (status: string) => {
    if (statusFilters.includes(status)) {
      onStatusFiltersChange(statusFilters.filter(s => s !== status));
    } else {
      onStatusFiltersChange([...statusFilters, status]);
    }
  };

  const handleTagToggle = (tag: string) => {
    if (tagFilters.includes(tag)) {
      onTagFiltersChange(tagFilters.filter(t => t !== tag));
    } else {
      onTagFiltersChange([...tagFilters, tag]);
    }
  };

  return (
    <>
      <div className="mb-2">
        <span className="text-sm text-black dark:text-cream">Filter and sort:</span>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        {/* Emotions Multi-Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-40 justify-between text-black dark:text-[#F9F5EB] border-gray-200 dark:border-gray-600 bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20">
              {emotionFilters.length === 0 
                ? "All emotions" 
                : `${emotionFilters.length} emotion${emotionFilters.length > 1 ? 's' : ''}`
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 bg-white dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 z-50">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uniqueEmotions.map(emotion => (
                <div key={emotion} className="flex items-center space-x-2">
                  <Checkbox
                    id={`emotion-${emotion}`}
                    checked={emotionFilters.includes(emotion)}
                    onCheckedChange={() => handleEmotionToggle(emotion)}
                  />
                  <label
                    htmlFor={`emotion-${emotion}`}
                    className="flex items-center gap-2 text-sm cursor-pointer flex-1 text-black dark:text-[#F9F5EB]"
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getEmotionColor(emotion, false) }}
                    />
                    <span className="capitalize">{emotion}</span>
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Status Multi-Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-40 justify-between text-black dark:text-[#F9F5EB] border-gray-200 dark:border-gray-600 bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20">
              {statusFilters.length === 0 
                ? "All outcomes" 
                : `${statusFilters.length} selected`
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 bg-white dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 z-50">
            <div className="space-y-2">
              {['purchased', 'let-go'].map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={statusFilters.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm cursor-pointer flex-1 text-black dark:text-[#F9F5EB]"
                  >
                    {status === 'purchased' ? 'Purchased' : 'Let go'}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Tags Multi-Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-40 justify-between text-black dark:text-[#F9F5EB] border-gray-200 dark:border-gray-600 bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20">
              {tagFilters.length === 0 
                ? "All tags" 
                : `${tagFilters.length} tag${tagFilters.length > 1 ? 's' : ''}`
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-60 bg-white dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 z-50">
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {uniqueTags.map(tag => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={tagFilters.includes(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  />
                  <label
                    htmlFor={`tag-${tag}`}
                    className="text-sm cursor-pointer flex-1 text-black dark:text-[#F9F5EB]"
                  >
                    {tag}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
};

export default PauseLogFilterControls;
