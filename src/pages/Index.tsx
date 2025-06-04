
import { useState, useEffect } from 'react';
import PauseHeader from '../components/PauseHeader';
import WelcomeMessage from '../components/WelcomeMessage';
import AddPauseButton from '../components/AddPauseButton';
import InStoreModeButton from '../components/InStoreModeButton';
import PausedSection from '../components/PausedSection';
import PauseLogSection from '../components/PauseLogSection';
import GreaterJoyFundCTA from '../components/GreaterJoyFundCTA';
import FooterLinks from '../components/FooterLinks';
import PauseForm from '../components/PauseForm';
import { useNotifications } from '../hooks/useNotifications';

const Index = () => {
  const [showForm, setShowForm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved ? JSON.parse(saved) : false;
  });

  // Initialize notifications
  useNotifications(notificationsEnabled);

  // Listen for changes to notification settings
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('notificationsEnabled');
      setNotificationsEnabled(saved ? JSON.parse(saved) : false);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
      <div className="min-h-screen bg-cream dark:bg-[#200E3B] transition-colors duration-300">
        <div className="max-w-md mx-auto px-6 py-8">
          <PauseHeader />
          <WelcomeMessage firstName="Michelle" />
          <AddPauseButton onAddPause={handleAddPause} />
          <InStoreModeButton />
          <PausedSection />
          <GreaterJoyFundCTA />
          <PauseLogSection />
          <FooterLinks />
        </div>
      </div>
      
      {showForm && <PauseForm onClose={handleCloseForm} />}
    </>
  );
};

export default Index;
