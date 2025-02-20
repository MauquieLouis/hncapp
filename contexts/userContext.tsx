import React, { createContext, useContext, useEffect, useState } from 'react';
import {supabase} from '../libs/initSupabase';

export const UserContext = createContext({
    loading: false,
    profile: null,
    session: null,
    user: null,
});

export const UserContextProvider = ({ props, children}: {props: any, children: any}) => {

    const [loading, setLoading] = useState<boolean>(true);
    const [profile, setProfile] = useState<Record<string, any> | null>(null);
    const [session, setSession] = useState<Record<string, any> | null>(null);
    const [user, setUser] = useState<Record<string, any> | null>(null);
    async function loadProfile(userD = user) {
        if(userD == null){
            setLoading(false);
            return;
        }
        try{
            setLoading(true);
            const { data: profileData, error: errorData } = await supabase.from('profiles').select('*').eq('user_id', userD.id);
            if(profileData){
                setProfile(profileData[0]);
            }
            if(errorData){
                console.error('Error in loadProfile() request in userContext.js', errorData);
            }
        }catch(error){
            console.error('ERROR in loadProfile function un userContext.ts', error);
        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        supabase.auth.getSession().then(({data: {session}}) => {
            setSession(session);
            setUser(session?.user ?? null);
            loadProfile(session?.user);
        });
        // eslint-disable-next-line @typescript-eslint/no-shadow
        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if(session?.user){
            loadProfile();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const value = {
        loading,
        profile,
        session,
        user,
    };

    return(
        <UserContext.Provider value={value} { ...props}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    const context = useContext(UserContext);
    if(context === undefined){
        throw new Error('useUserContext must be used within a UserContextProvider.');
    }
    return context;
};

