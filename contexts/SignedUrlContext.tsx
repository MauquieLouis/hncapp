import React, { createContext, useContext, useState } from 'react';
import { getSignedUrl } from '@/utils/signedUrlCache.mmkv';

const SignedUrlContext = createContext<any>(null);

export const SignedUrlProvider = ({ children }: {children: any}) => {
    const [ cache, setCache ] = useState<{ [key: string | number]: string }>({});
    
    const fetchSignedUrl = async (path: string, bucket: string) => {
        if(cache[path]) return cache[path];
        const url = await getSignedUrl(path, 86400, bucket);
        if (url) setCache((prev) => ({...prev, [path]: url}));
        return url;
    };

    return (
        <SignedUrlContext.Provider value={{ fetchSignedUrl }}>
            { children}
        </SignedUrlContext.Provider>
    )
}

export const useSignedUrlContexrt = () => useContext(SignedUrlContext);