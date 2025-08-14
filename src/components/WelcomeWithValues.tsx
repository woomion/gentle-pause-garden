import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserValues } from '@/hooks/useUserValues';
import WelcomeMessage from './WelcomeMessage';
import { ValuesSetupModal } from './ValuesSetupModal';
import { useState, useEffect } from 'react';

export const WelcomeWithValues: React.FC = () => {
  const { user } = useAuth();
  const { userValues, isLoading, refetch } = useUserValues();
  const [showValuesSetup, setShowValuesSetup] = useState(false);

  // Show values setup for authenticated users who haven't completed it
  useEffect(() => {
    if (user && !isLoading && !userValues.values_setup_completed) {
      setShowValuesSetup(true);
    }
  }, [user, userValues.values_setup_completed, isLoading]);

  const handleValuesComplete = () => {
    refetch(); // Refresh user values after completion
    setShowValuesSetup(false);
  };

  return (
    <>
      <WelcomeMessage />
      
      {user && (
        <ValuesSetupModal
          isOpen={showValuesSetup}
          onClose={() => setShowValuesSetup(false)}
          onComplete={handleValuesComplete}
          existingValues={userValues.values_selected}
        />
      )}
    </>
  );
};