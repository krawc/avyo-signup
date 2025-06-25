
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CreditCard } from 'lucide-react';

interface PaymentOverlayProps {
  eventId: string;
  eventTitle: string;
  isPostEvent?: boolean;
  onPaymentSuccess?: () => void;
}

const PaymentOverlay = ({ eventId, eventTitle, isPostEvent = false, onPaymentSuccess }: PaymentOverlayProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          eventId,
          eventTitle,
          isPostEvent: false
        }
      });

      if (error) throw error;

      // Open Stripe checkout in current tab
      window.location.href = data.url;
    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
    }
  };

  const price = '$49.99';
  const description = 'Join this event and access all features including matches, connections, and live chat.';

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-white/95 backdrop-blur-md mt-50">
      <Card className="w-full max-w-md mx-4 gradient-card border-0 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Event Access Required
          </CardTitle>
          <CardDescription className="text-lg">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{price}</div>
            <div className="text-sm text-muted-foreground">
              One-time payment for full event access
            </div>
          </div>
          
          <Button 
            onClick={handlePayment} 
            disabled={loading}
            className="w-full h-12 text-lg"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {loading ? 'Processing...' : `Pay ${price}`}
          </Button>
          
          <div className="text-xs text-center text-muted-foreground">
            Secure payment powered by Stripe
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentOverlay;
