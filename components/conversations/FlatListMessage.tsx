import React, { StyleSheet} from "react-native";
import { memo } from "react";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from "@/contexts/userContext";
import Attachment from "./attachment";

const FlatListMessage = (props: any) => {

    const item = props.message;
    // console.log("FLAT LIST ELEM PROPS", item);
    const { user } = useUserContext();
    if(item.type == 'attachment'){
        return <Attachment item={item}/>
    }
    return (
        <Box>
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