import React, { StyleSheet, TouchableOpacity } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from '@/contexts/userContext';
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/libs/initSupabase';
import { useAudio } from '@/contexts/audioContext';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import AudioWaves from './audioWaves';
import { Center } from '../ui/center';


  
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
    const soundRef = useRef(new Audio.Sound());

    useEffect(() => {
        return sound 
        ? () => {
            sound.unloadAsync(); 
        }
        : undefined;
    }, [sound]);
    
    useEffect(() => {
        getAttachmentsUrlsAndLoad();
    }, []);

    useEffect(() => {
        if(position >= duration){
            //Reset sound to 0 second.
            soundRef.current.setPositionAsync(0);
            //Not play the sound after reseting it.
            soundRef.current.pauseAsync();
            setIsPlaying(false);
            setPosition(0);
        }
    }, [position])

    const progress = useSharedValue(0);
    useEffect(() => {
        if (duration > 0) {
          progress.value = withTiming((position / duration) * 100, { duration: 100 });
        }
      }, [position]);

    const getAttachmentsUrlsAndLoad = async () => {
            try{
                setLoadingUrl(true);

                let signedUrl;
                if(item.attachments[0]?.local_path){
                    //OFFLINE AUDIO
                    signedUrl = item.attachments[0].local_path;
                    setAttachmentsUrl(signedUrl);
                    loadAudio(signedUrl);
                }else{
                    //ONLINE AUDIO 
                    const url = item.attachments[0].url;
                    const { data, error } = await supabase.storage.from('Conversations').createSignedUrls(url, 5400);
                    if(error){
                        console.error("Error in AudioPlayer when creatingSignedUrls function in components/audipPlayer.tsx file :", error);
                    }
                    if(data){
                        signedUrl = data.map((signedURL) => signedURL.signedUrl)
                        setAttachmentsUrl(signedUrl[0]);
                        loadAudio(signedUrl[0]);
                    }
                }
                // const urls = item.attachments.map((attachment: { url: string }) => attachment.url);
                // const isPlayingGlobal = currentUrl === signedUrls[0];

            }catch(error: unknown){
                console.error("Error in AudioPlayer function in components/AudioPlayer.tsx file :", error);
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
        soundRef.current = newSound;
        setSound(newSound);
        setIsPlaying(false);
    
        // Listen for playback status
        newSound.setOnPlaybackStatusUpdate(async() => {
        const status = await newSound.getStatusAsync();

        if (status.isLoaded) {
        setDuration(status.durationMillis ?? 0);
        setPosition(status.positionMillis);
        if (status.didJustFinish) {
            setIsPlaying(false); // Reset when finished
            setSound(null);
        }
        }
        });
    };

    const PlayAudio = async() => {
        if (!sound) return; 
        // setIsPlayingGlobal(currentUrl === attachmentUrl)
        // If already playing, pause it
        if (isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
        } else {
            await sound.playAsync();
            setIsPlaying(true);
        }
        // playNewSound(sound, attachmentUrl);
    };

    let backgroundColor,textColor;
    const MESSAGE_HEIGHT = 50;
    if(props.item.sender_id == user.id){
        backgroundColor = "blue";
        textColor= "white";
    }else{
        backgroundColor = "#BABABA";
        textColor= "black";
    }
    const styles = StyleSheet.create({
        audioBox: {
           backgroundColor:backgroundColor,
           // justifyContent: "right",
           alignItems: "flex-end",
           width:'100%',
           padding:2,
           borderRadius:15,
           margin:1,
           elevation: 5,
        },
        elemColor:{
            color: textColor
        },
        textElem:{
            padding:3
        },
        centeredElem:{
            height: MESSAGE_HEIGHT,
            justifyContent: "center",
            alignItems: "center",
            paddingRight:3
       },
       timingBox:{
        minWidth:40,
        maxWidth:40
       }
       });

    return(
        <Box style={{}}>
            <HStack reversed={item.sender_id == user.id ? true : false} style={[styles.audioBox,{paddingHorizontal:5}]}>
                <Box style={[styles.centeredElem, {}]}>
                    <AudioWaves 
                        svgWidth={140} 
                        svgHeight={MESSAGE_HEIGHT} 
                        waveformHeight={30}
                        yStart={10} 
                        rectWidth={4} 
                        wavesNumber={16} 
                        isAnimating={!isPlaying} />
                </Box>
                <Box style={[styles.centeredElem, styles.timingBox]}>
                    {   position == 0 ? 
                    <Text style={[styles.elemColor, styles.textElem]}>
                        0:{Math.floor(duration / 1000) < 10 ? "0"+ Math.floor(duration / 1000):Math.floor(duration / 1000)}
                        {/* {Math.floor(position / 1000)}:{Math.floor(duration / 1000)} */}
                    </Text>
                    
                    :
                    <Text style={[styles.elemColor, styles.textElem]}>
                        0:{Math.floor(position / 1000) < 10 ? "0"+ Math.floor(position / 1000):Math.floor(position / 1000)}
                    </Text>

                    }
                </Box>
                <Box style={styles.centeredElem}>
                    <TouchableOpacity onPress={PlayAudio} style={{ marginRight: 0}}>
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color={styles.elemColor.color} />
                    </TouchableOpacity>
                </Box>
            </HStack>
        </Box>
    )

}

export default AudioPlayer;


