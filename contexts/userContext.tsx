import React, { createContext, useContext, useEffect, useState } from 'react';
import {supabase} from '../libs/initSupabase';

import LightStyle from '../assets/themes/light';
import DarkStyle from '../assets/themes/dark';
import WhiteStyle from '../assets/themes/white';
import BlackStyle from '../assets/themes/black';
import PinkStyle from '../assets/themes/pink';

export const UserContext = createContext({
    loading: false,
    profile: null,
    session: null,
    user: null,
    theme: null,
    signOut: function(){},
    changeTheme: function(theme: string){},
});

export const UserContextProvider = ({ props, children}: {props: any, children: any}) => {

    const [loading, setLoading] = useState<boolean>(true);
    const [profile, setProfile] = useState<Record<string, any> | null>(null);
    const [session, setSession] = useState<Record<string, any> | null>(null);
    const [user, setUser] = useState<Record<string, any> | null>(null);
    const [theme, setTheme] = useState<string | null>(null);

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
                switchTheme(profileData[0]["theme"]);
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

    const switchTheme = async(theme: string) => {
        switch(theme){
            case 'light':
                setTheme(LightStyle);
                break;
            case 'dark':
                setTheme(DarkStyle);
                break;
            case 'black':
                setTheme(BlackStyle);
                break;
            case 'white':
                setTheme(WhiteStyle);
                break;
            case 'pink':
                setTheme(PinkStyle);
                break;
            default:
                setTheme(WhiteStyle);
        }
    }

    const changeTheme = async (theme: string) => {
        await switchTheme(theme);
        try{
            const { data, error } = await supabase.from('profiles').update({ theme: theme }).eq('user_id', user?.id);
            if(error){
                console.error('Error when changing theme in changeTheme() request in userContext.js', error);
            }
        }catch(error){
            console.error('ERROR in changeTheme function un userContext.ts', error);
        }
    }

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        supabase.auth.getSession().then(({data: {session}}) => {
            setSession(session);
            setUser(session?.user ?? null);
            loadProfile(session?.user);
        });
        const {data: listener} = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("AUTH STATE CHANGE:", _event, "SSSSEEEESSSSIOOOONNNN :", session);
            setSession(session);
            setUser(session?.user ?? null);
            if(session?.user) loadProfile(session.user);
        });

        return () => {
            listener.subscription.unsubscribe();
        };

    }, []);

    useEffect(() => {
        if(session?.user){
            loadProfile();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const signOut = async () => {
        await supabase.auth.signOut()
      }

    const value = {
        loading,
        profile,
        session,
        user,
        theme,
        signOut,
        changeTheme,
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

