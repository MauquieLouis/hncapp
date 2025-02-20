import { Stack } from "expo-router";

const ProfileStack = () => {

  return (
    <Stack>
      <Stack.Screen name="Account" options={{ headerShown: false }}/>
    </Stack>
  );
}

export default ProfileStack;