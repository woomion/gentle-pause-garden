
import { useState } from 'react';
import { Star } from 'lucide-react';
import DonationModal from './DonationModal';

const SupportCTA = () => {
  const [showDonationModal, setShowDonationModal] = useState(false);

  return (
    <>
      <div className="text-center mb-6">
        <button 
          onClick={() => setShowDonationModal(true)}
          className="text-xs hover:text-[#CAB6F7] transition-colors underline decoration-dotted underline-offset-4 inline-flex items-center gap-2"
          style={{ color: '#A6A1AD' }}
        >
          <Star size={12} />
          <span>[ Support the Pause ]</span>
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
