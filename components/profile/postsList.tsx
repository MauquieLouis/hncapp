import React, { useEffect, useState } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { FlatList } from "react-native";
import { useUserContext } from "@/contexts/userContext";
import { supabase } from "@/libs/initSupabase";
import PostElemInPostsList from "./postElemInPostsList";


const PostsList = (props: { height: any; user_id: string; folder_url: string }) => {

    const [ postsList, setPostsList ] = useState<any[]>([]);

    const { profile } = useUserContext();

    useEffect(() => {
        console.log("PROPS :", props);
        getFirstPosts();
    }, []);
    
    useEffect(() => {
        // getFirstPosts();
        console.log("Post list changed !!! :", postsList);
    }, [postsList]);

    const getFirstPosts = async () => {
        try{
            const { data, error } = await supabase.from('posts').select('*').eq('user_id', props.user_id);
            if(error){
                console.error("Error when fetching posts in getFirstPosts function in components/profile/postsList.tsx", error);
            }
            if(data){
                console.log("DATA POSTS for user", profile.user_id, "data : ", data);
                setPostsList(data);
            }
        }catch(error){
            console.error("Error in getFirstPosts function in components/profile/postsList.tsx", error);
        }finally{

        }
    }

    const renderItemFlatList = ({item, index}: {item: any, index: any}) => {
            return <PostElemInPostsList item={item} folder_url={props.folder_url} bucket={'posts'}/>
        }

    return(
        <Box style={{height:props.height, width:"100%", padding:5}}>
            <FlatList
                data={postsList}
                renderItem={renderItemFlatList}
            /> 
        </Box>
    );

}

export default PostsList;