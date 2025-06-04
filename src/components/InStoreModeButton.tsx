
import { useState, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import EmailSignupModal from './EmailSignupModal';

const InStoreModeButton = () => {
  const [showEmailModal, setShowEmailModal] = useState(false);

  const handleClick = useCallback(() => {
    setShowEmailModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowEmailModal(false);
  }, []);

  return (
    <>
      <button 
        onClick={handleClick}
        className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full text-black dark:text-[#F9F5EB] hover:text-taupe dark:hover:text-[#CAB6F7] transition-colors duration-200 mb-8 py-2 group focus:outline-none focus:ring-2 focus:ring-[#CAB6F7] focus:ring-offset-2 rounded-lg"
        aria-label="Sign up for In-Store Mode updates"
      >
        <span className="text-sm font-medium">Shopping in person?</span>
        <span className="text-sm font-medium relative flex items-center gap-2">
          Use In-Store Mode (coming soon)
          <div 
            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#DFCBFC] group-hover:bg-[#CAB6F7] transition-colors duration-200"
            aria-hidden="true"
          />
          <ArrowRight 
            size={16} 
            className="group-hover:translate-x-1 transition-transform duration-200" 
            aria-hidden="true"
          />
        </span>
      </button>

      {showEmailModal && (
        <EmailSignupModal onClose={handleCloseModal} />
      )}
    </>
  );
};

export default InStoreModeButton;
