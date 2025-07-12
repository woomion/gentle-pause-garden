
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
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Pocket Pause is independently made and still growing.
            </p>
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
