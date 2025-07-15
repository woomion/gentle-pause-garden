
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

  const handleBack = () => {
    if (typeof currentScreen === 'number' && currentScreen > 1) {
      setCurrentScreen(currentScreen - 1);
    } else if (currentScreen === 1 && showNameStep) {
      setCurrentScreen('name');
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
        
        <div className="flex justify-center gap-3 mt-6">
          {showNameStep && (
            <button
              onClick={handleBack}
              className="bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            className="bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
            style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
          >
            Next →
          </button>
        </div>
      </div>
    </>
  );

  const renderScreen2 = () => (
    <div className="space-y-6 text-center">
      <img 
        src="/lovable-uploads/1367d743-1b24-47dd-adba-c17931d597c6.png" 
        alt="Yellow curved line on cream background"
        className="w-full max-w-xs mx-auto rounded-lg"
      />
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          We're not here to budget.
        </h2>
        
        <p className="text-lg text-black dark:text-[#F9F5EB] font-medium">
          This isn't about tracking every penny.<br />
          It's about noticing what's pulling at you — and why.
        </p>
      </div>
      
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={handleBack}
          className="bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
          style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
        >
          Next →
        </button>
      </div>
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
      
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={handleBack}
          className="bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
          style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
        >
          Next →
        </button>
      </div>
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
      
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={handleBack}
          className="bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
          style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
        >
          Next →
        </button>
      </div>
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
      
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={handleBack}
          className="bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
          style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
        >
          Next →
        </button>
      </div>
    </div>
  );

  const renderScreen6 = () => (
    <div className="space-y-6 text-center">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          Here's how to use Pocket Pause
        </h2>
        
        <div className="text-center space-y-4 text-black dark:text-[#F9F5EB] font-medium">
          <div className="space-y-0.5">
            <p className="font-semibold">Add an item to pause</p>
            <p>Add any item you're thinking about buying.</p>
          </div>
          
          <div className="space-y-0.5">
            <p className="font-semibold">Let it breathe</p>
            <p>Set how long you want to wait before deciding.</p>
          </div>
          
          <div className="space-y-0.5">
            <p className="font-semibold">Check back in</p>
            <p>Review your item when the pause period ends.</p>
          </div>
          
          <div className="space-y-0.5">
            <p className="font-semibold">Reflect</p>
            <p>Choose to purchase, let go of, or pause again.</p>
          </div>
          
          <p className="text-sm italic pt-2">You can also share paused items with a partner for thoughtful decisions together.</p>
        </div>
      </div>
      
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={handleBack}
          className="bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200"
        >
          ← Back
        </button>
        <button
          onClick={handleComplete}
          className="bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-white font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
          style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
        >
          Start Your First Pause →
        </button>
      </div>
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
    <Dialog open={open} onOpenChange={(open) => !open && onComplete(name.trim())}>
      <DialogContent className="max-w-md mx-auto bg-cream dark:bg-[#200E3B] border-gray-200 dark:border-white/20">
        {renderCurrentScreen()}
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
