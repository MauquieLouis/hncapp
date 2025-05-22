import { supabase } from "@/libs/initSupabase";

/**
 * Inserts a new notification into the database
 * 
 * @param {Object} notification - The notification data
 * @param {string} notification.recipient_id - The user to notify
 * @param {string} notification.actor_id - OPTIONAL : Type of notification (e.g., 'message', 'invite')
 * @param {string} notification.type - Text or metadata of the notification
 * @param {string} [notification.post_id] - OPTIONAL : The potential post linked to the notification
 * @returns {Promise<{ data: any, error: any }>}
 */
export async function insertNotification({
  recipient_id,
  actor_id = null,
  type,
  post_id = null,
}: {
  recipient_id: string;
  actor_id?: string | null;
  type: string;
  post_id?: string | null;
}) {
    try{
        const { data, error } = await supabase
          .from('notifications')
          .insert([
            {recipient_id: recipient_id, actor_id: actor_id, type: type, post_id: post_id},
          ]);
          return { data, error };
    }catch(error: unknown){
        console.error("Error in insertNotification function in components/notifications.notificationSender.tsx", error);
    }

}

/**
* Delete a notification into database
 * 
 * @param {Object} notification - The notification data
 * @param {string} [notification.id] - OPTIONAL : The potential id of the notification
 * @param {string} notification.recipient_id - The user to notify
 * @param {string} notification.actor_id - OPTIONAL : Type of notification (e.g., 'message', 'invite')
 * @param {string} notification.type - Text or metadata of the notification
 * @param {string} [notification.post_id] - OPTIONAL : The potential post linked to the notification
 * @returns {Promise<{ data: any, error: any }>}
 */
export async function unsendNotification({
    id,
    recipient_id,
  actor_id = null,
  type,
  post_id = null,
}:{
  id: string | null,
  recipient_id: string;
  actor_id?: string | null;
  type: string;
  post_id?: string | null;
}){

try{
    const { data, error } = await supabase
    .from('notifications')
    .delete()
    .eq('actor_id', actor_id).eq('type', type).eq('post_id',post_id);
    return { data, error };
}catch(error: unknown){
    console.error("Error in unsendNotification function in components/notifications.notificationSender.tsx", error);
}
}