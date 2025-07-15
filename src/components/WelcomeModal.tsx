
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Using the uploaded image directly from public folder

interface WelcomeModalProps {
  open: boolean;
  onComplete: (name: string) => void;
  showNameStep?: boolean;
}

const WelcomeModal = ({ open, onComplete, showNameStep = true }: WelcomeModalProps) => {
  const [name, setName] = useState('');
  const [currentScreen, setCurrentScreen] = useState(showNameStep ? 'name' : 1);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      setCurrentScreen(1);
    }
  };

  const handleNext = () => {
    if (typeof currentScreen === 'number') {
      if (currentScreen < 5) {
        setCurrentScreen(currentScreen + 1);
      } else {
        onComplete(name.trim());
      }
    }
  };

  const handleComplete = () => {
    onComplete(name.trim());
  };

  const renderNameScreen = () => (
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
        
        <form onSubmit={handleNameSubmit} className="space-y-4">
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
            className="bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md mt-6 mx-auto block"
            style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
            disabled={!name.trim()}
          >
            Next →
          </button>
        </form>
      </div>
    </>
  );

  const renderScreen1 = () => (
    <>
      <div className="space-y-6 text-center">
        <img 
          src="/lovable-uploads/31b762e2-9f4e-4576-ab49-b6c593e8d060.png" 
          alt="Person contemplating in a peaceful landscape with various items around them"
          className="w-full max-w-xs mx-auto rounded-lg"
        />
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
            Hi {name || 'there'}, you're here.
          </h2>
          
          <p className="text-lg text-black dark:text-[#F9F5EB] font-medium">
            Pocket Pause is a quiet place to check in before you check out.
          </p>
        </div>
        
        <button
          onClick={handleNext}
          className="bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md mt-6 mx-auto block"
          style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
        >
          Next →
        </button>
      </div>
    </>
  );

  const renderCurrentScreen = () => {
    if (currentScreen === 'name') return renderNameScreen();
    if (currentScreen === 1) return renderScreen1();
    
    // Placeholder for screens 2-5
    return (
      <div className="space-y-6 text-center">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          Screen {currentScreen}
        </h2>
        <p className="text-black dark:text-[#F9F5EB]">
          Content for screen {currentScreen} coming soon...
        </p>
        <button
          onClick={handleNext}
          className="bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md mt-6 mx-auto block"
          style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
        >
          {currentScreen === 5 ? 'Get Started' : 'Next →'}
        </button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-white/20" hideCloseButton>
        {renderCurrentScreen()}
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
