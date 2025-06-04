
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
  const [step, setStep] = useState(1);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName && step === 1) {
      setStep(2);
    }
  };

  const handleComplete = () => {
    onComplete(name.trim());
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-white/20" hideCloseButton>
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-black dark:text-[#F9F5EB] text-center">
                Welcome to Pocket Pause
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <p className="text-center text-black dark:text-[#F9F5EB] font-medium">
                Let's make it personal.
              </p>
              
              <form onSubmit={handleNextStep} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-black dark:text-[#F9F5EB] font-medium">
                    What should we call you?
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your first name"
                    className="mt-2 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB] placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    You can change this later in Settings.
                  </p>
                </div>
                
                <button
                  type="submit"
                  className="bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md mt-6 mx-auto block"
                  style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
                  disabled={!name.trim()}
                >
                  Next →
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-black dark:text-[#F9F5EB] text-center">
                How Pocket Pause works
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <p className="text-center text-black dark:text-[#F9F5EB] font-medium">
                Pocket Pause helps you take a breath before you buy.
              </p>
              
              <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                <p>• Add something you're thinking about purchasing</p>
                <p>• Set a pause time to reflect</p>
                <p>• Get a reminder when it's time to decide</p>
                <p>• Choose to let it go, or move forward with clarity</p>
              </div>
              
              <p className="text-center text-black dark:text-[#F9F5EB] font-medium italic">
                A small pause. A clearer choice.
              </p>
              
              <button
                onClick={handleComplete}
                className="bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md mt-6 mx-auto block"
                style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
              >
                Got it
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
