import React, { useEffect, useState } from 'react';
import { View, Text, Image, Touchable, TouchableOpacity, FlatList } from 'react-native';
import { Box } from '../ui/box';
import { HStack } from '../ui/hstack';
import { VStack } from '../ui/vstack';
import { Input, InputField, InputSlot } from '../ui/input';
import { Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicatorWrapper, ActionsheetDragIndicator } from '../ui/actionsheet';
import { FormControl, FormControlLabel, FormControlLabelText } from '../ui/form-control';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/libs/initSupabase';
import { useUserContext } from '@/contexts/userContext';
import { Spinner } from '../ui/spinner';
import Avatar from './avatar';


const LikeOrDislikeActionSheet = (props: { post_id: any; like: any; isOpen: boolean | undefined; onClose: (() => any) | undefined; }) => {

    const [ loading, setLoading ] = useState(false);
    const [ profiles, setProfiles ] = useState<any[]>([]);
    
    useEffect(() => {
        fetchLikeOrDislikeProfiles();
    }, []);

    const fetchLikeOrDislikeProfiles = async() => {
        try{
            const { data, error } = await supabase
            .rpc('get_post_likes_with_profiles', {
                post_id_input: props.post_id,
                like_input: props.like // or false for dislikes
            });
            if(error){
                console.error("Error when fetching likes or dislikes in fetchLikeOrDislikeProfiles in LikeOrDislikeActionSheet.tsx", error);
            }
            setProfiles(data || []);
            console.log("Data fetched in fetchLikeOrDislikeProfiles: ", data);
        }catch(error: unknown){
            console.error("Error likes or dislikes in LikeOrDislikeActionSheet.tsx", error);
        }finally{

        }
    }

    const renderProfile = ({ item }: { item: any }) => (
            <Box style={{ borderBottomWidth:1, borderColor:"rgba(127,127,127,0.8)",  paddingVertical:10 }}>
                <HStack space="sm" style={{ alignItems: "center" }}>
                    <Avatar user_id={item.user_id}/>
                    <VStack>
                    <Text style={{ fontWeight:"bold", color:"black"}}>{item.username}</Text>
                    <Text style={{ color:"black" }}>{item.firstname} {item.lastname}</Text>
                    </VStack>
                </HStack>
            </Box>
        );

    return (
        <Actionsheet isOpen={props.isOpen} onClose={props.onClose}>
            <ActionsheetBackdrop/>
            <ActionsheetContent className="">
                <ActionsheetDragIndicatorWrapper>
                    <ActionsheetDragIndicator/>
                </ActionsheetDragIndicatorWrapper>
                <VStack className="w-full pt-5">
                    <Box style={{justifyContent:"center", alignItems:"center", paddingVertical:10}}>
                            {props.like ? 
                            <HStack space="sm" style={{ alignItems: "center" }}>
                                <Ionicons name="heart-outline" size={32} color="black" />
                                <Text style={{ color:"black", fontWeight:"bold", fontSize:28}}>
                                    Like
                                </Text>
                            </HStack>
                        :
                            <HStack space="sm" style={{ alignItems: "center" }}>
                                <Ionicons name="skull-outline" size={32} color="black" />
                                <Text style={{ color:"black", fontWeight:"bold", fontSize:28}}>
                                    Dislike
                                </Text>
                            </HStack>
                        }
                    </Box>
                    {loading ? (
                        <Spinner />
                    ) : (
                        <FlatList
                        data={profiles}
                        renderItem={renderProfile}
                        keyExtractor={(item) => item.user_id.toString()}
                        />
                    )}
                </VStack>
            </ActionsheetContent>
        </Actionsheet>
    );
}

export default LikeOrDislikeActionSheet;