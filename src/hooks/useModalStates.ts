import { useState } from 'react';

export const useModalStates = () => {
  const [showForm, setShowForm] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupModalDismissed, setSignupModalDismissed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const handleAddPause = () => {
    // Delay to allow ripple animation to complete
    setTimeout(() => {
      setShowForm(true);
    }, 650);
  };

  const handleCloseForm = () => {
    setShowForm(false);
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

  const handleStartReview = () => {
    setShowReviewModal(true);
  };

  const handleCloseReview = () => {
    setShowReviewModal(false);
  };

  return {
    // State
    showForm,
    showWelcomeModal,
    showSignupModal,
    signupModalDismissed,
    showReviewModal,
    
    // Actions
    setShowWelcomeModal,
    handleAddPause,
    handleCloseForm,
    handleShowSignup,
    handleCloseSignup,
    handleStartReview,
    handleCloseReview,
  };
};