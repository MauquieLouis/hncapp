import React, { TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUserContext } from "@/contexts/userContext";

const ConversationsStack = () => {

  const { theme } = useUserContext();
  const router = useRouter();

  return (
    <Stack>
      <Stack.Screen name="[...convId]"
        options={{
              // headerTitle:`Conversations`,
              headerLeft:() => {return(
                <TouchableOpacity
                onPress={() => {
                  router.back(); // internal return
                }}
                style={{ paddingHorizontal: 10}}
                >
                    <Ionicons name="arrow-back" size={26} color={theme.iconColor2}/>
                </TouchableOpacity>)
              },
        }}/>
      <Stack.Screen name="conversationsList" 
        options={{
              headerTitle:`Conversations`,
              headerLeft:() => {return(
                <TouchableOpacity
                onPress={() => {
                  router.back(); // internal return
                }}
                style={{ paddingHorizontal: 10}}
                >
                    <Ionicons name="arrow-back" size={26} color={theme.iconColor2}/>
                </TouchableOpacity>)
              },
            }}/>
    </Stack>
  );
}

export default ConversationsStack;