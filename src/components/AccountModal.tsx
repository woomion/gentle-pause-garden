import React, { useState } from 'react';
import { X, Mail, Lock, Trash2, Crown, ExternalLink, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { subscription, loading: subscriptionLoading, reload: reloadSubscription } = useSubscription();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  if (!isOpen || !user) return null;

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    setIsChangingPassword(true);
    // TODO: Implement password change logic
    console.log('Password change requested');
    setIsChangingPassword(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion logic
    console.log('Account deletion requested');
  };

  const handleUpgrade = async (planType: 'monthly' | 'quarterly' | 'yearly') => {
    if (!user) return;
    
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to checkout",
          description: "Opening Stripe checkout in a new tab...",
        });
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Checkout Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setIsManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Opening billing portal",
          description: "Redirecting to Stripe customer portal...",
        });
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Portal Error", 
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsManagingSubscription(false);
    }
  };

  const isPremiumUser = subscription?.tier === 'premium' || subscription?.tier === 'pause_partner';
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-start justify-center px-6 pt-16">
      <div className="bg-card rounded-2xl max-w-sm w-full p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Account Settings
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Subscription Plan */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Crown size={16} />
              Current Plan
            </Label>
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {isPremiumUser ? 'Pause Plus' : 'Free Plan'}
                </span>
                {isPremiumUser && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Premium
                  </span>
                )}
              </div>
              
              {isPremiumUser && subscription?.expires_at && (
                <p className="text-sm text-muted-foreground">
                  Next billing: {formatDate(subscription.expires_at)}
                </p>
              )}
              
              <div className="text-sm text-muted-foreground">
                {isPremiumUser ? (
                  <ul className="space-y-1">
                    <li>• Unlimited pauses</li>
                    <li>• Partner sharing</li>
                    <li>• Priority support</li>
                  </ul>
                ) : (
                  <ul className="space-y-1">
                    <li>• Unlimited pauses</li>
                    <li>• Basic features</li>
                  </ul>
                )}
              </div>
              
              {isPremiumUser ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={isManagingSubscription}
                  className="w-full"
                >
                  <ExternalLink size={14} className="mr-2" />
                  {isManagingSubscription ? 'Opening...' : 'Manage Subscription'}
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Upgrade to Pause Plus</p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpgrade('monthly')}
                      disabled={isUpgrading}
                      className="justify-between"
                    >
                      <span>Monthly</span>
                      <span>$2.99</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpgrade('quarterly')}
                      disabled={isUpgrading}
                      className="justify-between"
                    >
                      <span>Quarterly</span>
                      <span>$6.00</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpgrade('yearly')}
                      disabled={isUpgrading}
                      className="justify-between"
                    >
                      <span>Yearly</span>
                      <span>$20.00</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Display */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail size={16} />
              Email Address
            </Label>
            <Input
              value={user.email || ''}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Change Password */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Lock size={16} />
              Password
            </Label>
            {!showPasswordChange ? (
              <Button
                variant="outline"
                onClick={() => setShowPasswordChange(true)}
                className="w-full"
              >
                Change Password
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordChange(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={!newPassword || !confirmPassword || isChangingPassword}
                    className="flex-1"
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Delete Account */}
          <div className="pt-4 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 size={16} className="mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-500 hover:bg-red-600">
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;