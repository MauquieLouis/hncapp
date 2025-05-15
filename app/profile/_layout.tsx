import React from "react-native";
import { Stack } from "expo-router";

const ProfileStack = () => {

  return (
    <Stack>
      <Stack.Screen name="profileScreen" options={{ headerShown: false }}/>
    </Stack>
  );
}

export default ProfileStack;