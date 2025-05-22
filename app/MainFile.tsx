import React from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';


const MainFile = () => {

    return(
    <ThemeProvider value={DefaultTheme}>
        <Stack>
            <Stack.Screen name="index" />
            <Stack.Screen name="conversations"/>
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="notifications" />
        </Stack>
        <StatusBar style="dark" />
    </ThemeProvider>
    );


}

export default MainFile;