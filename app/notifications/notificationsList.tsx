import { useState } from 'react';
import React, { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { Link, Stack, useRouter } from 'expo-router';
import { useUserContext } from '@/contexts/userContext';
import { useEffect } from 'react';
import { Box } from '@/components/ui/box';
import Avatar from '@/components/profile/avatar';
import { HStack } from '@/components/ui/hstack';
import { supabase } from '@/libs/initSupabase';
import { Spinner } from '@/components/ui/spinner';

export default function NotificationsList() {

  
  const [ notificationsList, setNotificationsList ] = useState<any[]>([]);
  const [ loading, setLoading ] = useState<boolean>(false);

  const router = useRouter();
  const { profile } = useUserContext();

  useEffect(() => {
      console.log("Notifs List: ", profile);
      getAllNotifications();
  }, []);

  const getAllNotifications = async () => {
    try{
        setLoading(true);
        const { data: notifications, error: notifications_error } = await supabase.from("notifications").select("*").eq("recipient_id", profile.user_id);
        if(notifications_error){
          console.error("Error whent fetching notifications in getAllNotifications Function in notificationsList.tsx :", notifications_error);
        }
        if(notifications){
          console.log("Notifications: ", notifications);
          setNotificationsList(notifications);
        }
    }catch(error: unknown){
        console.error("Error in getAllNotifications in notificationsList.tsx :", error);
    }finally{
        setLoading(false);
    }
  }

  return (
    <>
      <Box style={[styles.container, {/*borderColor:"blue", borderWidth:1*/}]}>

        <Box style={{/*borderColor:"green", borderWidth:1,*/ flex:10, width:"100%"}}>
          {loading ? <Spinner/> :
          <FlatList
          data={notificationsList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => router.push(`/profile/${item.user_id}`)}
              style={{/*borderColor:"red", borderWidth:1,*/ flexDirection:"row", alignItems:"center", justifyContent:"flex-start", padding:10, borderBottomColor:"white", borderBottomWidth:1, width:"90%", marginLeft:"5%"}}>
                <Avatar/>
                <Text style={{color:"white", paddingLeft:15, fontSize:20}}>
                  {item.id} - {item.actor_id} - {item.type}
                </Text>
              </TouchableOpacity>
            )}
            />
          }
        </Box>
        <Box style={{/*borderColor:"red", borderWidth:1,*/ flex:1, alignItems:"center", justifyContent:"center"}}>
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
