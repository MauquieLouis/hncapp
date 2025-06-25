import React, { useEffect, useState } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { FlatList } from "react-native";
import { useUserContext } from "@/contexts/userContext";
import { supabase } from "@/libs/initSupabase";


const PostsList = (props: { height: any; }) => {

    const [ postsList, setPostsList ] = useState(null);

    const { profile } = useUserContext();

    useEffect(() => {
        getFirstPosts();
    }, []);

    const getFirstPosts = async () => {
        try{
            const { data, error } = await supabase.from('posts').select('*').eq('user_id', profile.user_id);
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

    return(
        <Box style={{borderColor:"red", borderWidth:1, height:props.height, width:"100%", padding:5}}>
            <Text style={{color:"white"}}>HERE IS THE POST LIST</Text>
            <FlatList
                data={postsList}
                renderItem={() => (
                    <Text>TEXT</Text>
                )}
            /> 
        </Box>
    );

}

export default PostsList;