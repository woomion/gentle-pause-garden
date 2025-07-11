import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Users } from 'lucide-react';
import { usePausePartners } from '@/hooks/usePausePartners';
import { useSubscription } from '@/hooks/useSubscription';

interface PartnerSharingSectionProps {
  selectedPartners: string[];
  onPartnersChange: (partners: string[]) => void;
}

const PartnerSharingSection = ({ selectedPartners, onPartnersChange }: PartnerSharingSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { partners } = usePausePartners();
  const { hasPausePartnerAccess } = useSubscription();

  if (!hasPausePartnerAccess() || partners.length === 0) {
    return null;
  }

  const handlePartnerToggle = (partnerId: string, checked: boolean) => {
    if (checked) {
      onPartnersChange([...selectedPartners, partnerId]);
    } else {
      onPartnersChange(selectedPartners.filter(id => id !== partnerId));
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between py-3 px-4 text-left bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium text-black dark:text-[#F9F5EB]">
              Share with pause partners
            </span>
            {selectedPartners.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({selectedPartners.length} selected)
              </span>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-black dark:text-[#F9F5EB] transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-3">
        <div className="bg-white/40 dark:bg-white/5 rounded-lg p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Share this item with your pause partners for mutual support and accountability.
          </p>
          {partners.map((partner) => (
            <div key={partner.partner_id} className="flex items-center space-x-3">
              <Checkbox
                id={`partner-${partner.partner_id}`}
                checked={selectedPartners.includes(partner.partner_id)}
                onCheckedChange={(checked) => 
                  handlePartnerToggle(partner.partner_id, checked as boolean)
                }
              />
              <label
                htmlFor={`partner-${partner.partner_id}`}
                className="text-sm font-medium text-black dark:text-[#F9F5EB] cursor-pointer"
              >
                {partner.partner_name}
              </label>
              <span className="text-xs text-muted-foreground">
                {partner.partner_email}
              </span>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default PartnerSharingSection;