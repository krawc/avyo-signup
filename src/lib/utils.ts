import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getDisplayName = (profile) => {
  if (profile?.display_name) return profile.display_name;
  if (profile?.first_name && profile?.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }
  return profile?.first_name || "Anonymous User";
};

// 🔒 Simple in-memory cache
const signedUrlCache: Map<string, { url: string; expiresAt: number }> = new Map();

export const getSignedUrl = async (fullUrl: string): Promise<string | null> => {
  const cached = signedUrlCache.get(fullUrl);
  if (cached && Date.now() < cached.expiresAt) {
    console.log('Found a cached url: ' + cached.url)
    return cached.url;
  }

  const pathMatch = fullUrl.match(/\/profile-pictures\/(.+)$/);
  const path = pathMatch?.[1];

  if (!path) {
    console.warn("Invalid URL format for signing:", fullUrl);
    return null;
  }

  console.log('No cached URL found - generating new signed')

  const { data, error } = await supabase
    .storage
    .from("profile-pictures")
    .createSignedUrl(path, 60 * 60); // 1 hour

  if (error) {
    console.error(`Error creating signed URL for ${path}:`, error);
    return null;
  }

  const signedUrl = data?.signedUrl ?? null;

  if (signedUrl) {
    signedUrlCache.set(fullUrl, {
      url: signedUrl,
      expiresAt: Date.now() + 60 * 60 * 1000,
    });
  }

  return signedUrl;
};

export const getSignedUrls = async (urls: string[]): Promise<string[]> => {
  return Promise.all(urls.map(getSignedUrl)).then((results) =>
    results.filter(Boolean) as string[]
  );
};

export interface ParsedEventData {
  eventId: string;
  isValid: boolean;
  error?: string;
}

export const parseEventUrl = (url: string): ParsedEventData => {
  try {
    // Check if it's an avyo:// URL
    if (!url.startsWith('avyo://')) {
      return {
        eventId: '',
        isValid: false,
        error: 'Invalid URL scheme. Expected avyo://'
      };
    }

    // Parse the URL
    const urlObj = new URL(url);
    
    // Extract eventId from search parameters
    const eventId = urlObj.searchParams.get('eventId');
    
    if (!eventId) {
      return {
        eventId: '',
        isValid: false,
        error: 'No eventId parameter found in URL'
      };
    }

    return {
      eventId,
      isValid: true
    };
  } catch (error) {
    return {
      eventId: '',
      isValid: false,
      error: `Failed to parse URL: ${error}`
    };
  }
};

// Alternative parser if eventId is in the path
export const parseEventUrlFromPath = (url: string): ParsedEventData => {
  try {
    if (!url.startsWith('avyo://')) {
      return {
        eventId: '',
        isValid: false,
        error: 'Invalid URL scheme. Expected avyo://'
      };
    }

    // Remove avyo:// and extract path
    const path = url.replace('avyo://', '');
    const segments = path.split('/').filter(segment => segment.length > 0);
    
    // Assuming format like avyo://event/123 or avyo://123
    let eventId = '';
    
    if (segments.length === 1) {
      eventId = segments[0];
    } else if (segments.length >= 2 && segments[0] === 'event') {
      eventId = segments[1];
    }

    if (!eventId) {
      return {
        eventId: '',
        isValid: false,
        error: 'No eventId found in URL path'
      };
    }

    return {
      eventId,
      isValid: true
    };
  } catch (error) {
    return {
      eventId: '',
      isValid: false,
      error: `Failed to parse URL: ${error}`
    };
  }
};

  // Add event ID to user profile
  export const addEventId = async (eventId: string, user) => {

    //const {user} = useAuth();

    if (eventId && user) {
      try {
        // Join the event
        const { error } = await supabase
          .from('event_attendees')
          .insert({ event_id: eventId, user_id: user.id });

        if (!error) {
          // Clear the pending event
          //localStorage.removeItem('pendingEventId');
          // Refresh events list
          //fetchMyEvents();
        }
      } catch (error) {
        console.error('Error joining pending event:', error);
      }
    }
  }
