import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from '@/integrations/supabase/client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getSignedUrls = async (urls: string[]): Promise<string[]> => {
  return Promise.all(
    urls.map(async (fullUrl) => {
      try {
        // Extract path AFTER '/profile-pictures/'
        const pathMatch = fullUrl.match(/\/profile-pictures\/(.+)$/);
        const path = pathMatch?.[1];

        if (!path) {
          console.warn('Invalid URL format for signing:', fullUrl);
          return null;
        }

        const { data: signed, error } = await supabase
          .storage
          .from('profile-pictures')
          .createSignedUrl(path, 60 * 60);

        if (error) {
          console.error(`Error creating signed URL for ${path}:`, error);
          return null;
        }

        return signed.signedUrl;
      } catch (err) {
        console.error('Unexpected error signing URL:', err);
        return null;
      }
    })
  ).then((results) => results.filter(Boolean) as string[]);
};

export const getSignedUrl = async (fullUrl: string): Promise<string | null> => {
  try {
    // Extract path after '/profile-pictures/'
    const pathMatch = fullUrl.match(/\/profile-pictures\/(.+)$/);
    const path = pathMatch?.[1];

    if (!path) {
      console.warn('Invalid URL format for signing:', fullUrl);
      return null;
    }

    const { data, error } = await supabase
      .storage
      .from('profile-pictures')
      .createSignedUrl(path, 60 * 60); // 1 hour

    if (error) {
      console.error(`Error creating signed URL for ${path}:`, error);
      return null;
    }

    return data?.signedUrl ?? null;
  } catch (err) {
    console.error('Unexpected error signing URL:', err);
    return null;
  }
};
