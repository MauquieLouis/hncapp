import React, { useCallback, useEffect, useRef } from "react";
import { Text } from "@/components/ui/text";
import { ScrollView } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useIsFocused, useFocusEffect, useNavigation } from '@react-navigation/native'

const Tab2 = (props: any) => {

    const scrollRef = useRef(null)
    const scrollY = useSharedValue(0)

    const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
    onBeginDrag: () => {
      props.isScrolling.value = true;
    },
    onEndDrag: () => {
      props.isScrolling.value = false;
      if (scrollY.value > 0 && props.headerVisible.value === 1) {
        props.headerVisible.value = 0
      } else if (scrollY.value <= 0 && props.headerVisible.value === 0) {
        props.headerVisible.value = 1
      }
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

    useFocusEffect(
      useCallback(() => {
        if (scrollY.value > 0) {
          props.headerVisible.value = 0
        } else {
          props.headerVisible.value = 1
        }
      }, [])
    );

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
