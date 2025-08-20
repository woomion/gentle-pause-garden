
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NotificationScheduleSettings } from '@/services/notificationSchedulingService';

export const useUserSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [scheduleSettings, setScheduleSettings] = useState<NotificationScheduleSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserSettings();
    } else {
      // For non-authenticated users, fall back to localStorage
      const saved = localStorage.getItem('notificationsEnabled');
      setNotificationsEnabled(saved ? JSON.parse(saved) : false);
      setLoading(false);
    }
  }, [user]);

  const fetchUserSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select(`
          notifications_enabled,
          notification_schedule_type,
          notification_time_preference,
          notification_batch_window,
          quiet_hours_start,
          quiet_hours_end,
          notification_profile
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user settings:', error);
        // If no settings found, create default settings
        if (error.code === 'PGRST116') {
          await createDefaultSettings();
        }
      } else {
        setNotificationsEnabled(data.notifications_enabled);
        setScheduleSettings({
          notification_schedule_type: (data.notification_schedule_type as any) || 'immediate',
          notification_time_preference: data.notification_time_preference || '20:00',
          notification_batch_window: data.notification_batch_window || 30,
          quiet_hours_start: data.quiet_hours_start || '22:00',
          quiet_hours_end: data.quiet_hours_end || '08:00',
          notification_profile: (data.notification_profile as any) || 'default'
        });
      }
    } catch (error) {
      console.error('Error in fetchUserSettings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          notifications_enabled: false,
          notification_schedule_type: 'custom_time',
          notification_time_preference: '19:00:00', // 7pm default
          timezone: 'UTC', // Default timezone
          theme: 'light'
        });

      if (error) {
        console.error('Error creating default settings:', error);
      } else {
        setNotificationsEnabled(false);
        setScheduleSettings({
          notification_schedule_type: 'custom_time',
          notification_time_preference: '19:00',
          notification_batch_window: 30,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          notification_profile: 'default'
        });
      }
    } catch (error) {
      console.error('Error in createDefaultSettings:', error);
    }
  };

  const updateNotificationSetting = async (enabled: boolean) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .update({ 
            notifications_enabled: enabled,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating notification setting:', error);
          toast({
            title: "Error",
            description: "Failed to save notification preference. Please try again.",
            variant: "destructive"
          });
          return false;
        } else {
          setNotificationsEnabled(enabled);
          return true;
        }
      } catch (error) {
        console.error('Error in updateNotificationSetting:', error);
        return false;
      }
    } else {
      // For non-authenticated users, fall back to localStorage
      localStorage.setItem('notificationsEnabled', JSON.stringify(enabled));
      setNotificationsEnabled(enabled);
      return true;
    }
  };

  return {
    notificationsEnabled,
    scheduleSettings,
    updateNotificationSetting,
    loading
  };
};
