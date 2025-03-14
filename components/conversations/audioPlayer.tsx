import React, { StyleSheet, TouchableOpacity } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from '@/contexts/userContext';
import { Audio } from "expo-av";
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/libs/initSupabase';


const AudioPlayer = (props: any) => {
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [ attachmentUrl, setAttachmentsUrl ] = useState('');
    const [ loadingUrl, setLoadingUrl ] = useState(false);


    const { user } = useUserContext();
    const item = props.item;

    useEffect(() => {
        getAttachmentsUrls();
        return sound 
        ? () => {
            sound.unloadAsync(); 
        }
        : undefined;
    }, [sound]);

    // async function playSound() {
    //     console.log("LOADING SOUND");
    //     const { sound } = await Audio.Sound.createAsync({ uri: "dd" })
    // }
    const getAttachmentsUrls = async () => {
            try{
                setLoadingUrl(true);
                const urls = item.attachments.map((attachment: { url: any; }) => attachment.url);
                const { data, error } = await supabase.storage.from('Conversations').createSignedUrls(urls, 5400);
                if(error){
                    console.log("Error in ImageDisplay when creatingSignedUrls function in components/attachment.tsx file :", error);
                }
                const signedUrls = data?.map((signedURL) => signedURL.signedUrl)
                console.log("SIGNEDURLS:", signedUrls);
                setAttachmentsUrl(signedUrls[0]);
    
            }catch(error: unknown){
                console.log("Error in ImageDisplay function in components/attachment.tsx file :", error);
            }finally{
                setLoadingUrl(false);
            }
        }

    const loadAndPlayAudio = async () => {
        
        if (sound) {
          // If already playing, pause it
          if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
          return;
        }
    
        // Load sound from URL
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: attachmentUrl },
        //   { shouldPlay: true }
        );
    
        setSound(newSound);
        setIsPlaying(true);
        const status = await newSound.getStatusAsync();
    
        // Listen for playback status
        newSound.setOnPlaybackStatusUpdate(async() => {
            const status = await newSound.getStatusAsync();

          if (status.isLoaded) {
            setDuration(status.durationMillis ?? 0);
            setPosition(status.positionMillis);
            if (status.didJustFinish) {
              setIsPlaying(false); // Reset when finished
            }
          }
        });
      };

    
    return(
        <Box>
            <HStack reversed={item.sender_id == user.id ? true : false} style={[styles.audioBox,{paddingHorizontal:5}]}>
                <Box>
                    <Text>AUDIO HERE</Text>
                </Box>
                <Box>
                    <TouchableOpacity onPress={loadAndPlayAudio} style={{ marginRight: 10 }}>
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="black" />
                    </TouchableOpacity>
                    <Text>
                        {Math.floor(position / 1000)} / {Math.floor(duration / 1000)} sec
                    </Text>
                </Box>
                <Box>
                    <Text>Icon - </Text>
                </Box>
            </HStack>
        </Box>
    )

}

export default AudioPlayer;

const styles = StyleSheet.create({
 audioBox: {
    justifyContent: "right",
    alignItems: "flex-end",
    width:'100%',
    padding:13,
    borderRadius:15,
    margin:1,
    elevation: 5,
}
});
