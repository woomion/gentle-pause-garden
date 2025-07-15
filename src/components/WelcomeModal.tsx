
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
      if (currentScreen < 6) {
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
          src="/lovable-uploads/da2e57d6-d551-4244-92c8-4ea04dd6a895.png" 
          alt="Purple folder with white dot on cream background"
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

  const renderScreen2 = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          We're not here to budget.
        </h2>
        
        <p className="text-lg text-black dark:text-[#F9F5EB] font-medium">
          This isn't about tracking every penny.<br />
          It's about noticing what's pulling at you — and why.
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
  );

  const renderScreen3 = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          One pause at a time.
        </h2>
        
        <p className="text-lg text-black dark:text-[#F9F5EB] font-medium">
          Add anything you're considering — a sweater, a course, a plan.<br />
          Let it breathe for a day or two. Then check back in.
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
  );

  const renderScreen4 = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          You don't have to pause alone.
        </h2>
        
        <p className="text-lg text-black dark:text-[#F9F5EB] font-medium">
          Share a pause with a partner.<br />
          Reflect together. Decide with care.
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
  );

  const renderScreen5 = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          Joy lives in the choosing.
        </h2>
        
        <p className="text-lg text-black dark:text-[#F9F5EB] font-medium">
          Whether you say yes or no — presence is the point.
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
  );

  const renderScreen6 = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          Here's how to use Pocket Pause
        </h2>
        
        <div className="text-center space-y-4 text-black dark:text-[#F9F5EB] font-medium">
          <div className="space-y-2">
            <p className="font-semibold">Add a pause</p>
            <p>Save something you're considering. Big or small.</p>
          </div>
          
          <div className="space-y-2">
            <p className="font-semibold">Let it breathe</p>
            <p>Take a little space before deciding.</p>
          </div>
          
          <div className="space-y-2">
            <p className="font-semibold">Check back in</p>
            <p>When you're ready, review with care.</p>
          </div>
          
          <div className="space-y-2">
            <p className="font-semibold">Reflect</p>
            <p>Buy it, let it go, or save it for later — with presence.</p>
          </div>
          
          <p className="text-sm italic pt-2">You can even share with a partner for thoughtful decisions together.</p>
        </div>
      </div>
      
      <button
        onClick={handleComplete}
        className="bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md mt-6 mx-auto block"
        style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
      >
        Start Your First Pause →
      </button>
    </div>
  );

  const renderCurrentScreen = () => {
    if (currentScreen === 'name') return renderNameScreen();
    if (currentScreen === 1) return renderScreen1();
    if (currentScreen === 2) return renderScreen2();
    if (currentScreen === 3) return renderScreen3();
    if (currentScreen === 4) return renderScreen4();
    if (currentScreen === 5) return renderScreen5();
    if (currentScreen === 6) return renderScreen6();
    
    return null;
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
