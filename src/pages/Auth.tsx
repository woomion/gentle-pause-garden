
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { PasswordValidation } from '@/components/PasswordValidation';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasInvitation, setHasInvitation] = useState(false);
  const { signUp, signIn, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user came from an invitation link
  useEffect(() => {
    const inviteId = searchParams.get('invite') || localStorage.getItem('pendingInvitation');
    if (inviteId) {
      setHasInvitation(true);
      setIsSignUp(true); // Default to signup for invitations
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          navigate('/');
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

  const handleNotNow = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black dark:text-[#F9F5EB] mb-2">
            POCKET || PAUSE
          </h1>
          <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB]">
            {hasInvitation 
              ? 'Join as Pause Partner' 
              : isSignUp ? 'Create your account' : 'Welcome back'
            }
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {hasInvitation
              ? 'Create your account to accept the pause partner invitation'
              : isSignUp 
                ? 'Start pausing' 
                : 'Continue your pause practice'
            }
          </p>
        </div>

        <div className="bg-white/60 dark:bg-white/10 rounded-2xl p-8 border border-lavender/30 dark:border-gray-600 relative">
          <button 
            onClick={handleNotNow}
            className="absolute top-4 right-4 p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors"
          >
            <X size={20} />
          </button>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="mt-2 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]"
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
                className="mt-2 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-black dark:text-[#F9F5EB] font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]"
                placeholder="Enter your password"
                required
              />
              {isSignUp && <PasswordValidation password={password} />}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-[#F9F5EB] font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
              style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
            >
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/60 dark:bg-white/10 text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full mt-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
          </div>


          <div className="mt-6 text-center space-y-3">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
            
            <div>
              <button
                type="button"
                onClick={handleNotNow}
                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm underline"
              >
                I don't want to create an account right now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
