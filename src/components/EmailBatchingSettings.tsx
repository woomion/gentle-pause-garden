import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Clock, Mail } from 'lucide-react';

export function EmailBatchingSettings() {
  const { emailBatchingEnabled, updateEmailBatchingSetting, loading } = useUserSettings();

  const handleBatchingToggle = async (enabled: boolean) => {
    await updateEmailBatchingSetting(enabled);
  };

  if (loading) {
    return <div className="h-32 animate-pulse bg-muted rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email Delivery
        </CardTitle>
        <CardDescription>
          Choose how you want to receive review reminder emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="email-batching">Batch emails daily</Label>
            <p className="text-sm text-muted-foreground">
              Get one daily email with all items ready for review
            </p>
          </div>
          <Switch
            id="email-batching"
            checked={emailBatchingEnabled}
            onCheckedChange={handleBatchingToggle}
          />
        </div>
        
        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3 h-3" />
            {emailBatchingEnabled ? (
              <span>You'll receive one daily summary email with all items ready for review</span>
            ) : (
              <span>You'll receive individual emails as items become ready for review</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}