import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRelativeTime } from "@/components/date/format";
import { useUserContext } from "@/contexts/userContext";
import Svg, { Circle } from "react-native-svg";
import { Center } from "@/components/ui/center";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "@/components/profile/avatar";

const ConversationListItem = (props: any) => {

    const item = props.item;

    const [ textToDisplay, setTextToDisplay ] = useState(item.last_message.content);
    const [ isRead, setIsRead ] = useState(true);
    const [hasReadUsers, setHasReadUsers] = useState(item.has_read ?? []);
    // const [ has_read, setHasRead ] = useState(item.participant)

    const extractHasReadParticipants = (item: any) => {
        if (!item || !item.participants) return [];

        return item.participants
            .filter((p: { has_read: boolean; }) => p.has_read === true)
            .map((p: { user_id: any; username: any; profile_picture_url: any; firstname: any; lastname: any; }) => ({
            user_id: p.user_id,
            username: p.username,
            profile_picture_url: p.profile_picture_url,
            firstname: p.firstname,
            lastname: p.lastname,
        }));
    }

    useEffect(() => {
        // console.log("ITEM",item);
        setTextToDisplay(truncateText(item.last_message.content));
        setIsRead(item.last_message.is_read);
        console.log("ITEM HERE :", item)
        setHasReadUsers(extractHasReadParticipants(item) ?? []);
    },[item])

    useEffect(() => {
        console.log("HAS READ USER :", hasReadUsers);
    }, [hasReadUsers])

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
            paddingVertical:10,
            position:"relative"
        },
        nameText:{
            color:theme.textColor2,
            fontWeight:"700",
            paddingBottom:3,
        },
        messageText:{
            color:theme.textColor1,
            flexShrink:1
        },
        dateColor:{
            color:theme.textColor1,
            fontWeight:"300"
        },
        attachmentText:{
            color:theme.textColor2,
            fontWeight:"300",
        },
        messageTextUnRead:{
            color:theme.textColor1,
            fontWeight:800,
            flexShrink:1
        }
    });

    // console.log("ITEM ELEM :",item);

    const truncateText = (text: string, maxLength = 25) => {
        if (!text) return "";
        return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
    };


    const renderHasReadAvatars = () => {
        // if (!hasReadUsers || hasReadUsers.length === 0) return null;
        // console.log("HAS READ USER :",hasReadUsers);

        const maxToShow = hasReadUsers.slice(0, 4);

        return (
            <HStack space="xs" style={{ position: "absolute", right: 0, bottom: 0 }}>
                {maxToShow.map((u) => (
                    <Avatar
                        key={u.user_id}
                        user_id={u.user_id}
                        width={16}
                        height={16}
                    />
                ))}

                {hasReadUsers.length > 4 && (
                    <Text style={{ fontSize: 10, marginLeft: 3, color: theme.textColor2 }}>
                        +{hasReadUsers.length - 4}
                    </Text>
                )}
            </HStack>
        );
    };

    return(
        <Box>
            <Pressable onPress={() => {
                router.push(`/conversations/${item.conversation_id}`)
            }} style={styles.boxStyle}>
                <HStack space="sm" >
                    <Box>
                    <Avatar user_id={item.profile_to_display.user_id} width={50} height={50}/>
                    </Box>
                        <VStack>
                            <Text style={styles.nameText}>{item.conversation_name}</Text>
                            <HStack space="sm">
                                {item.last_message.type == 'text' ? 
                                <Text numberOfLines={1} ellipsizeMode="tail" style={isRead ? styles.messageText : styles.messageTextUnRead}>{textToDisplay}</Text>
                                :<>
                                    {item.last_message.type == 'audio' ?
                                    <>
                                        <Ionicons name="mic" color={theme.iconColor} size={20}/>
                                        <Text style={styles.attachmentText}>Audio</Text>
                                    </>
                                        :
                                        <>
                                        <Ionicons name="images" color={theme.iconColor} size={20}/>
                                        <Text style={styles.attachmentText}>Photo</Text>
                                    </>
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
                <Box style={{ position: "absolute", bottom: 10, right: 10 }}>
                    {renderHasReadAvatars()}
                </Box>
            </Pressable>
        </Box>
    )
}

export default ConversationListItem;