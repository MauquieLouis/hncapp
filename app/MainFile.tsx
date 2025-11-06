import React from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUserContext } from '@/contexts/userContext';
import { useEffect, useState } from 'react';


const MainFile = () => {

    const [ barStyle, setBarStyle ] = useState("light");
    
    const { theme } = useUserContext();

    useEffect(() => {
        if(theme){
            setBarStyle(theme.dark ? "dark" : "light");
        }
    }, [theme])
    // <ThemeProvider value={DarkTheme}>
    return(
        <>
         {/* {theme ?
        <StatusBar backgroundColor={theme.backgroundColor2} style={barStyle}/>
      :<></>} */}
            {/* <Stack screenOptions={{headerStyle: {backgroundColor: theme?.backgroundColor1}, headerTintColor: theme?.textColor1, headerTitleStyle: {fontWeight: 'bold'}, headerTitleAlign: 'center', headerShadowVisible: false, headerBackTitleVisible: false, headerBackImage: () => <Ionicons name="chevron-back" size={24} color={theme?.textColor1} />}}> */}
            {/* <Stack screenOptions={{headerStyle: {backgroundColor: "red"}, headerTintColor: 'yellow', headerTitleStyle: {fontWeight: 'bold'}, headerTitleAlign: 'center', headerShadowVisible: false, headerBackTitleVisible: false, headerBackImage: () => <Ionicons name="chevron-back" size={24} color={"blue"} />}}> */}
            <Stack>
                <Stack.Screen name="index" options={{headerShown:false}}/>
                <Stack.Screen name="(auth)" options={{headerShown:false}}/>
                <Stack.Screen name="+not-found" />
                <Stack.Screen name="(notAuth)" options={{headerShown:false}}/>
            </Stack>
        </>
    );
    // </ThemeProvider>


}

export default MainFile;