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
      
      if (inviteId) {
        if (user) {
          // User is logged in, process the invitation
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
          
          // Remove the invite parameter from URL after processing
          searchParams.delete('invite');
          setSearchParams(searchParams, { replace: true });
        } else {
          // User not logged in, store invitation for later processing
          localStorage.setItem('pendingInvitation', inviteId);
        }
      }
    };

    handleInvitation();
  }, [user, searchParams, acceptInvite, toast, setSearchParams]);

  // Process pending invitation when user logs in
  useEffect(() => {
    if (user) {
      const pendingInvitation = localStorage.getItem('pendingInvitation');
      if (pendingInvitation) {
        localStorage.removeItem('pendingInvitation');
        
        // Process the stored invitation
        acceptInvite(pendingInvitation).then((result) => {
          if (result?.success) {
            toast({
              title: 'Invitation accepted!',
              description: 'You are now connected as pause partners.',
            });
          }
        }).catch((error) => {
          console.error('Error processing pending invitation:', error);
          toast({
            title: 'Error processing invitation',
            description: 'Please try again or contact support.',
            variant: 'destructive',
          });
        });
      }
    }
  }, [user, acceptInvite, toast]);
};