import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const useIndexRedirects = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect to auth page if user has invitation but isn't logged in
  useEffect(() => {
    const inviteId = searchParams.get('invite');
    const pendingInvitation = localStorage.getItem('pendingInvitation');
    
    if ((inviteId || pendingInvitation) && !user && !authLoading) {
      navigate('/auth');
    }
  }, [searchParams, user, authLoading, navigate]);

  // Default pill mode for guest preview if not explicitly set
  useEffect(() => {
    const isGuest = searchParams.get('guest') === '1';
    const hasPill = searchParams.get('pill');
    if (isGuest && !hasPill) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('pill', '1');
      navigate(`/?${params.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);
};