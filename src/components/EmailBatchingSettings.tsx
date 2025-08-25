import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Mail } from 'lucide-react';

export function EmailBatchingSettings() {
  const { emailBatchingEnabled, updateEmailBatchingSetting, loading } = useUserSettings();

  const handleBatchingToggle = async (enabled: boolean) => {
    await updateEmailBatchingSetting(enabled);
  };

  if (loading) {
    return <div className="h-8 animate-pulse bg-muted rounded" />;
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Mail size={16} />
        Email Delivery
      </Label>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label htmlFor="email-batching">Batch emails daily</Label>
          <p className="text-sm text-muted-foreground">
            {emailBatchingEnabled ? (
              "Daily summary with all items ready for review"
            ) : (
              "Individual emails as items become ready"
            )}
          </p>
        </div>
        <Switch
          id="email-batching"
          checked={emailBatchingEnabled}
          onCheckedChange={handleBatchingToggle}
        />
      </div>
    </div>
  );
}