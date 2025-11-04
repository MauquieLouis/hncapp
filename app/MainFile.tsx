import React from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUserContext } from '@/contexts/userContext';


const MainFile = () => {

    const { theme } = useUserContext();


    // <ThemeProvider value={DarkTheme}>
    return(
        <>
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