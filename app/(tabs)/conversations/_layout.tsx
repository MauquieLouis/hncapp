import { Stack } from "expo-router";

const ConversationsStack = () => {

  return (
    <Stack>
      <Stack.Screen name="[...convId]" options={{ headerShown: false }}/>
      <Stack.Screen name="conversationsList" options={{ headerShown: false }}/>
    </Stack>
  );
}

export default ConversationsStack;