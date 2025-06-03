
import { useState } from 'react';
import PauseHeader from '../components/PauseHeader';
import WelcomeMessage from '../components/WelcomeMessage';
import AddPauseButton from '../components/AddPauseButton';
import InStoreModeButton from '../components/InStoreModeButton';
import PausedSection from '../components/PausedSection';
import GreaterJoySection from '../components/GreaterJoySection';
import MindfulWinsSection from '../components/MindfulWinsSection';
import FooterLinks from '../components/FooterLinks';

const Index = () => {
  const [showForm, setShowForm] = useState(false);

  const handleAddPause = () => {
    console.log('Add pause button clicked - form will open here');
    // TODO: Open pause item form
    setShowForm(true);
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
      
      {showForm && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4">
          <div className="bg-cream rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-dark-gray mb-4">Pause Item Form</h3>
            <p className="text-taupe text-sm mb-4">Form will be built in next step</p>
            <button 
              onClick={() => setShowForm(false)}
              className="w-full bg-lavender text-dark-gray py-2 px-4 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
