
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
    <div className="space-y-6 text-center">
      <div className="w-full h-48 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
        <img 
          src="/lovable-uploads/fa26fad4-484b-44bb-8724-2aa247b7da6f.png" 
          alt="Abstract illustration showing the noisy world of shopping with paper cutout style elements including shopping carts, quotation marks, and various symbols in layered wavy patterns"
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          The world is noisy.
        </h2>
        
        <p className="text-lg text-black dark:text-[#F9F5EB] font-medium">
          Ads, carts, lists, open tabs, endless options.<br />
          It's easy to forget what you actually want.
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
  );

  const renderScreen2 = () => (
    <div className="space-y-6 text-center">
      <div className="w-full h-48 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
        <img 
          src="/lovable-uploads/e80ad720-84cd-484f-9a75-4b83ade80b53.png" 
          alt="Paper cutout illustration of a jar containing shopping items like a cart, t-shirt, and lipstick, representing how Pocket Pause creates space to hold your considerations"
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          Pocket Pause clears space.
        </h2>
        
        <p className="text-lg text-black dark:text-[#F9F5EB] font-medium">
          This is a space to hold things you're considering and give yourself a little distance before deciding.<br />
          So you can move slower, and choose with intention.
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
      <div className="w-full h-32 bg-muted/50 rounded-lg flex items-center justify-center mb-4">
        <span className="text-muted-foreground text-sm">[Image placeholder]</span>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          Choose your pause.
        </h2>
        
        <p className="text-lg text-black dark:text-[#F9F5EB] font-medium">
          Add something you're considering — a course, a coat, a cart.<br />
          Set a pause length: a day, a week, a month.<br />
          Let it breathe.
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
      <div className="w-full h-32 bg-muted/50 rounded-lg flex items-center justify-center mb-4">
        <span className="text-muted-foreground text-sm">[Image placeholder]</span>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          Come back and reflect.
        </h2>
        
        <p className="text-lg text-black dark:text-[#F9F5EB] font-medium">
          When your pause ends, check back in.<br />
          Do you still want it?<br />
          A pause gives you space to see what really matters.
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
      <div className="w-full h-32 bg-muted/50 rounded-lg flex items-center justify-center mb-4">
        <span className="text-muted-foreground text-sm">[Image placeholder]</span>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB]">
          A little lighter.
        </h2>
        
        <p className="text-lg text-black dark:text-[#F9F5EB] font-medium">
          Fewer impulse buys.<br />
          Fewer open carts.<br />
          Fewer mental tabs.<br />
          More clarity — and calm — in your everyday choices.
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
          How to start.
        </h2>
        
        <div className="text-left space-y-3 max-w-md mx-auto text-black dark:text-[#F9F5EB] font-medium">
          <div className="flex items-start gap-3">
            <span className="text-black dark:text-[#F9F5EB] mt-1">➤</span>
            <span>Add something you're considering</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-black dark:text-[#F9F5EB] mt-1">➤</span>
            <span>Set a pause length</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-black dark:text-[#F9F5EB] mt-1">➤</span>
            <span>Come back when it ends</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-black dark:text-[#F9F5EB] mt-1">➤</span>
            <span>Reflect and decide — with presence</span>
          </div>
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
          Start Your First Pause
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
