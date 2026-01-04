
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, Eye, EyeOff } from 'lucide-react';
import { PasswordValidation } from '@/components/PasswordValidation';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');
  const { signIn, signUp, resetPassword, updatePassword, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'reset') {
      setMode('reset');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validatePassword = (pwd: string): boolean => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email && mode !== 'reset') {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    if ((mode === 'signin' || mode === 'signup') && !password) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'signup' && !validatePassword(password)) {
      toast({
        title: "Error",
        description: "Password doesn't meet requirements",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'reset' && !validatePassword(password)) {
      toast({
        title: "Error",
        description: "Password doesn't meet requirements",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message === 'Invalid login credentials' 
              ? "Invalid email or password" 
              : error.message,
            variant: "destructive"
          });
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Account created!",
            description: "Check your email to confirm your account, then sign in.",
          });
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a link to reset your password.",
          });
          setMode('signin');
        }
      } else if (mode === 'reset') {
        const { error } = await updatePassword(password);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Password updated!",
            description: "You can now sign in with your new password.",
          });
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

  const handleNotNow = () => {
    navigate('/');
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Create account';
      case 'forgot': return 'Reset password';
      case 'reset': return 'Set new password';
      default: return 'Welcome back';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup': return 'Create your Pocket Pause account';
      case 'forgot': return 'Enter your email to receive a reset link';
      case 'reset': return 'Choose a new password';
      default: return 'Sign in to your account';
    }
  };

  const getButtonText = () => {
    if (loading) return 'Please wait...';
    switch (mode) {
      case 'signup': return 'Create Account';
      case 'forgot': return 'Send Reset Link';
      case 'reset': return 'Update Password';
      default: return 'Sign In';
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#200E3B] flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black dark:text-[#F9F5EB] mb-2">
            POCKET || PAUSE
          </h1>
          <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB]">
            {getTitle()}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {getSubtitle()}
          </p>
        </div>

        <div className="bg-white/60 dark:bg-white/10 rounded-2xl p-8 border border-lavender/30 dark:border-gray-600 relative">
          <button 
            onClick={handleNotNow}
            className="absolute top-4 right-4 p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors"
          >
            <X size={20} />
          </button>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode !== 'reset' && (
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
            )}

            {(mode === 'signin' || mode === 'signup' || mode === 'reset') && (
              <div>
                <Label htmlFor="password" className="text-black dark:text-[#F9F5EB] font-medium">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB] pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {(mode === 'signup' || mode === 'reset') && (
                  <PasswordValidation password={password} />
                )}
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <Label htmlFor="confirmPassword" className="text-black dark:text-[#F9F5EB] font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]"
                  placeholder="Confirm your password"
                  required
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">Passwords don't match</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-transparent border-4 border-lavender hover:bg-lavender/10 text-black dark:text-[#F9F5EB] font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
              style={{ boxShadow: '0 4px 8px rgba(214, 187, 247, 0.3)' }}
            >
              {getButtonText()}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {mode === 'signin' && (
              <>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm underline block w-full"
                >
                  Forgot your password?
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setPassword(''); setConfirmPassword(''); }}
                  className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm block w-full"
                >
                  Don't have an account? <span className="underline">Sign up</span>
                </button>
              </>
            )}

            {mode === 'signup' && (
              <button
                type="button"
                onClick={() => { setMode('signin'); setPassword(''); setConfirmPassword(''); }}
                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm"
              >
                Already have an account? <span className="underline">Sign in</span>
              </button>
            )}

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm underline"
              >
                Back to sign in
              </button>
            )}

            {mode !== 'reset' && (
              <button
                type="button"
                onClick={handleNotNow}
                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm underline block w-full"
              >
                I don't want to create an account right now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
