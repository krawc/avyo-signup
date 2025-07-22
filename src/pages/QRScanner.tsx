import { useEffect, useState, useCallback, useRef } from 'react';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Camera, X, Zap, ZapOff } from 'lucide-react';
import Header from '@/components/Header';
import { addEventId } from '@/lib/utils'
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

const QRScanner = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const scanningRef = useRef(false);
  const { toast } = useToast();

  // Cleanup function to ensure proper state reset
  const cleanup = useCallback(async () => {
    try {
      if (scanningRef.current) {
        await BarcodeScanner.stopScan();
        scanningRef.current = false;
      }
      BarcodeScanner.showBackground();
      document.body.style.background = '';
      document.body.style.opacity = '';
      setIsScanning(false);
      setTorchEnabled(false);
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  }, []);

  // Initialize scanner permissions on mount
  useEffect(() => {
    const initializeScanner = async () => {
      try {
        const status = await BarcodeScanner.checkPermission({ force: false });
        setIsInitialized(true);
        
        if (status.denied) {
          setError('Camera permission is required for QR scanning.');
        }
      } catch (err) {
        console.error('Scanner initialization error:', err);
        setError('QR scanner not available on this device.');
      }
    };

    initializeScanner();
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startScan = async () => {
    if (scanningRef.current) {
      console.warn('Scan already in progress');
      return;
    }

    try {
      setError(null);

      const status = await BarcodeScanner.checkPermission({ force: true });
      
      if (status.denied || !status.granted) {
        setError('Camera permission denied. Please enable camera access in settings.');
        return;
      }

      setIsScanning(true);
      scanningRef.current = true;
      
      // Make the body transparent to show camera
      document.body.style.background = 'transparent';
      document.body.style.opacity = '1';
      
      // Hide the WebView background to show native camera
      BarcodeScanner.hideBackground();

      console.log('Starting barcode scan...');
      const result = await BarcodeScanner.startScan();

      if (!scanningRef.current) {
        return;
      }

      if (result.hasContent && result.content) {
        const text = result.content.trim();
        console.log('Scanned QR:', text);
        handleScannedContent(text);
      } else {
        console.log('Scan cancelled or no content found');
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      
      if (err.message?.includes('User cancelled')) {
        console.log('User cancelled scan');
      } else if (err.message?.includes('permission')) {
        setError('Camera permission error. Please check your settings.');
      } else {
        setError('Failed to start scanner. Please try again.');
      }
    } finally {
      await cleanup();
    }
  };

  const handleEventId = async (eventId: string) => {
    try {
      // You'll need to import your addEventId function
      const updatedProfile = await addEventId(eventId, user);
      toast({
        title: "Event Added!",
        description: `Event ${eventId} added to your profile!`,
      });
      
      // Navigate back or to profile after successful event addition
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save event to profile: ${error}, ${eventId}`,
      });
    }
  };

  const handleDeepLinkError = (error: string) => {
    toast({
      title: "Link Error",
      description: error,
    });
  };

  // // Set up deep link handler
  // useDeepLink({
  //   onEventId: handleEventId,
  //   onError: handleDeepLinkError
  // });

  const handleScannedContent = (text: string) => {
    console.log('Processing scanned content:', text);
    
    // Check for avyo:// deep links first
    if (text.startsWith('avyo://')) {
      console.log('Found avyo deep link:', text);
      
      try {
        const url = new URL(text);
        const eventId = url.searchParams.get('eventId') || url.pathname.replace('/', '');
        
        if (eventId && eventId.trim()) {
          console.log('Extracted eventId:', eventId);
          handleEventId(eventId.trim());
          return;
        } else {
          setError('Invalid avyo link: No event ID found');
          return;
        }
      } catch (err) {
        console.error('Error parsing avyo link:', err);
        setError('Invalid avyo link format');
        return;
      }
    }

    // Handle other URL types as fallback
    try {
      const url = new URL(text);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        window.open(url.href, '_blank');
        return;
      }
    } catch {
      // Not a valid URL
    }

    // Handle local routes
    if (text.startsWith('/')) {
      navigate(text);
      return;
    }

    // Handle other protocols
    if (text.includes(':')) {
      const [protocol] = text.split(':');
      if (['tel', 'mailto', 'sms'].includes(protocol.toLowerCase())) {
        window.location.href = text;
        return;
      }
    }

    // If nothing matches, show error
    setError(`Unrecognized QR code format. Expected avyo:// link, but got: ${text.substring(0, 50)}...`);
  };

  const stopScan = async () => {
    if (!scanningRef.current) {
      return;
    }

    try {
      console.log('Stopping scan...');
      await cleanup();
    } catch (err) {
      console.error('Error stopping scan:', err);
      await cleanup();
    }
  };

  const toggleTorch = async () => {
    try {
      if (torchEnabled) {
        await BarcodeScanner.disableTorch();
      } else {
        await BarcodeScanner.enableTorch();
      }
      setTorchEnabled(!torchEnabled);
    } catch (err) {
      console.error('Torch toggle error:', err);
    }
  };

  // Handle component unmount or navigation away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (scanningRef.current) {
        BarcodeScanner.stopScan().catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen gradient-bg">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card className="gradient-card border-0 shadow-lg">
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Initializing scanner...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Scanning UI - overlaid on camera feed
  if (isScanning) {
    return (
      <div className="fixed inset-0 z-50">
        {/* Camera feed will show through transparent background */}
        
        {/* Top overlay with controls */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 text-white p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={stopScan}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <h1 className="text-lg font-semibold">Scan QR Code</h1>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleTorch}
              className="text-white hover:bg-white/20"
            >
              {torchEnabled ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Center scanning frame */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="relative w-64 h-64">
            {/* Scanning frame */}
            <div className="absolute inset-0 border-2 border-white rounded-lg">
              {/* Corner indicators */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-green-400 rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-green-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-green-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-green-400 rounded-br-lg"></div>
            </div>
            
            {/* Scanning line animation */}
            <div className="absolute inset-0 overflow-hidden rounded-lg">
              <div 
                className="w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"
                style={{
                  animation: 'scan 2s ease-in-out infinite',
                  transform: 'translateY(128px)'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Bottom overlay with instructions and controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/50 text-white p-6">
          <div className="text-center space-y-4">
            <p className="text-sm">Position the QR code within the frame</p>
            <p className="text-xs text-white/70">The scanner will automatically detect and process QR codes</p>
            
            <Button 
              onClick={stopScan} 
              variant="destructive" 
              className="w-full max-w-xs mx-auto"
            >
              <X className="w-4 h-4 mr-2" />
              Stop Scanning
            </Button>
          </div>
        </div>

        {/* Add scanning animation styles */}
        <style>{`
          @keyframes scan {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(256px); }
          }
        `}</style>
      </div>
    );
  }

  // Regular UI when not scanning
  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">

          <Card className="gradient-card border-0 shadow-lg">
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setError(null)}
                    className="mt-2 text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              )}

              <div className="text-center space-y-4">
                {/* Camera preview placeholder */}
                <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <div className="text-center">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Camera will appear here when scanning</p>
                  </div>
                </div>

                <Button onClick={startScan} size="lg" className="w-full" disabled={!!error}>
                  <Camera className="w-5 h-5 mr-2" />
                  Start QR Code Scan
                </Button>
              </div>

              <div className="text-sm text-muted-foreground space-y-2 border-t pt-4">
                <h3 className="font-medium text-foreground">Supported formats:</h3>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;