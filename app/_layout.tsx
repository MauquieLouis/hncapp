import { Stack } from "expo-router";
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { StatusBar } from 'expo-status-bar';
import { UserContextProvider, useUserContext } from "../contexts/userContext";
import Auth from "./auth/Login";
import { Text } from "react-native";

const MainStack = () => {

  const { session, loading } = useUserContext();
  console.log("SESSION:");

  return (
    <>
    {loading ? 
    <Text>LOADING !!</Text>: 
      <>
      {session ?
        <>
        <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" />
        </> 
        :
        <Auth/>
      }
      </>
    }
    </>
  );
}

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="light">
      <UserContextProvider props={undefined}>
        <MainStack/>
      </UserContextProvider>
    </GluestackUIProvider>
  );
}
