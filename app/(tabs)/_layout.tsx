import React from 'react-native';
import { Stack, Tabs } from 'expo-router';

import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';


export default function TabLayout() {
  return (
    // <ThemeProvider value={DefaultTheme}>
      <Stack>
        {/* <Stack.Screen name="index"/> */}
        <Stack.Screen name="conversations" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      // <StatusBar style="auto" />
    // </ThemeProvider>


    
    // <Tabs initialRouteName='conversations'
    // screenOptions={{
    //   tabBarActiveTintColor: '#ffd33d',
    //   headerStyle: {
    //     backgroundColor: '#25292e',
    //   },
    //   headerShadowVisible: false,
    //   headerTintColor: '#fff',
    //   tabBarStyle: {
    //   backgroundColor: '#25292e',
    //   },
    // }}
    // >
    //   <Tabs.Screen
    //     name="conversations"
    //     options={{
    //       title: 'CONV',
    //       tabBarIcon: ({ color, focused }) => (
    //         <Ionicons name={focused ? 'chatbubbles-sharp' : 'chatbubbles-outline'} color={color} size={24} />
    //       ),
    //     }}
    //   />
    //   <Tabs.Screen
    //     name="profile"
    //     options={{
    //       title: 'Profile',
    //       tabBarIcon: ({ color, focused }) => (
    //         <Ionicons name={focused ? 'person-sharp' : 'person-outline'} color={color} size={24} />
    //       ),
    //     }}
    //   />
    //   <Tabs.Screen
    //     name="about"
    //     options={{
    //       title: 'About',
    //       tabBarIcon: ({ color, focused }) => (
    //         <Ionicons name={focused ? 'information-circle' : 'information-circle-outline'} color={color} size={24}/>
    //       ),
    //     }}
    //   />
    //   <Tabs.Screen
    //     name="index"
    //     options={{
    //       tabBarItemStyle: { display: "none" },
    //       title: '',
    //       tabBarIcon: ({ color, focused }) => (
    //         <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
    //       ),
    //     }}
    //   />
    // </Tabs>
  );
}
