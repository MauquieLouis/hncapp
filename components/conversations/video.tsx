import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { Button, ButtonText } from '@/components/ui/button';

const VideoPlayer: React.FC = (props: any) => {

    const videoSource = props.uri;

    const player = useVideoPlayer(videoSource, player => {
        player.loop=true;
        if(props.startVideo && props.startVideo == true){
            player.play();
        }
    });

    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing});

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            width:"100%",
            height:'100%',
        },
        video: {
            width: props.width,
            height: props.height,
            borderRadius:props.borderRadius
        },
        controlsContainer: {
            padding: 10,
        },
    });
    
    return (
        <View style={styles.container}>
            <VideoView style={styles.video} player={player} allowsPictureInPicture contentFit={props.resizeMode}/>
            {/* <View style={styles.controlsContainer}>
                <Button onPress={() => {if(isPlaying){player.pause()}else{player.play()}}}>
                    <ButtonText>{isPlaying ? 'Pause' : 'Play'}</ButtonText>
                </Button>
            </View> */}
        </View>
    );
};


export default memo(VideoPlayer);