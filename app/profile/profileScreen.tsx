import React, { View, StyleSheet, Text } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useUserContext } from '@/contexts/userContext';
import { useEffect } from 'react';
import { Box } from '@/components/ui/box';
import Avatar from '@/components/profile/avatar';
import { HStack } from '@/components/ui/hstack';

export default function ProfileScreen() {

    const { profile } = useUserContext();

    useEffect(() => {
        console.log("User Profile: ", profile);
    }, []);

  return (
    <>
      <Box style={[styles.container, {/*borderColor:"blue", borderWidth:1*/}]}>

        <Box style={{/*borderColor:"red", borderWidth:1,*/ flex:3, alignItems:"center", justifyContent:"center"}}>
          <HStack >
            <Box style={{/*borderColor:"orange", borderWidth:1,*/ justifyContent:"flex-end", flex:3, alignItems:"center"}}>
              <Text style={{color:"white"}}> 17</Text>
              <Text style={{color:"white"}}> FRIENDS</Text>
            </Box>
            <Box style={{/*borderColor:"orange", borderWidth:1,*/ flex:4, alignItems:"center", justifyContent:"center"}}>
              <Avatar/>
            </Box>
            <Box style={{/*borderColor:"orange", borderWidth:1,*/ justifyContent:"flex-end", flex:3, alignItems:"center"}}>
              <Text style={{color:"white"}}>131</Text>
              <Text style={{color:"white"}}>FOLLOWERS</Text>
            </Box>
          </HStack>
          <Box style={{/*borderColor:"cyan", borderWidth:1*/}}>
            <Text style={{color:"white", fontSize:22}}>{profile ? profile.username: "..."}</Text>
          </Box>
          <Box style={{borderBottomColor:"white", borderBottomWidth:1, width:"340"}}></Box>
        </Box>
        <Box style={{/*borderColor:"green", borderWidth:1,*/ flex:7}}>
          <Link href="/" style={styles.button}>
          {/* <Link href="/conversations/conversationsList" style={styles.button}> */}
            Go back to index!
          </Link>

        </Box>
      </Box>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
  },

  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
});
