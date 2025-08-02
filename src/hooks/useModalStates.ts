import { useState } from 'react';

export const useModalStates = () => {
  const [showForm, setShowForm] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupModalDismissed, setSignupModalDismissed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewType, setReviewType] = useState<'solo' | 'partner'>('solo');
  const [formInitialData, setFormInitialData] = useState<any>(null);

  const handleAddPause = (parsedData?: any) => {
    setFormInitialData(parsedData);
    // Delay to allow ripple animation to complete
    setTimeout(() => {
      setShowForm(true);
    }, 650);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormInitialData(null); // Clear initial data when closing
  };

  const handleShowSignup = () => {
    // Only show signup modal if user is not authenticated AND hasn't dismissed it
    if (!signupModalDismissed) {
      setShowSignupModal(true);
    }
  };

  const handleCloseSignup = () => {
    setShowSignupModal(false);
    setSignupModalDismissed(true);
  };

  const handleStartReview = (type: 'solo' | 'partner' = 'solo') => {
    setReviewType(type);
    setShowReviewModal(true);
  };

  const handleCloseReview = () => {
    setShowReviewModal(false);
  };

  return {
    // State
    showForm,
    showSignupModal,
    signupModalDismissed,
    showReviewModal,
    reviewType,
    formInitialData,
    
    // Actions
    handleAddPause,
    handleCloseForm,
    handleShowSignup,
    handleCloseSignup,
    handleStartReview,
    handleCloseReview,
  };
};