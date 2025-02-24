import React, { useEffect, useState, useRef } from "react";
import { Stack } from "expo-router";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { StatusBar } from 'expo-status-bar';
import { UserContextProvider, useUserContext } from "../contexts/userContext";
import { Text, Platform, View, Button } from "react-native";
import { supabase } from "@/libs/initSupabase";
import * as Notifications from 'expo-notifications';
import * as Constants from 'expo-constants';
import * as Device from 'expo-device';

import Auth from "./auth/Login";
import "@/global.css";


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:true,
    shouldPlaySound:true,
    shouldSetBadge:true
  }),
});

async function sendPushNotification(expoPushToken: string) {
  //ExponentPushToken[LAeDpVJcdT2PZz3kEnrFwj]
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: 'Original Title',
    body: 'Here is the body!',
    data: { someData: 'goes here'},
    channel: 'default',
    collapseKey: "dev.expo.notificationsapp",
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android'){
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0,250,250,250],
      lightColor: '#FF231F7C' 
    })
  }
  // Notifications.scheduleNotificationAsync({
  //   content: {
  //     title: `New Messages (${messages.length})`,
  //     body: messageText,
  //     sound:'default',
  //   }, 
  //   identifier: addNotificationReceivedListener,
  //   trigger: null
  // })

  if(Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if(existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if(finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notifications !');
      return;
    }
    const projectId = Constants?.default?.expoConfig?.extra?.eas?.projectId ?? Constants?.default?.easConfig?.projectId;
    if(!projectId) {
      handleRegistrationError('Project ID not found');
    }
    try{
      const pushTokenString = (await Notifications.getExpoPushTokenAsync({projectId})).data;
      console.log("PUSH TOKEN STRING :",pushTokenString);
      return pushTokenString;
    }catch(e: unknown){
      handleRegistrationError(`${e}`);
    }
  }else{
    handleRegistrationError('Must use physical device for push notifications');
  }
}

// Function to send or update a notification
async function sendOrUpdateNotification(chatId: any, messages: any[]) {
  const notificationId = `chat-${chatId}`; // Unique ID per conversation
  const messageText = messages.join('\n'); // Merge messages

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `New Messages (${messages.length})`,
      body: messageText, // Show latest messages in one notification
      sound: 'default',
    },
    identifier: notificationId, // Ensures it updates instead of creating a new one
    trigger: null, // Immediate notification
  });
}

const updateOrInsertDeviceToken = async(userId: any, device_token: any) => {
  try{
    const { data: device_token_data, error: device_token_error } = await supabase.from('device_tokens')
    .upsert({'user_id': userId, 'device_token': device_token}, {onConflict: 'user_id, device_token', }).select();
    if(device_token_error){
      console.log("Error in updateOrInsertDeviceToken function when upserting device token in main _layout.tsx", device_token_error);
    }
    console.log("DATA DEVICE TOKEN :", device_token_data);
  }catch(error: unknown) {
    console.log("Error in updateOrInsertDeviceToken function in main _layout.tsx", error);
  }finally{

  }
}

const MainStack = () => {
  
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const { session, loading, user } = useUserContext();
  console.log("SESSION:");
  
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();
  useEffect(() => {
      registerForPushNotificationsAsync().then(token => setExpoPushToken(token ?? ''))
      .catch((error: any) => setExpoPushToken(`${error}`));
      
      notificationListener.current = Notifications.addNotificationReceivedListener(notif => { setNotification(notif);} );
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => { console.log(response);});
      
      return () => {
        notificationListener.current && Notifications.removeNotificationSubscription(notificationListener.current);
        responseListener.current && Notifications.removeNotificationSubscription(responseListener.current);
      }
    }, []);
    
    useEffect(() => {
      if(session && expoPushToken){
        console.log("USER AND TOKEN", user.id, expoPushToken);
        updateOrInsertDeviceToken(user.id, expoPushToken);
      }
    }, [expoPushToken, session]);

  return (
    <>
    {loading ? 
      <Text>LOADING !!</Text>: 
      <>
      {/* // <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
      //   <Text>Your Expo push token: {expoPushToken}</Text>
      //   <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      //     <Text>Title: {notification && notification.request.content.title} </Text>
      //     <Text>Body: {notification && notification.request.content.body}</Text>
      //     <Text>Data: {notification && JSON.stringify(notification.request.content.data)}</Text>
      //   </View>
      //   <Button
      //     title="Press to Send Notification"
      //     onPress={async () => {
      //       await sendPushNotification(expoPushToken);
      //     }}
      //   />
      // </View> */}
       {session ?
        <>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="dark" />
        </> 
        :
        <Auth/>
      }
      </>
    }
    </>
  );
}

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="light">
      <UserContextProvider props={undefined}>
        <MainStack/>
      </UserContextProvider>
    </GluestackUIProvider>
  );
}
