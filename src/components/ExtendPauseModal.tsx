import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ExtendPauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtend: (duration: string, otherDuration?: string) => void;
  itemName: string;
}

const ExtendPauseModal = ({ isOpen, onClose, onExtend, itemName }: ExtendPauseModalProps) => {
  const [duration, setDuration] = useState('1-week');
  const [otherDuration, setOtherDuration] = useState('');

  const handleExtend = () => {
    onExtend(duration, duration === 'other' ? otherDuration : undefined);
    onClose();
  };

  const durationOptions = [
    { value: '1-day', label: 'Another day' },
    { value: '3-days', label: '3 more days' },
    { value: '1-week', label: 'Another week' },
    { value: '2-weeks', label: '2 more weeks' },
    { value: '1-month', label: 'Another month' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-white/20 max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-black dark:text-[#F9F5EB] font-crimson text-lg">
            Give it more time
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="text-sm text-black dark:text-[#F9F5EB] font-crimson">
            How much longer would you like to pause <em>{itemName}</em>?
          </p>
          
          <RadioGroup value={duration} onValueChange={setDuration} className="space-y-3">
            {durationOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={option.value} 
                  id={option.value}
                  className="border-muted-foreground text-primary"
                />
                <Label 
                  htmlFor={option.value}
                  className="text-black dark:text-[#F9F5EB] font-medium cursor-pointer text-sm"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          {duration === 'other' && (
            <div className="mt-3">
              <Label htmlFor="other-duration" className="text-black dark:text-[#F9F5EB] text-sm">
                Specify duration
              </Label>
              <Input
                id="other-duration"
                value={otherDuration}
                onChange={(e) => setOtherDuration(e.target.value)}
                placeholder="e.g., 5 days, 3 weeks"
                className="mt-2 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-sm"
              />
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB] hover:bg-white/80 dark:hover:bg-white/20"
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