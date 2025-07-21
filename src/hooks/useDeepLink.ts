import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { parseEventUrl } from '@/lib/utils';

interface DeepLinkHandlerProps {
  onEventId: (eventId: string) => void;
  onError?: (error: string) => void;
}

export const useDeepLink = ({ onEventId, onError }: DeepLinkHandlerProps) => {
  useEffect(() => {
    // Handle app launch from deep link
    const handleAppUrlOpen = (data: any) => {
      const url = data.url;
      
      if (url) {
        const parsed = parseEventUrl(url);
        
        if (parsed.isValid) {
          onEventId(parsed.eventId);
        } else if (onError) {
          onError(parsed.error || 'Failed to parse event URL');
        }
      }
    };

    // Listen for deep link events
    const removeListener = App.addListener('appUrlOpen', handleAppUrlOpen);

    // Check if app was opened with a URL (when app was closed)
    App.getLaunchUrl().then((result) => {
      if (result?.url) {
        handleAppUrlOpen({ url: result.url });
      }
    });

    return () => {
      removeListener.remove();
    };
  }, [onEventId, onError]);
};