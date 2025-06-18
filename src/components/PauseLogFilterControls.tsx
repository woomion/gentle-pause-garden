
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface PauseLogFilterControlsProps {
  emotionFilter: string;
  statusFilter: string;
  sortOrder: 'newest' | 'oldest';
  uniqueEmotions: string[];
  onEmotionFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSortOrderToggle: () => void;
}

const PauseLogFilterControls = ({
  emotionFilter,
  statusFilter,
  sortOrder,
  uniqueEmotions,
  onEmotionFilterChange,
  onStatusFilterChange,
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
