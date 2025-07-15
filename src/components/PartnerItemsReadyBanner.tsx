import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PausedItem } from '@/stores/supabasePausedItemsStore';
import { calculateCheckInTimeDisplay } from '@/utils/pausedItemsUtils';
import { extractProductLinkFromNotes, extractActualNotes } from '@/utils/notesMetadataUtils';

interface Partner {
  partner_id: string;
  partner_name: string;
  partner_email: string;
}

interface PartnerItemsReadyBannerProps {
  partners: Partner[];
  currentUserId: string | null;
  onItemsReady: (partnerName: string, items: PausedItem[]) => void;
}

const PartnerItemsReadyBanner = ({ partners, currentUserId, onItemsReady }: PartnerItemsReadyBannerProps) => {
  const [partnerReadyItems, setPartnerReadyItems] = useState<{ [partnerId: string]: PausedItem[] }>({});

  useEffect(() => {
    const fetchPartnerReadyItems = async () => {
      if (!partners.length || !currentUserId) {
        setPartnerReadyItems({});
        return;
      }

      try {
        const partnerIds = partners.map(p => p.partner_id).filter(Boolean);
        
        if (partnerIds.length === 0) {
          setPartnerReadyItems({});
          return;
        }

        // Get items from partners that are ready for review and shared with current user
        const { data, error } = await supabase
          .from('paused_items')
          .select('*')
          .in('user_id', partnerIds)
          .contains('shared_with_partners', [currentUserId])
          .eq('status', 'paused')
          .lte('review_at', new Date().toISOString());

        if (error) {
          console.error('Error fetching partner ready items:', error);
          return;
        }

        // Convert and group by partner
        const convertDbItemToPausedItem = (item: any): PausedItem | null => {
          try {
            const notesProductLink = extractProductLinkFromNotes(item.notes);
            const productLink = notesProductLink || (item.url && !item.url.includes('cart-placeholder') ? item.url : '');
            const cleanNotes = extractActualNotes(item.notes);
            
            return {
              id: item.id,
              itemName: item.title || 'Untitled Item',
              storeName: item.store_name || 'Unknown Store',
              price: item.price?.toString() || '0',
              imageUrl: item.image_url || '',
              emotion: item.emotion || item.reason || 'unknown',
              notes: cleanNotes || '',
              duration: `${item.pause_duration_days || 7} days`,
              otherDuration: item.other_duration || '',
              link: productLink,
              photo: null,
              photoDataUrl: '',
              tags: Array.isArray(item.tags) ? item.tags : [],
              pausedAt: new Date(item.created_at),
              checkInTime: calculateCheckInTimeDisplay(new Date(item.review_at)),
              checkInDate: new Date(item.review_at),
              isCart: item.is_cart || false,
              itemType: item.item_type || 'item',
              sharedWithPartners: Array.isArray(item.shared_with_partners) ? item.shared_with_partners : [],
              originalUserId: item.user_id
            };
          } catch (error) {
            console.error('Error converting database item:', error);
            return null;
          }
        };

        const groupedItems: { [partnerId: string]: PausedItem[] } = {};
        
        (data || []).forEach(item => {
          const convertedItem = convertDbItemToPausedItem(item);
          if (convertedItem) {
            const partnerId = item.user_id;
            if (!groupedItems[partnerId]) {
              groupedItems[partnerId] = [];
            }
            groupedItems[partnerId].push(convertedItem);
          }
        });

        setPartnerReadyItems(groupedItems);
      } catch (error) {
        console.error('Error in fetchPartnerReadyItems:', error);
        setPartnerReadyItems({});
      }
    };

    fetchPartnerReadyItems();

    // Set up real-time subscription
    if (partners.length > 0 && currentUserId) {
      const channel = supabase
        .channel(`partner-ready-items-${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'paused_items',
          },
          () => {
            fetchPartnerReadyItems();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [partners, currentUserId]);

  // Find partners with ready items
  const partnersWithReadyItems = partners.filter(partner => 
    partnerReadyItems[partner.partner_id]?.length > 0
  );

  if (partnersWithReadyItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {partnersWithReadyItems.map(partner => {
        const readyItems = partnerReadyItems[partner.partner_id] || [];
        const itemCount = readyItems.length;
        
        return (
          <div key={partner.partner_id}>
            <button 
              onClick={() => onItemsReady(partner.partner_name, readyItems)}
              className="w-full rounded-lg px-4 py-3 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              style={{ backgroundColor: '#E7D9FA' }}
            >
              <div className="flex items-center gap-3 text-left">
                <MessageCircle size={18} style={{ color: '#5C47A3' }} />
                <span className="text-sm font-medium" style={{ color: '#5C47A3' }}>
                  {partner.partner_name} has {itemCount} item{itemCount === 1 ? '' : 's'} ready for review
                </span>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default PartnerItemsReadyBanner;