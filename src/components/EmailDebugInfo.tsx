import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Mail, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';

export function EmailDebugInfo() {
  const { user } = useAuth();
  const { notificationsEnabled, emailBatchingEnabled, loading } = useUserSettings();

  if (loading) return null;

  const getEmailStatus = () => {
    if (!user) {
      return {
        status: 'guest',
        title: 'Emails require login',
        description: 'You need to be logged in to receive email notifications when items become ready for review.',
        icon: AlertTriangle,
        variant: 'destructive' as const
      };
    }

    if (!notificationsEnabled) {
      return {
        status: 'disabled',
        title: 'Notifications disabled',
        description: 'Email notifications are currently disabled. Enable them in your account preferences to receive emails.',
        icon: Info,
        variant: 'default' as const
      };
    }

    if (emailBatchingEnabled) {
      return {
        status: 'batch',
        title: 'Batch emails enabled',
        description: 'You will receive one daily email with all items ready for review, instead of individual emails per item.',
        icon: Mail,
        variant: 'default' as const
      };
    }

    return {
      status: 'individual',
      title: 'Individual emails enabled',
      description: 'You will receive an email each time an item becomes ready for review.',
      icon: Mail,
      variant: 'default' as const
    };
  };

  const emailStatus = getEmailStatus();
  const IconComponent = emailStatus.icon;

  // Only show for guest users or when there are issues
  if (emailStatus.status === 'individual') {
    return null;
  }

  return (
    <Alert variant={emailStatus.variant} className="mb-4">
      <IconComponent className="h-4 w-4" />
      <AlertTitle>{emailStatus.title}</AlertTitle>
      <AlertDescription>{emailStatus.description}</AlertDescription>
    </Alert>
  );
}