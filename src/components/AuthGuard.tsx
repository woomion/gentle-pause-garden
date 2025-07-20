
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if still loading or if user is authenticated
    if (loading || user) return;
    
    // Only redirect to auth if user explicitly tries to access protected features
    // For now, let unauthenticated users access the main pages
  }, [user, loading, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-[#200E3B] flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
