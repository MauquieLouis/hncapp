import React, { StyleSheet, TouchableOpacity} from "react-native";
import { memo, useState } from "react";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from "@/contexts/userContext";
import Attachment from "./attachment";
import * as Haptics from 'expo-haptics';
import MessageActionSheet from "@/components/conversations/messageActionSheet";
import { supabase } from "@/libs/initSupabase";


const FlatListMessage = (props: any) => {

    const [ showActionSheet, setShowActionSheet ] = useState(false);
    const { user } = useUserContext();

    const onCloseActionSheet = () => setShowActionSheet(false);
    const openActionSheetFunction = () => { 
        setShowActionSheet(true); 
    };
    
    const item = props.message;
    const actionSheetTable: { [key: string]: { icon: string; onPress: () => void; } } = {
        "info": {
            icon: "information-circle-outline",
            onPress: () => {console.log("Info Pressed")},
        },
    }
    if(item.sender_id == user.id){
        actionSheetTable["delete"] = {
            icon: "trash-outline",
            onPress: () => {console.log("Delete msg Pressed"); deleteMessage();},
        }
    }

    const deleteMessage = async () => {
            try{
                //SOFT DELETE THE MESSAGE
                const { data: data_soft_delete_msg, error: error_soft_delete_msg } = await supabase.from('messages').update({deleted_at:new Date().toISOString()}).eq('id',item.id);
                if(error_soft_delete_msg){
                    console.log("Error in deleteMessage function when soft deleting msg in components/attachment.tsx file :", error_soft_delete_msg);
                }
            }catch(error: unknown){
                console.log("Error in deleteMessage function in components/attachment.tsx file :", error);
            }finally{
    
            }
        }

    // console.log("FLAT LIST ELEM PROPS", item);
    if(item.type == 'attachment'){
        return <Attachment item={item}/>
    }
    return (
        <Box>
            <TouchableOpacity activeOpacity={1} onLongPress={() => {console.log("Long Pressed");  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openActionSheetFunction()}}>
                <HStack reversed={item.sender_id == user.id ? true : false} style={{paddingHorizontal:5}}>
                    {item.sender_id != user.id ? 
                    <Box style={{}} width={'20%'}>
                        <Text>
                            {item.sender_id}
                        </Text>
                    </Box>
                        : 
                    <></>}
                    <Box style={[styles.commonMessage,
                        item.sender_id == user.id ?
                        //My message
                        { backgroundColor:'blue'}
                        :
                        //Other message
                        { backgroundColor:'#BABABA'}
                    ]} maxwidth={'66%'}>
                        <Text style={[styles.commonTextMessage, item.sender_id == user.id ? 
                            //My message
                            {textAlign:'right', color:'white'} 
                            : 
                            //Other message
                            {textAlign:'left', color:'#1a1a1a'}]}>
                            {item.content}
                        </Text>
                    </Box> 
                </HStack>
            </TouchableOpacity>
            <MessageActionSheet items={actionSheetTable} showActionSheet={showActionSheet} onCloseActionSheet={onCloseActionSheet}/>
        </Box>
    )
}

export default memo(FlatListMessage);

const styles = StyleSheet.create({
    commonMessage: {
        padding:13,
        borderRadius:15,
        margin:1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    commonTextMessage: {
        fontSize:16
    }
  });