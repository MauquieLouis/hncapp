import React, { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Link, Redirect } from 'expo-router';
import { useUserContext } from "@/contexts/userContext";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import { useEffect } from "react";


export default function Main() {

  const { profile, theme, session } = useUserContext();
  const router = useRouter();

  if(!session || !profile){
    router.replace("/(notAuth)/SignIn");
    return null;
  }

  const iconColor = theme?.textColor1;
  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: theme.textColor1,
    paddingTop:45,
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: theme.textColor2,
  },
  boxStyle: {
    borderColor: theme.borderColorLight,
    borderWidth: 4,
    width: 120,
    height: 120,
    borderRadius:5,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  }
});

  useEffect(() => {
      console.log('INDEXrr MOUNTED');
  },[]);

  return (
    <View
    style={styles.container}
    >
      <VStack space="3xl">
        <HStack space="3xl">
          {/* ------------------------------------------------------------------
                                  P R O F I L E 
          ------------------------------------------------------------------ */}
          <TouchableOpacity style={styles.boxStyle}
            onPress={() => {
              if (profile) {
                router.push(`/profile/${profile.user_id}`);
              }
            }}
          >
            <Ionicons name="person-outline" size={50} color={iconColor} />
          </TouchableOpacity>
          {/* ------------------------------------------------------------------
                                  C O N V E R S A T I O N S 
          ------------------------------------------------------------------ */}
          <TouchableOpacity style={styles.boxStyle}
            onPress={() => {
                router.push("/conversations/conversationsList");
              }}
          >
            <Ionicons name="chatbubbles-outline" size={50} color={iconColor} />
          </TouchableOpacity>
        </HStack>
        <HStack space="3xl">
          {/* ------------------------------------------------------------------
                                  N O T I F I C A T I O N S
          ------------------------------------------------------------------ */}
          <TouchableOpacity style={styles.boxStyle}
            onPress={() => {
              router.push("/notifications/notificationsList");
            }}
          >
            <Ionicons name="notifications-outline" size={50} color={iconColor} />
          </TouchableOpacity>
            {/* ------------------------------------------------------------------
                                    U S E R S   L I S T
            ------------------------------------------------------------------ */}
          <TouchableOpacity style={styles.boxStyle}
            onPress={() => {
                router.push({pathname: "/profile/profileList", params: { type : "all"}});
              }}
          >
            <Ionicons name="list-outline" size={50} color={iconColor} />
          </TouchableOpacity>
        </HStack>
      </VStack>
      {/* ============ This is a way to make as default screen : Redirect ============ */}
        {/* <Redirect href="/conversations/conversationsList" />  */}
      {/* ============================================================================ */}
      <Text style={styles.text} >Home Screen.</Text>
      <Link href="/about" style={styles.button}>
        About Us
      </Link>
      <View style={{padding:10}}></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxStyle: {
    width: 100,
    height: 100,
    backgroundColor: '#4a5568',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    color: '#333',
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#3b82f6',
    color: '#fff',
    borderRadius: 5,
  },
});
