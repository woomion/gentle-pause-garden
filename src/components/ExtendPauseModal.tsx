import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExtendPauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtend: (duration: string) => void;
  itemName: string;
}

const ExtendPauseModal = ({ isOpen, onClose, onExtend, itemName }: ExtendPauseModalProps) => {
  const [duration, setDuration] = useState('1-week');
  const [otherDuration, setOtherDuration] = useState('');

  const handleExtend = () => {
    onExtend(otherDuration || duration);
    onClose();
  };

  const handleDurationSelect = (selectedDuration: string) => {
    setDuration(selectedDuration);
    setOtherDuration(''); // Clear dropdown selection
  };

  const handleOtherDurationSelect = (value: string) => {
    setOtherDuration(value);
    setDuration(''); // Clear button selection
  };

  const otherPauseLengths = [
    '2-weeks',
    '1-month', 
    '3-months'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-cream dark:bg-background border-gray-200 dark:border-border max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-black dark:text-foreground text-lg">
            Give it more time
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-black dark:text-foreground">
            How much longer would you like to pause <em>{itemName}</em>?
          </p>
          
          <div className="space-y-2">
            <Label className="text-black dark:text-foreground font-medium text-base">
              Pause for
            </Label>
            
            {/* Row of three buttons */}
            <div className="grid grid-cols-3 gap-2">
              {['24-hours', '3-days', '1-week'].map((durationOption) => (
                <button
                  key={durationOption}
                  onClick={() => handleDurationSelect(durationOption)}
                  className={`py-3 px-2 rounded-xl border-2 transition-all text-sm ${
                    duration === durationOption
                      ? 'bg-lavender border-lavender text-dark-gray'
                      : 'bg-white dark:bg-muted border-gray-200 dark:border-border text-dark-gray dark:text-foreground hover:border-lavender/50'
                  }`}
                >
                  {durationOption === '24-hours' ? '24 hours' : 
                   durationOption === '3-days' ? '3 days' : '1 week'}
                </button>
              ))}
            </div>
            
            {/* Other pause lengths dropdown */}
            <Select 
              value={otherDuration} 
              onValueChange={handleOtherDurationSelect}
            >
              <SelectTrigger className={`bg-white dark:bg-muted border-2 rounded-xl py-3 px-4 transition-all dark:text-foreground z-50 ${
                otherDuration ? 'border-lavender bg-lavender dark:bg-lavender text-dark-gray' : 'border-gray-200 dark:border-gray-600 hover:border-lavender/50'
              }`}>
                <SelectValue placeholder="Other pause lengths" className="placeholder:text-[#B0ABB7] dark:placeholder:text-gray-400 placeholder:font-normal text-base" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-popover border-gray-200 dark:border-border rounded-xl z-50">
                {otherPauseLengths.map((duration) => (
                  <SelectItem key={duration} value={duration} className="rounded-lg my-1 dark:text-foreground dark:focus:bg-muted">
                    {duration === '2-weeks' ? '2 weeks' :
                     duration === '1-month' ? '1 month' : '3 months'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/60 dark:bg-muted border-gray-200 dark:border-border text-black dark:text-foreground hover:bg-white/80 dark:hover:bg-muted/80"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtend}
              className="flex-1 bg-lavender text-black hover:bg-lavender/90 font-medium"
            >
              Extend Pause
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExtendPauseModal;