import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Purchases } from '@revenuecat/purchases-capacitor';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CreditCard, X, ArrowLeft } from 'lucide-react';

interface PaymentOverlayProps {
  eventId: string;
  eventTitle: string;
  isPostEvent?: boolean;
  onPaymentSuccess?: () => void;
  onClose?: () => void;
}

const PaymentOverlay = ({ eventTitle, onPaymentSuccess, onClose }: PaymentOverlayProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'agreement' | 'payment'>('agreement');
  const [packageToBuy, setPackageToBuy] = useState<any>(null);
  const [priceFormatted, setPriceFormatted] = useState('$—');

  // RevenueCat init and fetch product
  useEffect(() => {
    const initRevenueCat = async () => {
      const API_KEY = Capacitor.getPlatform() === 'ios'
        ? 'your_ios_revenuecat_key'
        : 'your_android_revenuecat_key';

      await Purchases.configure({ apiKey: API_KEY });

      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages[0];

      if (pkg) {
        setPackageToBuy(pkg);
        setPriceFormatted(pkg.product.priceString); // e.g., "$3.99"
      }
    };

    initRevenueCat();
  }, []);

  const handlePayment = async () => {
    if (!user || !packageToBuy) return;

    setLoading(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage({ package: packageToBuy });

      const entitlementActive = customerInfo.entitlements.active['event_access']; // adjust this to your entitlement ID
      if (entitlementActive && onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
      }
    } finally {
      setLoading(false);
    }
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
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Payment Required</CardTitle>
            <CardDescription className="text-lg">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-base">
                Do you agree to proceed with the payment for access to "{eventTitle}"?
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setStage('payment')} className="flex-1 h-12 text-lg">
                  Yes, Continue
                </Button>
                <Button onClick={onClose} variant="outline" className="flex-1 h-12 text-lg">
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
          <CardTitle className="text-2xl">Complete Payment</CardTitle>
          <CardDescription className="text-lg">
            Review and complete your payment for "{eventTitle}"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{priceFormatted}</div>
            <div className="text-sm text-muted-foreground">One-time payment for full event access</div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={loading || !packageToBuy}
            className="w-full h-12 text-lg"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {loading ? 'Processing...' : `Pay ${priceFormatted}`}
          </Button>

          <div className="text-xs text-center text-muted-foreground">
            In-app purchase powered by Apple / Google
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentOverlay;
