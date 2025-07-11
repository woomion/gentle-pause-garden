import { Users, Link } from 'lucide-react';
import { usePausePartners } from '@/hooks/usePausePartners';
import { useSubscription } from '@/hooks/useSubscription';

const PartnerStatusIndicator = () => {
  const { partners, loading } = usePausePartners();
  const { hasPausePartnerAccess } = useSubscription();

  if (!hasPausePartnerAccess || loading) {
    return null;
  }

  if (partners.length === 0) {
    return null;
  }

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
        <Link className="h-4 w-4" />
        <span className="text-sm font-medium">
          Connected with {partners.length} pause partner{partners.length > 1 ? 's' : ''}
        </span>
        <div className="flex -space-x-1 ml-auto">
          {partners.slice(0, 3).map((partner, index) => (
            <div
              key={partner.partner_id}
              className="w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-white font-bold"
              title={partner.partner_name}
            >
              {partner.partner_name.charAt(0).toUpperCase()}
            </div>
          ))}
          {partners.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-green-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs text-white font-bold">
              +{partners.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerStatusIndicator;