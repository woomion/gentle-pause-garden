
import { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface EmailSignupModalProps {
  onClose: () => void;
}

const EmailSignupModal = ({ onClose }: EmailSignupModalProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Thanks for signing up!",
        description: "We'll notify you when In-Store Mode is available.",
      });
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md mx-4 bg-cream dark:bg-[#200E3B] rounded-xl p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-[#F9F5EB] transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#CAB6F7] rounded-full mb-4">
            <Mail size={24} className="text-black" />
          </div>
          <h2 className="text-xl font-bold text-black dark:text-[#F9F5EB] mb-2">
            Get notified about In-Store Mode
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            We'll let you know when this feature launches
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/70 dark:bg-white/10 border-gray-200/60 dark:border-gray-600"
              required
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#CAB6F7] hover:bg-[#B8A6D2] text-black"
            >
              {isSubmitting ? 'Signing up...' : 'Sign up'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailSignupModal;
