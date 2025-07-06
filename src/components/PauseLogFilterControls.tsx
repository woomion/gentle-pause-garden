
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface PauseLogFilterControlsProps {
  emotionFilter: string;
  statusFilter: string;
  tagFilter: string;
  cartFilter: string;
  sortOrder: 'newest' | 'oldest';
  uniqueEmotions: string[];
  uniqueTags: string[];
  onEmotionFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onTagFilterChange: (value: string) => void;
  onCartFilterChange: (value: string) => void;
  onSortOrderToggle: () => void;
}

const PauseLogFilterControls = ({
  emotionFilter,
  statusFilter,
  tagFilter,
  cartFilter,
  sortOrder,
  uniqueEmotions,
  uniqueTags,
  onEmotionFilterChange,
  onStatusFilterChange,
  onTagFilterChange,
  onCartFilterChange,
  onSortOrderToggle
}: PauseLogFilterControlsProps) => {
  return (
    <>
      <div className="mb-2">
        <span className="text-sm text-black dark:text-cream">Filter and sort:</span>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <Select value={emotionFilter} onValueChange={onEmotionFilterChange}>
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

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All outcomes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            <SelectItem value="purchased">Purchased</SelectItem>
            <SelectItem value="let-go">Let go</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={onTagFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {uniqueTags.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={cartFilter} onValueChange={onCartFilterChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={
              <div className="flex items-center gap-2">
                <Plus size={14} />
                <span>Cart</span>
              </div>
            } />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Plus size={14} />
                <span>All types</span>
              </div>
            </SelectItem>
            <SelectItem value="cart">
              <div className="flex items-center gap-2">
                <Plus size={14} />
                <span>Cart only</span>
              </div>
            </SelectItem>
            <SelectItem value="item">Item only</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={onSortOrderToggle}
          className="flex items-center gap-2 rounded-2xl border-gray-200 dark:border-gray-600"
        >
          {sortOrder === 'newest' ? (
            <>
              <ArrowDown size={16} />
              Newest first
            </>
          ) : (
            <>
              <ArrowUp size={16} />
              Oldest first
            </>
          )}
        </Button>
      </div>
    </>
  );
};

export default PauseLogFilterControls;
