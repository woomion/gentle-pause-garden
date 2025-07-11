import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePausePartners } from './usePausePartners';
import { useToast } from './use-toast';

export const useInvitationHandler = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { acceptInvite } = usePausePartners();
  const { toast } = useToast();

  useEffect(() => {
    const handleInvitation = async () => {
      const inviteId = searchParams.get('invite');
      
      if (inviteId && user) {
        try {
          console.log('Processing invitation:', inviteId);
          const result = await acceptInvite(inviteId);
          
          if (result?.success) {
            toast({
              title: 'Invitation accepted!',
              description: 'You are now connected as pause partners.',
            });
          } else {
            toast({
              title: 'Invitation already processed',
              description: 'This invitation may have already been accepted or expired.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Error processing invitation:', error);
          toast({
            title: 'Error processing invitation',
            description: 'Please try again or contact support.',
            variant: 'destructive',
          });
        }
        
        // Remove the invite parameter from URL
        searchParams.delete('invite');
        setSearchParams(searchParams, { replace: true });
      }
    };

    // Only process invitations when user is authenticated
    if (user) {
      handleInvitation();
    }
  }, [user, searchParams, acceptInvite, toast, setSearchParams]);
};