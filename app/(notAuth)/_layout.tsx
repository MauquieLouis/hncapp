import React from "react";
import{ AppState } from "react-native";
import { Stack } from "expo-router";
import { supabase } from "@/libs/initSupabase";
import { SignupProvider } from "@/contexts/signUpContext";

const NotAuthStack = () => {

  return (
    <SignupProvider>
      <Stack>
        <Stack.Screen name="SignIn" options={{ headerShown: false }}/>
        <Stack.Screen name="signupSteps/SignUpStep1Email" options={{ headerShown: true, title: 'Email Or Phone' }}/>
        <Stack.Screen name="signupSteps/SignUpStep2Username" options={{ headerShown: true, title: 'Username' }}/>
        <Stack.Screen name="signupSteps/SignUpStep3Name" options={{ headerShown: true, title: 'FirstName and LastName' }}/>
        <Stack.Screen name="signupSteps/SignUpStep4Birthday" options={{ headerShown: true, title: 'Birthday' }}/>
        <Stack.Screen name="signupSteps/SignUpStep5Gender" options={{ headerShown: true, title: 'Gender' }}/>
        <Stack.Screen name="signupSteps/SignUpStep6Country" options={{ headerShown: true, title: 'Country' }}/>
        <Stack.Screen name="signupSteps/SignUpStep7Password" options={{ headerShown: true, title: 'Password' }}/>
        <Stack.Screen name="signupSteps/SignUpSummary" options={{ headerShown: true, title: 'Summary' }}/>
      </Stack>
    </SignupProvider>
  );
}

export default NotAuthStack;