import React from "react";
import { Text } from "@/components/ui/text";
import { ScrollView } from "react-native";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";

const Tab2 = (props: any) => {

    const onScroll = useAnimatedScrollHandler({
        onScroll: (event: any) => {
            const y = event.contentOffset.y
            //Le 60 il est complètement arbitraire, à affiner ... TODO
            if(y > props.headerHeight - 60 && props.headerVisible.value === 1){
                props.headerVisible.value = 0
            }else if(y <= 0 && props.headerVisible.value === 0 ) {
                props.headerVisible.value = 1
            }
        },
    })

    return(
        <Animated.ScrollView
            contentContainerStyle={{padding:0}} scrollEventThrottle={16}
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