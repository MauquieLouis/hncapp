// utils/signedUrlCache.mmkv.js
import { MMKV } from 'react-native-mmkv';
import { supabase } from '@/libs/initSupabase';

const storage = new MMKV();
const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in ms

// const BUCKET = 'avatars'; // adjust if needed
/**
 * Get the signedUrl check for in local mmkv to see if one is cached and has not expired, otherwise, it get one from supabase
 * @param path the path of the image to try to load,
 * @param expiresIn This is optional, to specify how much time before the file expire (default 86400 seconds = 24 hours)
 * @param bucket The bucket where the image is supposed to be ('avatars', 'posts')
 * @returns the signedUrl (string)
 */
export const getSignedUrl = async (path: string, expiresIn = 86400, bucket: string) => {
  try {
    const cacheKey = `signed_url_${path}`;
    const cachedItem = storage.getString(cacheKey);
    const now = Date.now();

    if (cachedItem) {
      console.log("GET FROM MMKV CACHE")
      const parsed = JSON.parse(cachedItem);
      const timeLeft = parsed.expiresAt - now;

      // ✅ Case 1: Still valid and not expiring soon
      if (timeLeft > REFRESH_THRESHOLD) {
        return parsed.url;
      }

      // Case 2: Still valid, but close to expiring — return old one and refresh silently
      if (timeLeft > 0) {
        refreshSignedUrl(path, expiresIn, bucket);
        return parsed.url;
      }
    }
    console.log("LOAD FROM SUPABASE")
    // Case 3: Expired or not cached — fetch a fresh one now
    return await refreshSignedUrl(path, expiresIn, bucket);
  } catch (err) {
    console.error(`Error getting signed URL from bucket ${bucket} in getSignedUrl function in signedUrlCache.mmkv.ts:`, err);
    return null;
  }
};

// Helper: Refresh the signed URL and update cache
export const refreshSignedUrl = async (path: string, expiresIn = 86400, bucket: string) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    if (error){
        console.error(`Error when getting newx signedUrl from bucket ${bucket} in refreshSignedUrl function in signedUrlCache.mmkv.ts`, error);
    };

    const newUrl = data.signedUrl;
    const now = Date.now();

    storage.set(
      `signed_url_${path}`,
      JSON.stringify({
        url: newUrl,
        expiresAt: now + expiresIn * 1000,
      })
    );

    return newUrl;
  } catch (err) {
    console.error(`Error refreshing signed URL in bucket ${bucket} in refreshSignedUrl function in signedUrlCache.mmkv.ts :`, err);
    return null;
  }
};
