import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRelativeTime } from "@/components/date/format";
import { useUserContext } from "@/contexts/userContext";
import Svg, { Circle } from "react-native-svg";
import { Center } from "@/components/ui/center";
import { Ionicons } from "@expo/vector-icons";

const ConversationListItem = (props: any) => {

    const item = props.item;
    const router = useRouter();
    const relative = useRelativeTime(item.last_message.created_at);
    const { theme } = useUserContext();

    const styles = StyleSheet.create({
        container:{
            backgroundColor:theme.backgroundColor1,
            height:"100%"
        },
        boxStyle:{
            borderBottomWidth:1,
            borderBottomColor:theme.dividerColor,
            width:"90%",
            marginLeft:"5%",
            paddingVertical:10
        },
        nameText:{
            color:theme.textColor2,
            fontWeight:"700",
            paddingBottom:3,
        },
        messageText:{
            color:theme.textColor1
        },
        dateColor:{
            color:theme.textColor1,
            fontWeight:"300"
        }
    });

    console.log("ITEM ELEM :",item);

    return(
        <Box>
            <Pressable onPress={() => {
                router.push(`/conversations/${item.conversation_id}`)
            }} style={styles.boxStyle}>
                <HStack space="sm" >
                    <Box>
                    <View
                        style={{
                            width: 50,
                            height: 50,
                            borderRadius: 50,
                            backgroundColor: 'grey',
                        }}
                    />
                    </Box>
                        <VStack>
                            <Text style={styles.nameText}>{item.conversation_name}</Text>
                            <HStack space="sm">
                                {item.last_message.type == 'text' ? 
                                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.messageText}>{item.last_message.content}</Text>
                                :<>
                                    {item.last_message.type == 'audio' ?
                                        <Ionicons name="mic" color={theme.iconColor} size={20}/>
                                        :
                                        <Ionicons name="images" color={theme.iconColor} size={20}/>
                                    }
                                </>}
                                <Center style={{paddingTop:4, paddingLeft:7}}>
                                    <Svg
                                        width={8}
                                        height={8}
                                        viewBox={`0 0 ${6} ${6}`}
                                        >
                                        <Circle
                                            cx={2}
                                            cy={2}
                                            r={2 - 1 / 2}
                                            fill={theme.iconColor}
                                            stroke={theme.iconColor}
                                            strokeWidth={1}
                                        />
                                    </Svg>
                                </Center>

                                <Text style={styles.dateColor}>{relative}</Text>
                            </HStack>
                        </VStack>
                </HStack>
            </Pressable>
        </Box>
    )
}

export default ConversationListItem;