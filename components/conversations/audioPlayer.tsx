import React, { StyleSheet, TouchableOpacity } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from '@/contexts/userContext';
import { Audio } from "expo-av";
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/libs/initSupabase';
import { useAudio } from '@/contexts/audioContext';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import AudioWaves from './audioWaves';


  
const AudioPlayer = (props: any) => {
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [ attachmentUrl, setAttachmentsUrl ] = useState('');
    const [ loadingUrl, setLoadingUrl ] = useState(false);

    // const { playNewSound, currentUrl } = useAudio();
    const { user } = useUserContext();
    const item = props.item;

    useEffect(() => {
        return sound 
        ? () => {
            sound.unloadAsync(); 
        }
        : undefined;
    }, [sound]);
    
    let widthS, wavesS; 
    useEffect(() => {
        getAttachmentsUrlsAndLoad();
        
    }, []);

    useEffect(() => {
        if(position >= duration){
            setIsPlaying(false);
            setPosition(0);
            setSound(null);
            loadAudio(attachmentUrl);
        }
    }, [position])

    const progress = useSharedValue(0);
    useEffect(() => {
        if (duration > 0) {
          progress.value = withTiming((position / duration) * 100, { duration: 100 });
        }
      }, [position, duration]);

    const getAttachmentsUrlsAndLoad = async () => {
            try{
                setLoadingUrl(true);
                const urls = item.attachments.map((attachment: { url: any; }) => attachment.url);
                const { data, error } = await supabase.storage.from('Conversations').createSignedUrls(urls, 5400);
                if(error){
                    console.log("Error in ImageDisplay when creatingSignedUrls function in components/attachment.tsx file :", error);
                }
                const signedUrls = data?.map((signedURL) => signedURL.signedUrl)
                setAttachmentsUrl(signedUrls[0]);
                loadAudio(signedUrls[0]);
                // const isPlayingGlobal = currentUrl === signedUrls[0];

            }catch(error: unknown){
                console.log("Error in ImageDisplay function in components/attachment.tsx file :", error);
            }finally{
                setLoadingUrl(false);
            }
        }

    const loadAudio = async (url: string) => {
        // Load sound from URL
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: false }
        );
    
        setSound(newSound);
        setIsPlaying(false);
    
        // Listen for playback status
        newSound.setOnPlaybackStatusUpdate(async() => {
            const status = await newSound.getStatusAsync();

          if (status.isLoaded) {
            setDuration(status.durationMillis ?? 0);
            setPosition(status.positionMillis);
            if (status.didJustFinish) {
                console.log("sound supposed to finish")
              setIsPlaying(false); // Reset when finished
              setSound(null);
            }
          }
        });
    };

    const PlayAudio = async() => {
        if (sound) {
            // setIsPlayingGlobal(currentUrl === attachmentUrl)
            // If already playing, pause it
            if (isPlaying) {
                await sound.pauseAsync();
                setIsPlaying(false);
            } else {
                await sound.playAsync();
                // setIsAnimating(true);
                // setIsAnimating(false);
                setIsPlaying(true);
            }
            // playNewSound(sound, attachmentUrl);
            return;
          }
    }

    const calculateWidthAndWave = () => {
        if(duration){

            if(Math.floor(duration / 1000) < 5){
                return { width:80, waves:5 };
            }else if (Math.floor(duration / 1000) >= 5 && Math.floor(duration / 1000) < 12 ){
                return { width:80, waves:8 };
            }else if (Math.floor(duration / 1000) >= 12 && Math.floor(duration / 1000) < 21 ){
                return { width:120, waves:12 };
            }else {
                return { width:170, waves:17 };
            }
        }else{
            return { width: 150, waves:12};
        }
    }

    return(
        <Box>
            <HStack reversed={item.sender_id == user.id ? true : false} style={[styles.audioBox,{paddingHorizontal:5}]}>
                <Box>
                    <AudioWaves 
                        svgWidth={160} 
                        svgHeight={50} 
                        waveformHeight={30} 
                        rectWidth={4} 
                        wavesNumber={18} 
                        isAnimating={!isPlaying} />
                </Box>
                <Box>
                    <Text>
                        {Math.floor(position / 1000)} / {Math.floor(duration / 1000)} sec
                    </Text>
                </Box>
                <Box>
                    <TouchableOpacity onPress={PlayAudio} style={{ marginRight: 10 }}>
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="black" />
                    </TouchableOpacity>
                </Box>
            </HStack>
        </Box>
    )

}

export default AudioPlayer;

const styles = StyleSheet.create({
 audioBox: {
    // justifyContent: "right",
    alignItems: "flex-end",
    width:'100%',
    padding:13,
    borderRadius:15,
    margin:1,
    elevation: 5,
}
});
