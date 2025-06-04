
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WelcomeModalProps {
  open: boolean;
  onComplete: (name: string) => void;
}

const WelcomeModal = ({ open, onComplete }: WelcomeModalProps) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      onComplete(trimmedName);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-white/20" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-black dark:text-[#F9F5EB] text-center">
            Welcome to Pocket Pause
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-black dark:text-[#F9F5EB] font-medium">
                What's your name?
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your first name"
                className="mt-2 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB] placeholder:text-gray-500 dark:placeholder:text-gray-400"
                autoFocus
              />
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="text-center space-y-3">
                <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB]">
                  How Pocket Pause works:
                </h3>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>• Add items you're considering buying</p>
                  <p>• Set a pause period to think it over</p>
                  <p>• We'll remind you when it's time to decide</p>
                  <p>• Make more intentional purchase decisions</p>
                </div>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-6"
              disabled={!name.trim()}
            >
              Got it!
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
