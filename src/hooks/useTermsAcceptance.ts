
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useTermsAcceptance = (termsType: 'messaging' | 'location_sharing') => {
  const { user } = useAuth();
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTermsAcceptance = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('terms_acceptance')
          .select('accepted')
          .eq('user_id', user.id)
          .eq('terms_type', termsType)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          throw error;
        }

        setHasAccepted(data?.accepted || false);
      } catch (error) {
        console.error('Error checking terms acceptance:', error);
        setHasAccepted(false);
      } finally {
        setLoading(false);
      }
    };

    checkTermsAcceptance();
  }, [user, termsType]);

  const markAsAccepted = () => {
    setHasAccepted(true);
  };

  return { hasAccepted, loading, markAsAccepted };
};
