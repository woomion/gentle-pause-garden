
import { useState } from 'react';
import PauseHeader from '../components/PauseHeader';
import WelcomeMessage from '../components/WelcomeMessage';
import AddPauseButton from '../components/AddPauseButton';
import InStoreModeButton from '../components/InStoreModeButton';
import PausedSection from '../components/PausedSection';
import GreaterJoySection from '../components/GreaterJoySection';
import MindfulWinsSection from '../components/MindfulWinsSection';
import FooterLinks from '../components/FooterLinks';
import PauseForm from '../components/PauseForm';
import { Sheet, SheetContent } from '../components/ui/sheet';

const Index = () => {
  const [showForm, setShowForm] = useState(false);

  const handleAddPause = () => {
    console.log('Add pause button clicked - form will open after delay');
    // Add a delay to allow the ripple animation to show
    setTimeout(() => {
      setShowForm(true);
    }, 600); // 600ms matches the ripple animation duration
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto px-6 py-8">
        <PauseHeader />
        <WelcomeMessage firstName="Michelle" />
        <AddPauseButton onAddPause={handleAddPause} />
        <InStoreModeButton />
        <PausedSection />
        <GreaterJoySection />
        <MindfulWinsSection />
        <FooterLinks />
      </div>
      
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent 
          side="bottom" 
          className="h-[95vh] max-h-[95vh] bg-cream border-t border-gray-200 rounded-t-2xl p-6 overflow-hidden"
        >
          <PauseForm onClose={() => setShowForm(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Index;
