import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from '@/contexts/userContext';
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/libs/initSupabase';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import AudioWaves from '@/components/conversations/audioWaves';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';


  
const UniversarlAudioPlayer = (props: any) => {

    let backgroundColor,textColor;
    const MESSAGE_HEIGHT = 50;
    backgroundColor = "#BABABA";
    textColor= "black";
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


    const player = useAudioPlayer(props.url);
    const status = useAudioPlayerStatus(player);

    const isPlaying = status?.playing ?? false;
    const position = Math.floor((status?.currentTime ?? 0)* 1000);
    const duration = Math.floor((status?.duration ?? 0) * 1000);

    useEffect(() => {
        if(!status) return;

        if(status.didJustFinish){
            player.seekTo(0);
            player.pause();
        }

    }, [status?.didJustFinish])

    const PlayAudio = async () => {
        if (!player) return;

        if (player.playing) {
            await player.pause();
        } else {
            await player.play();
        }
    };

    return(
        <Box style={{}}>
            <HStack style={[styles.audioBox,{paddingHorizontal:5}]}>
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
                    </Text>
                    :
                    <Text style={[styles.elemColor, styles.textElem]}>
                        0:{Math.floor(position / 1000).toString().padStart(2, '0')}
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

export default UniversarlAudioPlayer;


