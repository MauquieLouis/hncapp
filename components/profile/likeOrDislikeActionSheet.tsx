import React, { useEffect, useState } from 'react';
import { View, Text, Image, Touchable, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
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

    const { theme } = useUserContext();
    
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
        }catch(error: unknown){
            console.error("Error likes or dislikes in LikeOrDislikeActionSheet.tsx", error);
        }finally{

        }
    }

    const styles = StyleSheet.create({
        actionSheetContent:{
            backgroundColor: theme.backgroundColor2,
        },
        nameText:{
            fontWeight:"bold",
            color: theme.textColor1,
        },
        commentText:{
            color: theme.textColor2
        },
        boxStyle:{
            borderBottomWidth:1, borderColor:theme.dividerColor,  paddingVertical:10
        },
        titleText:{
            color:theme.textColor1, fontWeight:"bold", fontSize:28
        }
    });

    const renderProfile = ({ item }: { item: any }) => (
            <Box style={styles.boxStyle}>
                <HStack space="sm" style={{ alignItems: "center" }}>
                    <Avatar user_id={item.user_id}/>
                    <VStack>
                    <Text style={styles.nameText}>{item.username}</Text>
                    <Text style={styles.commentText}>{item.firstname} {item.lastname}</Text>
                    </VStack>
                </HStack>
            </Box>
        );

    const iconColor=theme.iconColor

    return (
        <Actionsheet isOpen={props.isOpen} onClose={props.onClose}>
            <ActionsheetBackdrop/>
            <ActionsheetContent className="" style={styles.actionSheetContent}>
                <ActionsheetDragIndicatorWrapper>
                    <ActionsheetDragIndicator/>
                </ActionsheetDragIndicatorWrapper>
                <VStack className="w-full pt-5">
                    <Box style={{justifyContent:"center", alignItems:"center", paddingVertical:10}}>
                            {props.like ? 
                            <HStack space="sm" style={{ alignItems: "center" }}>
                                <Ionicons name="heart-outline" size={32} color={iconColor} />
                                <Text style={styles.titleText}>
                                    Like
                                </Text>
                            </HStack>
                        :
                            <HStack space="sm" style={{ alignItems: "center" }}>
                                <Ionicons name="skull-outline" size={32} color={iconColor} />
                                <Text style={styles.titleText}>
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