import React, { useCallback, useEffect, useRef } from "react";
import { Text } from "@/components/ui/text";
import { ScrollView } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useIsFocused, useFocusEffect, useNavigation } from '@react-navigation/native'

const Tab2 = (props: any) => {

    const scrollRef = useRef(null)
    const scrollY = useSharedValue(0)
    // const isFocused = useIsFocused()
    

    const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y

      // if (scrollY.value > 0 && props.headerVisible.value === 1) {
      //   props.headerVisible.value = 0
      // } else if (scrollY.value <= 0 && props.headerVisible.value === 0) {
      //   props.headerVisible.value = 1
      // }
    },
    onBeginDrag: () => {
      props.isScrolling.value = true;
    },
    onEndDrag: () => {
      props.isScrolling.value = false;
    },
    onMomentumEnd: () => {
      if (scrollY.value > 0 && props.headerVisible.value === 1) {
        props.headerVisible.value = 0
      } else if (scrollY.value <= 0 && props.headerVisible.value === 0) {
        props.headerVisible.value = 1
      }
      props.isScrolling.value = false;
    },
  })

  //   useEffect(() => {
  //   if (isFocused) {
  //     // si la liste est déjà en haut, on réaffiche le header
  //     scrollRef.current?.scrollToOffset
  //       ? scrollRef.current.scrollToOffset({ offset: 0, animated: false })
  //       : null

  //     // et surtout, on met à jour le header
  //     if (scrollY.value <= 0) {
  //       props.headerVisible.value = 1
  //     }
  //   }
  // }, [isFocused]);
    // useEffect(() => {
    //   if (isFocused) {
    //     if (scrollY.value > 0) {
    //       props.headerVisible.value = 0
    //     } else {
    //       props.headerVisible.value = 1
    //     }
    //   }
    // }, [isFocused]);
    useFocusEffect(
      useCallback(() => {
        if (scrollY.value > 0) {
          props.headerVisible.value = 0
        } else {
          props.headerVisible.value = 1
        }
      }, [])
    );

    // const navigation = useNavigation();
    
    // useEffect(() => {
    //   const unsubscribeFocus = navigation.addListener('focus', () => {
    //       // 🟢 Tab devient actif
    //     setTimeout(()=> {

    //       if (scrollY.value > 0) {
    //           props.headerVisible.value = 0
    //       } else {
    //           props.headerVisible.value = 1
    //       }
    //     },2000);
    //   });
    //   const unsubscribeBlur = navigation.addListener('blur', () => {
    //       // 🔴 Tab perd le focus
    //   });
      
    //   return () => {
    //   unsubscribeFocus();
    //   unsubscribeBlur();
    // };
    // }, [navigation]);

    return(
        <Animated.ScrollView
            ref={scrollRef}
            contentContainerStyle={{padding:0}} 
            scrollEventThrottle={16}
            onScroll={onScroll}
        >
           {Array.from({ length: 150 }).map((_, i) => (
            <Text key={i} style={{color:"blue"}}>
              Inner item {i + 1}
            </Text>
          ))}
        </Animated.ScrollView>
    )

}

export default Tab2;