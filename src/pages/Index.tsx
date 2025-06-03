import { useState } from 'react';
import PauseHeader from '../components/PauseHeader';
import WelcomeMessage from '../components/WelcomeMessage';
import AddPauseButton from '../components/AddPauseButton';
import InStoreModeButton from '../components/InStoreModeButton';
import PausedSection from '../components/PausedSection';
import PauseLogSection from '../components/PauseLogSection';
import FooterLinks from '../components/FooterLinks';
import PauseForm from '../components/PauseForm';

const Index = () => {
  const [showForm, setShowForm] = useState(false);

  const handleAddPause = () => {
    console.log('Add pause button clicked - form will open after animation');
    // Delay to allow ripple animation to complete
    setTimeout(() => {
      setShowForm(true);
    }, 650); // Slightly longer than the 600ms ripple animation
  };

  const handleCloseForm = () => {
    setShowForm(false);
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
          <PauseLogSection />
          <FooterLinks />
        </div>
      </div>
      
      {showForm && <PauseForm onClose={handleCloseForm} />}
    </>
  );
};

export default Index;
