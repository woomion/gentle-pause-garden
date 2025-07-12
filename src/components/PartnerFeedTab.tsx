import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import PausePartnersSection from './PausePartnersSection';
import { Button } from '@/components/ui/button';
import { Users, Crown } from 'lucide-react';

const PartnerFeedTab = () => {
  const { user } = useAuth();
  const { hasPausePartnerAccess } = useSubscription();

  if (!hasPausePartnerAccess) {
    return (
      <div className="mb-8">
        <div className="text-center py-12">
          <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2 text-black dark:text-[#F9F5EB]">
            Upgrade to Pause Partner
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Connect with partners, share pause items, and support each other's mindful shopping journey.
          </p>
          <Button>Upgrade Now</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-6">
      {/* Partner Management Section */}
      <PausePartnersSection />
      
      {/* Partner Feed Section - Coming Soon */}
      <div>
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
          Partner Feed
        </h2>
        <p className="text-black dark:text-[#F9F5EB] text-lg mb-3">
          Items shared with your pause partners
        </p>

        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2 text-black dark:text-[#F9F5EB]">
            Partner Feed Coming Soon
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            We're working on the partner feed feature. For now, you can manage your pause partners above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PartnerFeedTab;