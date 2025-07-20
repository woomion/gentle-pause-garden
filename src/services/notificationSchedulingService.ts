import { supabase } from '@/integrations/supabase/client';

export interface NotificationScheduleSettings {
  notification_schedule_type: 'immediate' | 'batched' | 'custom_time';
  notification_time_preference: string; // HH:MM format
  notification_batch_window: number; // minutes
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string; // HH:MM format
  notification_profile: 'default' | 'parent_mode' | 'morning_person' | 'work_focus' | 'custom';
}

export interface QueuedNotification {
  id?: string;
  user_id: string;
  item_id: string;
  notification_type: string;
  title: string;
  body: string;
  data?: any;
  scheduled_for: string;
  status?: 'pending' | 'sent' | 'cancelled';
}

export class NotificationSchedulingService {
  private static instance: NotificationSchedulingService;

  private constructor() {}

  static getInstance(): NotificationSchedulingService {
    if (!NotificationSchedulingService.instance) {
      NotificationSchedulingService.instance = new NotificationSchedulingService();
    }
    return NotificationSchedulingService.instance;
  }

  async getUserScheduleSettings(userId: string): Promise<NotificationScheduleSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select(`
          notification_schedule_type,
          notification_time_preference,
          notification_batch_window,
          quiet_hours_start,
          quiet_hours_end,
          notification_profile
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching notification schedule settings:', error);
        return null;
      }

      return data as NotificationScheduleSettings;
    } catch (error) {
      console.error('Error in getUserScheduleSettings:', error);
      return null;
    }
  }

  async updateScheduleSettings(userId: string, settings: Partial<NotificationScheduleSettings>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating notification schedule settings:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateScheduleSettings:', error);
      return false;
    }
  }

  calculateScheduledTime(settings: NotificationScheduleSettings, itemReadyTime: Date): Date {
    const now = new Date();
    const readyTime = new Date(itemReadyTime);

    // If item isn't ready yet, schedule for when it becomes ready
    if (readyTime > now) {
      return this.applySchedulingRules(settings, readyTime);
    }

    // Item is ready now, apply scheduling rules to current time
    return this.applySchedulingRules(settings, now);
  }

  private applySchedulingRules(settings: NotificationScheduleSettings, baseTime: Date): Date {
    switch (settings.notification_schedule_type) {
      case 'immediate':
        return this.respectQuietHours(settings, baseTime);
      
      case 'batched':
        return this.calculateBatchTime(settings, baseTime);
      
      case 'custom_time':
        return this.calculateCustomTime(settings, baseTime);
      
      default:
        return baseTime;
    }
  }

  private respectQuietHours(settings: NotificationScheduleSettings, time: Date): Date {
    const timeStr = this.formatTimeString(time);
    const quietStart = settings.quiet_hours_start;
    const quietEnd = settings.quiet_hours_end;

    if (this.isInQuietHours(timeStr, quietStart, quietEnd)) {
      // Schedule for end of quiet hours
      const scheduledTime = new Date(time);
      const [endHour, endMinute] = quietEnd.split(':').map(Number);
      
      scheduledTime.setHours(endHour, endMinute, 0, 0);
      
      // If quiet hours end time is tomorrow (e.g., quiet hours from 22:00 to 08:00)
      if (quietStart > quietEnd) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      return scheduledTime;
    }

    return time;
  }

  private calculateBatchTime(settings: NotificationScheduleSettings, time: Date): Date {
    const batchWindow = settings.notification_batch_window || 30; // minutes
    const scheduledTime = new Date(time);
    
    // Round up to next batch window
    const minutes = scheduledTime.getMinutes();
    const roundedMinutes = Math.ceil(minutes / batchWindow) * batchWindow;
    scheduledTime.setMinutes(roundedMinutes, 0, 0);
    
    // If we rounded to next hour
    if (roundedMinutes >= 60) {
      scheduledTime.setHours(scheduledTime.getHours() + 1);
      scheduledTime.setMinutes(roundedMinutes - 60);
    }

    return this.respectQuietHours(settings, scheduledTime);
  }

  private calculateCustomTime(settings: NotificationScheduleSettings, time: Date): Date {
    const [preferredHour, preferredMinute] = settings.notification_time_preference.split(':').map(Number);
    const scheduledTime = new Date(time);
    
    scheduledTime.setHours(preferredHour, preferredMinute, 0, 0);
    
    // If preferred time has passed today, schedule for tomorrow
    if (scheduledTime <= time) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    return scheduledTime;
  }

  private isInQuietHours(currentTime: string, quietStart: string, quietEnd: string): boolean {
    if (quietStart === quietEnd) return false;

    // Handle quiet hours that span midnight (e.g., 22:00 to 08:00)
    if (quietStart > quietEnd) {
      return currentTime >= quietStart || currentTime <= quietEnd;
    }
    
    // Normal quiet hours within same day
    return currentTime >= quietStart && currentTime <= quietEnd;
  }

  private formatTimeString(date: Date): string {
    return date.toTimeString().slice(0, 5); // HH:MM format
  }

  async queueNotification(notification: QueuedNotification): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_queue')
        .insert(notification);

      if (error) {
        console.error('Error queuing notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in queueNotification:', error);
      return false;
    }
  }

  async getPendingNotifications(userId: string): Promise<QueuedNotification[]> {
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching pending notifications:', error);
        return [];
      }

      return (data || []) as QueuedNotification[];
    } catch (error) {
      console.error('Error in getPendingNotifications:', error);
      return [];
    }
  }

  async markNotificationAsSent(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notification_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as sent:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markNotificationAsSent:', error);
      return false;
    }
  }

  async createBatchedNotification(notifications: QueuedNotification[]): Promise<{
    title: string;
    body: string;
    data: Record<string, any>;
  }> {
    const itemCount = notifications.length;
    
    if (itemCount === 1) {
      return {
        title: 'Time to review your paused item!',
        body: notifications[0].body,
        data: { ...notifications[0].data, batch_size: 1 }
      };
    }

    const title = `Time to review ${itemCount} paused items!`;
    const body = `You have ${itemCount} items ready for thoughtful decisions.`;
    
    return {
      title,
      body,
      data: {
        action: 'review_items',
        batch_size: itemCount,
        item_ids: notifications.map(n => n.item_id)
      }
    };
  }

  getPresetProfiles(): Record<string, Partial<NotificationScheduleSettings>> {
    return {
      default: {
        notification_schedule_type: 'immediate',
        notification_time_preference: '20:00',
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        notification_batch_window: 30
      },
      parent_mode: {
        notification_schedule_type: 'custom_time',
        notification_time_preference: '20:00', // After kids bedtime
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        notification_batch_window: 60
      },
      morning_person: {
        notification_schedule_type: 'custom_time',
        notification_time_preference: '09:00', // After coffee time
        quiet_hours_start: '22:00',
        quiet_hours_end: '07:00',
        notification_batch_window: 30
      },
      work_focus: {
        notification_schedule_type: 'batched',
        notification_time_preference: '18:00', // End of work day
        quiet_hours_start: '09:00',
        quiet_hours_end: '17:00', // During work hours
        notification_batch_window: 120 // 2 hour batches
      }
    };
  }
}

export const notificationSchedulingService = NotificationSchedulingService.getInstance();