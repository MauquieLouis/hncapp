import React, { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { Link, Redirect } from 'expo-router';
import { useUserContext } from "@/contexts/userContext";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';


export default function Index() {

  const { profile } = useUserContext();
  const router = useRouter();
  

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
              console.log("Profile");
              if (profile) {
                router.push(`/profile/${profile.user_id}`);
              }
            }}
          >
            <Ionicons name="person-outline" size={50} color="white" />
          </TouchableOpacity>
          {/* ------------------------------------------------------------------
                                  C O N V E R S A T I O N S 
          ------------------------------------------------------------------ */}
          <TouchableOpacity style={styles.boxStyle}
            onPress={() => {
                // console.log("Discussions");
                router.push("/conversations/conversationsList");
              }}
          >
            <Ionicons name="chatbubbles-outline" size={50} color="white" />
          </TouchableOpacity>
        </HStack>
        <HStack space="3xl">
          {/* ------------------------------------------------------------------
                                  N O T I F I C A T I O N S
          ------------------------------------------------------------------ */}
          <TouchableOpacity style={styles.boxStyle}
            onPress={() => {
              console.log("Notifications");
              router.push("/notifications/notificationsList");
            }}
          >
            <Ionicons name="notifications-outline" size={50} color="white" />
          </TouchableOpacity>
            {/* ------------------------------------------------------------------
                                    U S E R S   L I S T
            ------------------------------------------------------------------ */}
          <TouchableOpacity style={styles.boxStyle}
            onPress={() => {
                // console.log("user list");
                router.push("/profile/profileList");
              }}
          >
            <Ionicons name="list-outline" size={50} color="white" />
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
      {/* <Link href="conversations/conversationsList" style={styles.button}>
        CONVERSATIONS
      </Link>
      <Link href={{
              pathname: 'profile/[id]', 
              params: {id: profile.user_id}
            }} 
          style={styles.button}>
        Profile --
      </Link> 
      <Link href={`profile/${profile.user_id}`} 
          style={styles.button}>
        Profile --
      </Link>
      <Link href="profile/profileList" style={styles.button}>
        Profile List
      </Link> */}
      {/* <Link href="/(tabs)" style={styles.button}>
        Tabs
      </Link> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    paddingTop:45,
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
  boxStyle: {
    borderColor: "white",
    borderWidth: 2,
    width: 120,
    height: 120,
    borderRadius:5,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  }
})
