// Temporarily disabled - requires database tables that don't exist yet

export interface NotificationScheduleSettings {
  notification_schedule_type: 'immediate' | 'batched' | 'custom_time';
  notification_time_preference: string; // HH:MM format
  notification_batch_window: number; // minutes
  quiet_hours_start: string; // HH:MM format
  quiet_hours_end: string; // HH:MM format
  notification_profile: 'default' | 'parent_mode' | 'morning_person' | 'work_focus' | 'custom';
}

interface QueuedNotification {
  id: string;
  user_id: string;
  item_id: string;
  notification_type: string;
  title: string;
  body: string;
  scheduled_for: string;
  created_at: string;
}

export const notificationSchedulingService = {
  scheduleNotification: async (
    userId: string,
    itemId: string,
    scheduledFor: Date,
    notificationType: string = 'review_reminder',
    title?: string,
    body?: string
  ): Promise<void> => {
    console.log('Notification scheduling temporarily disabled');
  },
  
  cancelNotification: async (userId: string, itemId: string): Promise<void> => {
    console.log('Notification cancellation temporarily disabled');
  },
  
  getQueuedNotifications: async (userId?: string): Promise<QueuedNotification[]> => {
    return [];
  },
  
  processQueuedNotifications: async (): Promise<void> => {
    console.log('Queue processing temporarily disabled');
  },
  
  updateNotificationSchedule: async (
    userId: string,
    settings: NotificationScheduleSettings
  ): Promise<void> => {
    console.log('Schedule update temporarily disabled');
  },

  calculateNextNotification: (
    pausedAt: Date,
    checkInDate: Date,
    settings: NotificationScheduleSettings
  ): Date | null => {
    // Simple fallback calculation
    return checkInDate;
  },

  isWithinQuietHours: (
    currentTime: Date,
    quietStart: string,
    quietEnd: string,
    timezone: string = 'UTC'
  ): boolean => {
    return false; // Disabled
  }
};