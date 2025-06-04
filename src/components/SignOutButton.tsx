
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SignOutButton = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-[#F9F5EB] transition-colors text-sm"
    >
      <LogOut size={16} />
      Sign Out
    </button>
  );
};

export default SignOutButton;
