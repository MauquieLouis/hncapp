import React, { useEffect, useState } from 'react';
import { StyleSheet, Button, View, Image, Text } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';

const VideoThumbNail: React.FC = (props: any) => {
  const [image, setImage] = useState<string | null>(null);

  const generateThumbnail = async () => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        props.uri,
        {
          time: 0,
        }
      );
      setImage(uri);
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    generateThumbnail();
  },[])

  const styles = StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      width: props.width,
      height: props.height,
      borderRadius: props.borderRadius,
      elevation: 5,
    },
    image: {
      borderRadius: props.borderRadius,
      width: "100%",
      height: "100%",
    },
  });
  return (
    <View style={styles.container}>
      {image && <Image source={{ uri: image }} style={styles.image} />}
    </View>
  );
}


export default VideoThumbNail;

