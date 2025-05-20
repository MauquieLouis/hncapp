import React from "react-native";
import { Stack } from "expo-router";

const ProfileStack = () => {

  return (
    <Stack>
      <Stack.Screen name="[...profileId]" options={{ headerShown: false }}/>
      <Stack.Screen name="profileList" options={{ headerShown: false }}/>
    </Stack>
  );
}

export default ProfileStack;