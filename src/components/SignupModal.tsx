
import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useScrollLock } from '@/hooks/useScrollLock';
import { PasswordValidation } from '@/components/PasswordValidation';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalMode = 'signin' | 'signup';

const SignupModal = ({ isOpen, onClose }: SignupModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ModalMode>('signup');
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  
  useScrollLock(isOpen);

  const validatePassword = (pwd: string): boolean => {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    if (!password) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive"
      });
      return;
    }

    if (mode === 'signup') {
      if (!validatePassword(password)) {
        toast({
          title: "Error",
          description: "Password doesn't meet requirements",
          variant: "destructive"
        });
        return;
      }

      if (password !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords don't match",
          variant: "destructive"
        });
        return;
      }
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
        } else {
          onClose();
        }
      } else {
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

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMode('signup');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center px-6">
      <div className="bg-cream dark:bg-[#200E3B] rounded-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-black dark:text-[#F9F5EB] hover:text-taupe transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB] mb-2">
            {mode === 'signin' ? 'Welcome back' : 'Want to keep this pause?'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {mode === 'signin' 
              ? 'Sign in to access your items' 
              : 'Create an account to save your items and reflections.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="modal-email" className="text-black dark:text-[#F9F5EB] font-medium">
              Email
            </Label>
            <Input
              id="modal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <Label htmlFor="modal-password" className="text-black dark:text-[#F9F5EB] font-medium">
              Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="modal-password"
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
            {mode === 'signup' && <PasswordValidation password={password} />}
          </div>

          {mode === 'signup' && (
            <div>
              <Label htmlFor="modal-confirm-password" className="text-black dark:text-[#F9F5EB] font-medium">
                Confirm Password
              </Label>
              <Input
                id="modal-confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20 text-black dark:text-[#F9F5EB]"
                placeholder="Confirm your password"
                required
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-xs mt-1">Passwords don't match</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleClose}
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
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm"
          >
            {mode === 'signin' 
              ? <>Don't have an account? <span className="underline">Sign up</span></> 
              : <>Already have an account? <span className="underline">Sign in</span></>}
          </button>
        </div>

        {mode === 'signin' && (
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => {
                handleClose();
                window.location.href = '/auth?mode=forgot';
              }}
              className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm underline"
            >
              Forgot your password?
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupModal;
