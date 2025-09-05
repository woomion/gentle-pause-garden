
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
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const { signUp, signIn, signInWithMagicLink } = useAuth();
  const { toast } = useToast();
  
  // Lock background scroll when modal is open
  useScrollLock(isOpen);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isMagicLink) {
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
            title: "Magic link failed",
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
      return;
    }
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, firstName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Try signing in instead.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link to complete your registration.",
          });
          onClose();
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password and try again.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Sign in failed",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          onClose();
        }
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
            {isMagicLink ? 'Sign in with magic link' : 'Want to keep this pause?'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
            {isMagicLink
              ? "Enter your email and we'll send you a secure login link"
              : isSignUp 
                ? "Create an account to save your items and reflections." 
                : "Sign in to your account to save your items and reflections."
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <Label htmlFor="firstName" className="text-black dark:text-[#F9F5EB] font-medium">
                First Name
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]"
                placeholder="Enter your first name"
              />
            </div>
          )}

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

          {!isMagicLink && (
            <div>
              <Label htmlFor="password" className="text-black dark:text-[#F9F5EB] font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]"
                placeholder="Enter your password"
                required
              />
            </div>
          )}

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
              {loading ? 'Loading...' : (
                isMagicLink ? 'Send Magic Link' :
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>
          </div>
        </form>

        {!isMagicLink && (
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
              onClick={() => setIsMagicLink(true)}
              disabled={loading}
              className="w-full mt-3 bg-transparent border-2 border-taupe hover:bg-taupe/10 text-black dark:text-[#F9F5EB] font-medium py-2 px-4 rounded-xl transition-all duration-200"
            >
              Sign in with magic link
            </Button>
          </div>
        )}

        <div className="mt-4 text-center space-y-2">
          <button
            type="button"
            onClick={() => {
              if (isMagicLink) {
                setIsMagicLink(false);
              } else {
                setIsSignUp(!isSignUp);
              }
            }}
            className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm"
          >
            {isMagicLink
              ? 'Back to sign in'
              : isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
            }
          </button>
          
          {!isSignUp && !isMagicLink && (
            <div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  // Navigate to the full auth page with forgot password
                  window.location.href = '/auth';
                }}
                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm underline"
              >
                Forgot your password?
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
