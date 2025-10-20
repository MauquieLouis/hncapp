import { useEffect } from 'react';
import { AppState } from 'react-native';
import { refreshSignedUrl } from './signedUrlCache.mmkv';

export const useAutoRefreshSignedUrls = (paths = [], bucket: string) => {
    
    useEffect(() => {
        let interval: string | number | NodeJS.Timeout | undefined;
        const startRefreshing = () => {
            interval = setInterval(() => {
                paths.forEach((p) => refreshSignedUrl(p, 86400, bucket));
            })
        };

        const handleAppStateChange = (state: string) => {
            if (state === 'active') startRefreshing();
            else clearInterval(interval);
        };

        AppState.addEventListener('change', handleAppStateChange);
        startRefreshing();

        return() => {
            clearInterval(interval);
            // AppState.removeEventListener('change', handleAppStateChange);
        };
    }, [paths]);
}