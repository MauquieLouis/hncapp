import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUserContext } from '@/contexts/userContext';


const AuthNav = () => {

    const { theme } = useUserContext();

    // <ThemeProvider value={DarkTheme}>
    return(
        <>
            <Stack screenOptions={{headerStyle: {backgroundColor: theme?.backgroundColor1}, headerTintColor: theme?.textColor1, headerTitleStyle: {fontWeight: 'bold'}, headerTitleAlign: 'center', headerShadowVisible: false, headerBackTitleVisible: false, headerBackImage: () => <Ionicons name="chevron-back" size={24} color={theme?.textColor1} />}}>
                <Stack.Screen name="main" options={{headerShown:false}}/>
                <Stack.Screen name="conversations"/>
                <Stack.Screen name="+not-found" />
                <Stack.Screen name="profile" />
                {/* <Stack.Screen name="notifications" /> */}
            </Stack>
        </>
    );
    // </ThemeProvider>


}

export default AuthNav;