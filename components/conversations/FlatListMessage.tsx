import React from "react-native";
import { memo } from "react";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from '@/components/ui/hstack';
import { useUserContext } from "@/contexts/userContext";
import Attachment from "./attachment";

const FlatListMessage = (props: any) => {

    const item = props.message;
    const { user } = useUserContext();
    if(item.type == 'attachment'){
        return <Attachment item={item}/>
    }
    return (
        <Box>
            <HStack reversed={item.sender_id == user.id ? true : false} style={{paddingHorizontal:5}}>
                {item.sender_id != user.id ? 
                <Box style={{borderBlockColor:"blue", borderWidth:1}} width={'20%'}>
                    <Text>
                        {item.sender_id}
                    </Text>
                </Box>
                    : 
                <></>}
                <Box style={
                    item.sender_id == user.id ?
                    //My message
                    {borderBlockColor:"red", borderWidth:1, backgroundColor:'blue'}
                    :
                    //Other message
                    {borderBlockColor:"blue", borderWidth:1, backgroundColor:'grey'}
                } width={'66%'}>
                    <Text style={item.sender_id == user.id ? 
                        //My message
                        {textAlign:'right', color:'white'} 
                        : 
                        //Other message
                        {textAlign:'left'}}>
                        {item.content}
                    </Text>
                </Box> 
            </HStack>
        </Box>
    )
}

export default memo(FlatListMessage);