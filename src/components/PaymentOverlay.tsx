
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CreditCard, X } from 'lucide-react';

interface PaymentOverlayProps {
  eventId: string;
  eventTitle: string;
  isPostEvent?: boolean;
  onPaymentSuccess?: () => void;
  onClose?: () => void;
}

const PaymentOverlay = ({ eventId, eventTitle, isPostEvent = false, onPaymentSuccess, onClose }: PaymentOverlayProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'agreement' | 'payment'>('agreement');
  const [eventPrice, setEventPrice] = useState<number>(2600); // Default $26.00

  useEffect(() => {
    const fetchEventPrice = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('price_cents')
          .eq('id', eventId)
          .single();

        if (error) throw error;
        setEventPrice(data.price_cents || 2600);
      } catch (error) {
        console.error('Error fetching event price:', error);
        setEventPrice(2600); // Default to $26.00
      }
    };

    fetchEventPrice();
  }, [eventId]);

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

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const description = 'Join this event and access all features including matches, connections, and live chat.';

  if (stage === 'agreement') {
    return (
      <div className="fixed inset-0 z-10 flex items-center justify-center bg-white/95 backdrop-blur-md mt-50">
        <Card className="w-full max-w-md mx-4 gradient-card border-0 shadow-2xl">
          <CardHeader className="text-center relative">
            {onClose && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              Payment Required
            </CardTitle>
            <CardDescription className="text-lg">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">            
            <div className="text-center space-y-4">
              <p className="text-base">
                Do you agree to proceed with the payment for access to "{eventTitle}"?
              </p>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => setStage('payment')} 
                  className="flex-1 h-12 text-lg"
                >
                  Yes, Continue
                </Button>
                <Button 
                  onClick={onClose} 
                  variant="outline" 
                  className="flex-1 h-12 text-lg"
                >
                  No, Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-white/95 backdrop-blur-md mt-50">
      <Card className="w-full max-w-md mx-4 gradient-card border-0 shadow-2xl">
        <CardHeader className="text-center relative">
          <button
            onClick={() => setStage('agreement')}
            className="absolute left-4 top-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 rotate-45" />
          </button>
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Complete Payment
          </CardTitle>
          <CardDescription className="text-lg">
            Review and complete your payment for "{eventTitle}"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{formatPrice(eventPrice)}</div>
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
            {loading ? 'Processing...' : `Pay ${formatPrice(eventPrice)}`}
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
