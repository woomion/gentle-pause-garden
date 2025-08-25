import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import WelcomeMessage from './WelcomeMessage';

export const WelcomeWithValues: React.FC = () => {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.first_name || '';
  
  return (
    <>
      <WelcomeMessage firstName={firstName} />
    </>
  );
};