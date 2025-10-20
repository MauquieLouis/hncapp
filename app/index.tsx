import React, { Text, View, StyleSheet, TouchableOpacity, AppState } from "react-native";
import { Link, Redirect } from 'expo-router';
import { useUserContext } from "@/contexts/userContext";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import { useEffect } from "react";
import { supabase } from "@/libs/initSupabase";
import NotAuthStack from "./(notAuth)/_layout";
import AuthNav from "./(auth)/_layout";
import { NavigationContainer } from "@react-navigation/native";
import Main from "./(auth)/main";
import SignInScreen from "./(notAuth)/SignIn";

AppState.addEventListener('change', (state) => {
    if(state === 'active') {
        supabase.auth.startAutoRefresh();
    }else{
        supabase.auth.stopAutoRefresh();
    }
});
export default function Index() {

  const { profile, session, loading } = useUserContext();
  const router = useRouter();

  if(loading) return (
     <>
       <Text>Loading...</Text>
       <Text>Loading...</Text>
       <Text>Loading...</Text>
       <Text>Loading...</Text>
       <Text>Loading...</Text>
       <Text>Loading...</Text>
     </>
   );
 
   return (
   <>
    {!session ? <SignInScreen/>: <Main/> }
   </>
  //  return (
  //  <>
  //   {!session ? <NotAuthStack/>: <AuthNav/> }
  //  </>
  );
   return router.replace(session ? '/(auth)/main' : '/(notAuth)/SignIn');
   return(
    <>
      {!session ?
        // <>
        // <Text>NO SESSION</Text>
        // <Text>NO SESSION</Text>
        // <Text>NO SESSION</Text>
        // <Text>NO SESSION</Text>
        // <Text>NO SESSION</Text>
        // <Text>NO SESSION</Text>
        // <Text>NO SESSION</Text>
        // </>
        // <NotAuthStack/>
        <Redirect href="/(notAuth)/SignIn"/>
        :
        // <AuthNav/>
        <Redirect href="/(auth)/main"/>
      }
    </>
  )
  //  if(!session){
  //    return <Redirect href="/(notAuth)/SignIn"/>;
  //  }
 
  //  return <Redirect href="/(auth)/main"/>
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
