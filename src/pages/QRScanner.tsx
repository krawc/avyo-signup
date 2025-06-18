
import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

const QRScanner = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    
    return () => {
      if (readerRef.current) {
        readerRef.current.reset();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current || !readerRef.current) return;
  
    try {
      setIsScanning(true);
      setError(null);
  
      const devices = await readerRef.current.listVideoInputDevices();
      let selectedDeviceId: string | undefined;
  
      // Try to find a rear camera
      for (const device of devices) {
        if (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('environment')) {
          selectedDeviceId = device.deviceId;
          break;
        }
      }
  
      // Fallback to first available device
      if (!selectedDeviceId && devices.length > 0) {
        selectedDeviceId = devices[0].deviceId;
      }

      console.log(selectedDeviceId)
  
      if (!selectedDeviceId) {
        throw new Error('No video input devices found');
      }
  
      await readerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result) => {
          if (result) {
            const text = result.getText();
            console.log('QR Code detected:', text);
  
            try {
              const url = new URL(text);
              window.open(url.href, '_blank');
            } catch {
              if (text.startsWith('/')) {
                navigate(text);
              } else {
                setError('QR code does not contain a valid link');
              }
            }
  
            stopScanning();
          }
        }
      );
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Unable to access camera. Please ensure you have granted camera permissions.');
      setIsScanning(false);
    }
  };
  

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-foreground">QR Code Scanner</h1>
            <p className="text-muted-foreground mt-2">
              Scan QR codes to quickly navigate to links or pages
            </p>
          </div>

          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Camera Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  playsInline
                />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="text-center text-white">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Camera not active</p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-2">
                {!isScanning ? (
                  <Button onClick={startScanning} className="flex-1">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button onClick={stopScanning} variant="destructive" className="flex-1">
                    Stop Scanning
                  </Button>
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Position the QR code within the camera view. The scanner will automatically detect and navigate to valid links.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
