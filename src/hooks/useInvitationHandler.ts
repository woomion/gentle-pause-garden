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
        console.log('🔗 Invitation URL detected:', inviteId);
        console.log('👤 User state:', user ? `Logged in as ${user.email}` : 'Not logged in');
        
        if (user) {
          console.log('👤 User is logged in:', user.email);
          
          // Check if this invitation is actually for this user
          try {
            console.log('🔍 Checking if invitation is for current user...');
            console.log('🔍 About to call acceptInvite with ID:', inviteId);
            const result = await acceptInvite(inviteId);
            console.log('🔍 AcceptInvite result:', result);
            
            if (result?.success) {
              console.log('✅ Invitation accepted successfully!');
              toast({
                title: 'Invitation accepted!',
                description: result.message || 'You are now connected as pause partners.',
              });
            } else {
              console.error('❌ Failed to accept invitation:', result?.error);
              
              // If invitation was not found or already processed, just clear the URL silently
              if (result?.error?.includes('not found') || 
                  result?.error?.includes('already processed') ||
                  result?.error?.includes('not for your email')) {
                console.log('🧹 Invitation no longer valid, clearing URL parameter');
              } else {
                // Only show error toast for other types of errors
                toast({
                  title: 'Failed to accept invitation',
                  description: result?.error || 'Please try again or contact support.',
                  variant: 'destructive',
                });
              }
            }
          } catch (error) {
            console.error('💥 Error processing invitation:', error);
            toast({
              title: 'Error processing invitation',
              description: 'Please try again or contact support.',
              variant: 'destructive',
            });
          }
          
          // Always remove the invite parameter from URL after processing
          console.log('🧹 Clearing invitation from URL');
          searchParams.delete('invite');
          setSearchParams(searchParams, { replace: true });
        } else {
          console.log('👤 User not logged in, storing invitation for later processing');
          // User not logged in, store invitation for later processing
          localStorage.setItem('pendingInvitation', inviteId);
        }
      }
    };

    handleInvitation();
  }, [user, searchParams, acceptInvite, toast, setSearchParams]);

  // Process pending invitation when user logs in
  useEffect(() => {
    console.log('🔄 Pending invitation check - User:', user ? `${user.email}` : 'None');
    if (user) {
      const pendingInvitation = localStorage.getItem('pendingInvitation');
      console.log('📦 Pending invitation in storage:', pendingInvitation);
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