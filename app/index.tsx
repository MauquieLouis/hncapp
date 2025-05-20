import React, { Text, View, StyleSheet } from "react-native";
import { Link, Redirect } from 'expo-router';
import { useUserContext } from "@/contexts/userContext";

export default function Index() {

  const { profile } = useUserContext();

  return (
    <View
    style={styles.container}
    >
      {/* ============ This is a way to make as default screen : Redirect ============ */}
        {/* <Redirect href="/conversations/conversationsList" />  */}
      {/* ============================================================================ */}
      <Text style={styles.text} >Home Screen.</Text>
      <Link href="/about" style={styles.button}>
        About Us
      </Link>
      <View style={{padding:10}}></View>
      <Link href="conversations/conversationsList" style={styles.button}>
        CONVERSATIONS
      </Link>
      {/* <Link href={{
              pathname: 'profile/[id]', 
              params: {id: profile.user_id}
            }} 
          style={styles.button}>
        Profile --
      </Link> */}
      <Link href={`profile/${profile.user_id}`} 
          style={styles.button}>
        Profile --
      </Link>
      <Link href="profile/profileList" style={styles.button}>
        Profile List
      </Link>
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
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
})
