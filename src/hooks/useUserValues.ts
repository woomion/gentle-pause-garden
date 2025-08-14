import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface UserValues {
  values_selected: string[];
  values_setup_completed: boolean;
}

export const useUserValues = () => {
  const [userValues, setUserValues] = useState<UserValues>({
    values_selected: [],
    values_setup_completed: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchUserValues = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('values_selected, values_setup_completed')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching user values:', error);
        return;
      }

      if (data) {
        setUserValues({
          values_selected: data.values_selected || [],
          values_setup_completed: data.values_setup_completed || false
        });
      }
    } catch (error) {
      console.error('Error fetching user values:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserValues();
  }, [user]);

  return {
    userValues,
    isLoading,
    refetch: fetchUserValues
  };
};