
import { useState } from 'react';
import { Star } from 'lucide-react';
import DonationModal from './DonationModal';

const GreaterJoyDonation = () => {
  const [showDonationModal, setShowDonationModal] = useState(false);

  return (
    <>
      <div className="mt-12 pt-8">
        <div className="rounded-2xl p-6 max-w-sm mx-auto md:mx-0" style={{ backgroundColor: '#F2E8FF' }}>
          <div className="space-y-1 text-left">
            <p className="text-sm text-black dark:text-black leading-relaxed">
              Pocket Pause is independently made and still growing. To help support its next chapter:
            </p>
            
            <button 
              onClick={() => setShowDonationModal(true)}
              className="text-sm text-black dark:text-black hover:text-[#6B4C9A] dark:hover:text-[#6B4C9A] transition-colors underline decoration-dotted underline-offset-4 inline-flex items-center gap-2 mt-2"
            >
              <Star size={14} />
              <span>Make a one-time gift</span>
            </button>
          </div>
        </div>
      </div>

      <DonationModal 
        open={showDonationModal} 
        onOpenChange={setShowDonationModal} 
      />
    </>
  );
};

export default GreaterJoyDonation;
