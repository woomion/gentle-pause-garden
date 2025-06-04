
import { useState } from 'react';
import DonationModal from './DonationModal';

const SupportCTA = () => {
  const [showDonationModal, setShowDonationModal] = useState(false);

  return (
    <>
      <div className="text-center mb-6">
        <button 
          onClick={() => setShowDonationModal(true)}
          className="text-sm text-gray-600 dark:text-gray-300 hover:text-[#CAB6F7] dark:hover:text-[#CAB6F7] transition-colors underline decoration-dotted underline-offset-4"
        >
          Support the Pause →
        </button>
      </div>

      <DonationModal 
        open={showDonationModal} 
        onOpenChange={setShowDonationModal} 
      />
    </>
  );
};

export default SupportCTA;
