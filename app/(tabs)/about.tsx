import AudioWaves from '@/components/conversations/audioWaves';
import {  useState } from 'react';
import React, { View, StyleSheet, Button } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Svg, Rect } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const WAVEFORM_HEIGHT = 50;

const generateFakeWaveform = (numPoints = 100) => {
  return Array.from({ length: numPoints }, () => Math.random() * WAVEFORM_HEIGHT);
};

// const generateSinusoidalWaveform = (numPoints = 100) => {
//   return Array.from({ length: numPoints }, (_, index) => {
//     const angle = (index / numPoints) * Math.PI * 2; // Map index to angle in range [0, 2π]
//     const height = Math.sin(angle) * (WAVEFORM_HEIGHT / 2) + (WAVEFORM_HEIGHT / 2); // Scale and shift sine wave
//     return height;
//   });
// };

export default function AboutScreen() {

    const [isAnimating, setIsAnimating] = useState(false);

    const waveform = generateFakeWaveform( 20 );

    const color = useSharedValue('#FF0000');
    console.log("WAVEFORM :",waveform);
    const heightValues = waveform.map((item,index) => useSharedValue(-item));
    const animatedProps = heightValues.map((height, index) =>
      useAnimatedProps(() => {
        return {
          height: height.value,
          fill: color.value,
        };
      })
    );
  
    
    const colorTables = ['#00FF00', '#FF0000', '#0000FF', '#FF00FF', '#FFFF00', '#00FFFF']
    const minDuration = 300;
    const maxDuration = 600;

    const generateUniqueHeightSequence = (minDuration: number, maxDuration: number, waveformHeight: number) => {
      // Generate a unique sequence of animations for each rectangle
      return withSequence(
        withTiming(-Math.random() * waveformHeight, {
          duration: Math.random() * (maxDuration - minDuration) + minDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-Math.random() * waveformHeight, {
          duration: Math.random() * (maxDuration - minDuration) + minDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-Math.random() * waveformHeight, {
          duration: Math.random() * (maxDuration - minDuration) + minDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(-Math.random() * waveformHeight, {
          duration: Math.random() * (maxDuration - minDuration) + minDuration,
          easing: Easing.inOut(Easing.ease),
        })
      );
    };

    const generateUniqueColorSequence = (minDuration: number, maxDuration: number) => {
      //Color Sequence
      return withSequence(
        withTiming(colorTables[Math.floor(Math.random()*colorTables.length)], {
          duration: Math.random()*(maxDuration-minDuration)+minDuration,
          easing: Easing.inOut(Easing.ease),
        }), 
        withTiming(colorTables[Math.floor(Math.random()*colorTables.length)], {
          duration: Math.random()*(maxDuration-minDuration)+minDuration,
          easing: Easing.inOut(Easing.ease),
        }), 
        withTiming(colorTables[Math.floor(Math.random()*colorTables.length)], {
          duration: Math.random()*(maxDuration-minDuration)+minDuration,
          easing: Easing.inOut(Easing.ease),
        }), 
        withTiming(colorTables[Math.floor(Math.random()*colorTables.length)], {
          duration: Math.random()*(maxDuration-minDuration)+minDuration,
          easing: Easing.inOut(Easing.ease),
        })
      );
    }

    
    const startAnimation = () => {
      heightValues.forEach((height) => {
        height.value = withRepeat(generateUniqueHeightSequence(minDuration, maxDuration, WAVEFORM_HEIGHT), Infinity, true);
      });
      color.value = withRepeat(
        generateUniqueColorSequence(minDuration, maxDuration),
      Infinity, true);
    };

    const stopAnimation = () => {
      heightValues.forEach((height) => {
        cancelAnimation(height);
      });
      cancelAnimation(color);
    };


    const toggleAnimation = () => {
      if (isAnimating) {
        stopAnimation();
      } else {
        startAnimation();
      }
      setIsAnimating(!isAnimating);
    };

    const SVG_WIDTH = 200
    const RECT_WIDTH = 4
    return (
      <>
        <Button title={isAnimating ? "Stop Animation" : "Start Animation"} onPress={toggleAnimation} />
        <AudioWaves svgWidth={200} svgHeight={50} waveformHeight={40} rectWidth={4} wavesNumber={20} isAnimating={!isAnimating}/>
      </>
      
      // <View style={styles.container}>
      //   {/* <Svg height="300" width="300">
      //     <AnimatedRect animatedProps={animatedProps} width="100" x="100" y="50" />
      //   </Svg> */}
      //   <View style={{width:SVG_WIDTH, height:100, borderColor:"cyan", borderWidth:1}}>
      //     <Svg width={SVG_WIDTH} height={100} style={{borderWidth:1, borderColor:"cyan"}}>
      //       {waveform.map((item, index) => {
      //         // const space= (SVG_WIDTH - (RECT_WIDTH * waveform.length)) / waveform.length
      //         const space= (SVG_WIDTH / waveform.length)- RECT_WIDTH
      //         console.log("SPACE : space", space);
      //         return <AnimatedRect
      //         key={index}
      //         animatedProps={animatedProps[index]}    
      //         x={index*(space+RECT_WIDTH)} 
      //         y="98" 
      //         width={RECT_WIDTH} 
      //         />
      //       })}
      //     </Svg>
      //   </View>
      // </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor:"red",borderWidth:1
  },
  text: {
    color: '#fff',
  },
});
