import React, { useEffect } from "react";
import { Text } from "react-native";
import { Image } from "@/components/ui/image";
import { Avatar as AvatarGStackUI, AvatarBadge, AvatarImage, AvatarFallbackText } from "@/components/ui/avatar";
import { supabase } from "@/libs/initSupabase";

export default function Avatar(props: { width?: any; height?: any; user_id?: string }){

    const [ signedUrl, setSignedUrl ] = React.useState<string | null>(null);
    const { width = 50, height = 50 } = props;

    useEffect(() => {
        if(props.user_id){
            getAvatarUrl(props.user_id);
        }else{
            console.warn("No user_id provided to Avatar component");
        }
    }, []);

    const getAvatarUrl = async (userId: string) => {
        try{
            const { data: avatarData, error } = await supabase
                .from('avatars')
                .select('image_url')
                .eq('user_id', userId)
                .eq('is_current', true);
                // .maybeSingle(); // Ca fait planter le bordel de queue
            if(error){
                console.error("Error when fetching avatar URL in getAvatarUrl function in Avatar component in component/profile/avatar.tsx", error);
            }else{
                //Create a signed URL :
                // console.log("Avatar URL data: ", avatarData);
                if(avatarData.length === 0) return;
                if (avatarData && avatarData[0].image_url) {
                    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('avatars').createSignedUrls([avatarData[0].image_url], 5400);
                    if (signedUrlError) {
                        console.error("Error creating signed URL in Avatar component:", signedUrlError);
                    } else {
                        // console.log("Signed URL data:", signedUrlData);
                        setSignedUrl(signedUrlData[0].signedUrl);
                    }
                }
            }
        }catch(error: unknown){
            console.error("Error in getAvatarUrl function in Avatar component in component/profile/avatar.tsx", error);
        }
    }

    return(
        // <AvatarGStackUI size={"2xl"} >
        <AvatarGStackUI style={{width, height}} >
            {signedUrl ? (
                <AvatarImage source={{ uri: signedUrl }} />
            ) : (
                <AvatarFallbackText>D</AvatarFallbackText>
            )}
            {/* <AvatarBadge bg="green.500" /> */}
            {/* <AvatarImage source={{ uri: "https://picsum.photos/200" }} /> */}
            {/* <AvatarImage source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8dXNlcnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=800&q=60" }} /> */}
            {/* https://picsum.photos/200 */}
        </AvatarGStackUI>
    )
}

// export default function Avatar({ size = 50, imageUri, isOnline = false }) {

// }