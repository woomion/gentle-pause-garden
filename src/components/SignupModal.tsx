
import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useScrollLock } from '@/hooks/useScrollLock';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignupModal = ({ isOpen, onClose }: SignupModalProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithMagicLink, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  
  // Lock background scroll when modal is open
  useScrollLock(isOpen);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signInWithMagicLink(email);
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a magic link to sign in. Click the link in your email to continue.",
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google sign in failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong with Google sign in. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center px-6">
      <div className="bg-cream dark:bg-[#200E3B] rounded-2xl max-w-md w-full p-8 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB] mb-4">
            Want to keep this pause?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
            Enter your email to receive a secure login link and save your items and reflections.
          </p>
        </div>

        <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-black dark:text-[#F9F5EB] font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20 rounded-xl py-3"
            >
              Not now
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-[#F9F5EB] font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
              style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </div>
        </form>

        <div className="mt-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-cream dark:bg-[#200E3B] text-gray-500">Or</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full mt-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </Button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              // Navigate to the full auth page
              window.location.href = '/auth';
            }}
            className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm underline"
          >
            More sign in options
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
