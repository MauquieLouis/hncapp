import React, { TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUserContext } from "@/contexts/userContext";
import { usePostStore } from "@/contexts/store";

const ProfileStack = () => {

  const router = useRouter();
  const { theme } = useUserContext();

  const { username } = usePostStore();
  
  return (
      <Stack  screenOptions={{headerStyle: {backgroundColor: theme?.backgroundColor1}, headerTintColor: theme?.textColor1, headerTitleAlign: 'right', headerShadowVisible: false, headerBackTitleVisible: false}}>        
      <Stack.Screen name="[...profileId]" 
        options={{
          headerTitle:`${username}`,
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
        <Stack.Screen name="searchProfile"
          options={{
            headerTitle:`Search a profile`,
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
          }}
        />
        <Stack.Screen name="createPost"/>
        <Stack.Screen name="settings"/>
        <Stack.Screen name="post/[...postId]"/>
      </Stack>
  );
}

export default ProfileStack;