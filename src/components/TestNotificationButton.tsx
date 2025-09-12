import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const TestNotificationButton = ({ size = 'sm', className }: { size?: 'sm' | 'default' | 'lg'; className?: string }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const sendTestPush = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to test push notifications",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🧪 Sending test push notification...');
      
      const { data, error } = await supabase.functions.invoke('send-push-notifications', {
        body: {
          userIds: [user.id],
          title: 'Pocket Pause • Test Push',
          body: 'If you see this, closed-app push works.',
          data: { test: true }
        }
      });

      if (error) {
        console.error('Test push error:', error);
        toast({
          title: "Test failed",
          description: `Error: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log('✅ Test push sent:', data);
        toast({
          title: "Test notification sent",
          description: "Check your device for the push notification. Close the app tab to test properly.",
        });
      }
    } catch (error) {
      console.error('Test push error:', error);
      toast({
        title: "Test failed",
        description: "Failed to send test notification",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      onClick={sendTestPush}
      variant="outline"
      size={size}
      className={className ?? "w-full"}
    >
      🧪 Send Test Push
    </Button>
  );
};