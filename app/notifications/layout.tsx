import React from "react-native";
import { Stack } from "expo-router";

const NotificationsStack = () => {

  return (
    <Stack>
      <Stack.Screen name="notificationsList" options={{ headerShown: false }}/>
    </Stack>
  );
}

export default NotificationsStack;