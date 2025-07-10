import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "@/integrations/supabase/client";

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
