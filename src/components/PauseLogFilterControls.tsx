
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface PauseLogFilterControlsProps {
  statusFilters: string[];
  onStatusFiltersChange: (filters: string[]) => void;
}

const PauseLogFilterControls = ({
  statusFilters,
  onStatusFiltersChange
}: PauseLogFilterControlsProps) => {

  const handleStatusToggle = (status: string) => {
    if (statusFilters.includes(status)) {
      onStatusFiltersChange(statusFilters.filter(s => s !== status));
    } else {
      onStatusFiltersChange([...statusFilters, status]);
    }
  };


  return (
    <>
      <div className="mb-2">
        <span className="text-sm text-black dark:text-cream">Filter and sort:</span>
      </div>

      <div className="flex flex-wrap gap-4 items-center">

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

      </div>
    </>
  );
};

export default PauseLogFilterControls;
