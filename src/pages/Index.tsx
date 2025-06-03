
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

const Index = () => {
  const [showForm, setShowForm] = useState(false);

  const handleAddPause = () => {
    console.log('Add pause button clicked - opening form after animation');
    // Delay to allow ripple animation to complete
    setTimeout(() => {
      setShowForm(true);
    }, 600); // Matches the ripple animation duration
  };

  return (
    <>
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
      </div>
      
      <PauseForm 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
      />
    </>
  );
};

export default Index;
