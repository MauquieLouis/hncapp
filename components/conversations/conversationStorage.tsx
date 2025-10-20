import * as FileSystem from "expo-file-system";
import * as SQLite from 'expo-sqlite';
import { SQLiteAnyDatabase } from 'expo-sqlite/build/NativeStatement';
import { supabase } from "@/libs/initSupabase";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useUserContext } from "@/contexts/userContext";
import Attachment from "./attachment";

class ConversationStorageDatabase {
    static instance: SQLiteAnyDatabase | null = null;
    db: SQLiteAnyDatabase | null = null;

    constructor() {
        if(!ConversationStorageDatabase.instance) {
            ConversationStorageDatabase.instance = this;
        }
        return ConversationStorageDatabase.instance;
    }


    async initDatabase() {
        try{
            this.db = await SQLite.openDatabaseAsync('conversations.db');
            //  ======= CREATE CONVERSATIONS TABLE IF NOT EXISTS =======
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    is_group BOOLEAN,
                    created_at TEXT,
                    created_by TEXT,
                    deleted_at TEXT
                );
            `);
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT,
                    sender_id TEXT,
                    content TEXT,
                    created_at TEXT,
                    has_attachment BOOLEAN,
                    type TEXT,
                    deleted_at TEXT,
                    replied_to_id TEXT,
                    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
                    FOREIGN KEY (replied_to_id) REFERENCES messages(id)
                );
            `);
            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS attachments (
                    id TEXT PRIMARY KEY,
                    message_id TEXT,
                    url TEXT,
                    type TEXT,
                    size NUMERIC,
                    created_at TEXT,
                    local_path TEXT,
                    FOREIGN KEY (message_id) REFERENCES messages(id)
                );
            `);

            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS message_status (
                    id TEXT PRIMARY KEY,
                    message_id TEXT,
                    user_id TEXT,
                    is_read BOOLEAN,
                    read_at TEXT,
                    conversation_id TEXT,
                    FOREIGN KEY (message_id) REFERENCES messages(id),
                    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
                );`
            );

            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS message_reactions (
                    id TEXT PRIMARY KEY,
                    message_id TEXT,   
                    user_id TEXT,
                    reaction TEXT,
                    created_at TEXT,
                    conversation_id TEXT,
                    FOREIGN KEY (message_id) REFERENCES messages(id),
                    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
                );
            `);

            await this.db.execAsync(`
                CREATE TABLE IF NOT EXISTS conversation_participants (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT,
                    user_id TEXT,
                    joined_at TEXT,
                    deleted_at TEXT,
                    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
            );`
        ); 

        }
        catch(error: unknown) {
            console.error("Error initializing database: ", error);    
        }
    }

    async insertConversation(conversation: any) {
        if (!this.db) {
            console.error("Database not initialized");
            return;
        } 
        const { id, name, is_group, created_at, created_by } = conversation;
        try {
            const conv_result = await this.db.runAsync(`
                INSERT INTO conversations (id, name, is_group, created_at, created_by) 
                VALUES (?, ?, ?, ?, ?)
            `, id, name, is_group, created_at, created_by);
            console.log("✅ Conversation inserted: ", conv_result);
        } catch (error) {
            console.error("❌ Error inserting conversation: ", error); 
        }
    }

    async getConversationById(conversationId: string) {
        if (!this.db) {
            console.error("Database not initialized");
            return null;
        }
        const conversation = await this.db.getAllAsync(`
            SELECT * FROM conversations WHERE id = ?
        `, [conversationId]);
        return conversation;
    }

    async insertMessage(message: any, conversation_id: any) {
        if (!this.db) {
            console.error("Database not initialized");
            return;
        }
        const { id, sender_id, content, created_at, has_attachment, type, deleted_at, replied_to_id } = message;
        try {
            const msg_result = await this.db.runAsync(`
                INSERT INTO messages (id, conversation_id, sender_id, content, created_at, has_attachment, type, deleted_at, replied_to_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, id, conversation_id, sender_id, content, created_at, has_attachment, type, deleted_at, replied_to_id);
            console.log("✅ Message inserted: ", msg_result);
        } catch (error) {
            console.error("❌ Error inserting message: ", error); 
        }
    }

    async insertReaction(reaction: any, message_id: any, conversation_id: any) {
        if (!this.db) { 
            console.error("Database not initialized");
            return;
        }
        const { id, user_id, reaction: reactionText, created_at } = reaction;
        try {
            const reaction_result = await this.db.runAsync(`
                INSERT INTO message_reactions (id, message_id, user_id, reaction, created_at, conversation_id) 
                VALUES (?, ?, ?, ?, ?, ?)
            `, id, message_id, user_id, reactionText, created_at, conversation_id);
            console.log("✅ Reaction inserted: ", reaction_result);
        }
        catch (error) {
            console.error("❌ Error inserting reaction: ", error); 
        }
    }
    
    async insertNewAttachement(attachment: any, message_id: any) {
        if (!this.db) { 
            console.error("Database not initialized");
            return;
        }
        const local_path = await this.insertNewAttachmentInLocalStorage(attachment.url, attachment.type);
        const { id, url, type, size, created_at } = attachment;
        try {
            const attachment_result = await this.db.runAsync(`
                INSERT INTO attachments (id, message_id, url, type, size, created_at, local_path) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, id, message_id, url, type, size, created_at, local_path);
            console.log("✅ Attachment inserted: ", attachment_result);
        } catch (error) {
            console.error("❌ Error inserting attachment: ", error); 
        }
    }

    async inserParticipant(participant: any, conversation_id: any) {
        if (!this.db) { 
            console.error("Database not initialized");
            return;
        }
        const { id, user_id, joined_at, deleted_at } = participant;
        try {
            const participant_result = await this.db.runAsync(`
                INSERT INTO conversation_participants (id, conversation_id, user_id, joined_at, deleted_at) 
                VALUES (?, ?, ?, ?, ?)
            `, id, conversation_id, user_id, joined_at, deleted_at);
            console.log("✅ Participant inserted: ", participant_result);
        } catch (error) {
            console.error("❌ Error inserting participant: ", error); 
        }
        
    }

    private async insertNewAttachmentInLocalStorage(url: any, type: string) {
        // -1- First download image from url
        // -2- Get it in base64 format
        // -3- Save it with file-system expo
        try{
            if(!FileSystem.documentDirectory) {
                console.error("❌ Error: FileSystem.documentDirectory is null in insertNewAttachmentInLocalStorage function conversationStorage.tsx: ");
                return null;
            }
            
            let base64Data;
            const fileName = url
            const fileUri = FileSystem.documentDirectory + fileName;
            // 🔧 Ensure the directory exists
            const directory = fileUri.substring(0, fileUri.lastIndexOf("/"));
            const dirInfo = await FileSystem.getInfoAsync(directory);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
            }
            if(type.startsWith('audio')){
                const { data, error } = await supabase.storage.from('Conversations').createSignedUrl(url, 60*60);
                if(error) throw error;
                const remoteUrl = data?.signedUrl;
                if(!remoteUrl) throw new Error('No signed URL returned.');
                const downloadRes = await FileSystem.downloadAsync(remoteUrl, fileUri);
            }else{
                const { data, error } = await supabase.storage.from("Conversations").download(url);
                if (error) {
                    console.error("❌ Error downloading attachment in insertNewAttachmentInLocalStorage function conversationStorage.tsx: ", error); 
                }
                if(!data) {
                    console.error("❌ No data returned in insertNewAttachmentInLocalStorage function conversationStorage.tsx: ", error);
                    return null;
                }
                base64Data = await this.blobToBase64(data);
                await FileSystem.writeAsStringAsync(fileUri, base64Data, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                console.log("✅ File saved to: ", fileUri);
            }
            return fileUri;

        }catch(error){
            console.error("❌ Error downloading attachment: ", error); 
            throw new Error("Failed to download attachment from Supabase storage in insertNewAttachementInLocalStorage method in conversationStorage.tsx file"); 
        }
    }

    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error("Failed to convert blob to base64"));
            reader.onloadend = () => {
            const base64 = reader.result?.toString().split(",")[1];
            if (base64) {
                resolve(base64);
            } else {
                reject(new Error("Base64 conversion failed"));
            }
            };
            reader.readAsDataURL(blob);
        });
    }

    async loadMoreMessages(conversationId: any, userId: any, page = 1, pageSize = 20) {
        if(!this.db) {
            console.error("Database not initialized");
            return;
        }
        return new Promise((resolve, reject) => {
            const offset = (page - 1) * pageSize;
    
            // Fetch messages
            this.db.transaction((tx: { executeSql: (arg0: string, arg1: any[], arg2: (_: any, { rows }: { rows: { _array: any[]; }; }) => void, arg3: (_: any, error: any) => void) => void; }) => {
                tx.executeSql(
                    `SELECT 
                        m.id, 
                        m.content, 
                        m.created_at, 
                        m.type, 
                        m.sender_id, 
                        m.has_attachment, 
                        m.replied_to_id,
                        (SELECT content FROM messages WHERE id = m.replied_to_id) AS reply_content,
                        (SELECT type FROM messages WHERE id = m.replied_to_id) AS reply_type
                    FROM messages m
                    WHERE m.conversation_id = ?
                    AND (m.deleted_at IS NULL OR m.deleted_at > datetime('now'))
                    ORDER BY m.created_at DESC
                    LIMIT ? OFFSET ?;`,
                    [conversationId, pageSize, offset],
                    (_: any, { rows }: { rows: { _array: any[] } }) => {
                        const messages = rows._array;
    
                        // Fetch attachments and reactions for each message
                        Promise.all(messages.map(async (msg: { id: any; }) => {
                            // Fetch attachments
                            const attachments = await new Promise((res, rej) => {
                                this.db.transaction((tx: { executeSql: (arg0: string, arg1: any[], arg2: (_: any, { rows }: any) => void, arg3: (_: any, error: any) => void) => void; }) => {
                                    tx.executeSql(
                                        `SELECT id, url, type, size, created_at FROM attachments WHERE message_id = ?`,
                                        [msg.id],
                                        (_: any, { rows }: any) => res(rows._array),
                                        (_: any, error: any) => rej(error)
                                    );
                                });
                            });
    
                            // Fetch reactions
                            const reactions = await new Promise((res, rej) => {
                                this.db.transaction((tx: { executeSql: (arg0: string, arg1: any[], arg2: (_: any, { rows }: { rows: any; }) => void, arg3: (_: any, error: any) => void) => void; }) => {
                                    tx.executeSql(
                                        `SELECT id, user_id, reaction, created_at FROM message_reactions WHERE message_id = ?`,
                                        [msg.id],
                                        (_, { rows }) => res(rows._array),
                                        (_, error) => rej(error)
                                    );
                                });
                            });
                            return { ...msg, attachments, reactions };
                        })).then(messagesWithDetails => {
                            resolve({ messages: messagesWithDetails });
                        }).catch(error => reject(error));
                    },
                    (_: any, error: any) => reject(error)
                );
            });
        });
    }

    /**
     * Method to insert the last 50 messages and participant, when conversation has not been created yet
     * @param conversationId
     * @param messages 
     * @param participants 
     */
    async newConversationUpload(conversationId: any, userId: any){
        try{

            // | - 0 - | Insert the conversation in the database
            const { data: conversation, error: conversation_error } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single();
            if(conversation_error){
                console.error('Conversation_Error when fetching conversation in conversationStorage.tsx :', conversation_error);
            }
            this.insertConversation(conversation);
            
            if(!this.db){
                console.error("Database not initialized");
                return;
            }
            const { data: conv_data, error: conv_error } = await supabase.rpc('get_conversation_messages2', 
            {'p_conversation_id': conversationId, 'p_user_id':userId, 'p_page_size':10});
            if(conv_error){
                console.error('Conv_Error :', conv_error);
            }
            // | - 1 - | Insert participants in the database
            conv_data.participants.forEach((participant: any) => {
                this.inserParticipant(participant, conversationId);
            });
            // | - 2 - | Insert messages in the database (maybe by calling the loadMoreMessages function)
            this.uploadNewMessages(conv_data.messages, conversationId, userId);
            // | - 4 - | Return the main messages to load them in state.
            return conv_data.messages;
        }catch(error){
            console.error("❌ Error in newConversationUpload: ", error); 
        }
    }

    async uploadNewMessages(messages: any, conversationId: any, userId: any) {
        for(let message of messages) {
            if(message.has_attachment) {
                for(let attachment of message.attachments) {
                    await this.insertNewAttachement(attachment, message.id);
                }
            }
            if(message.reactions) {
                for(let reaction of message.reactions) {
                    await this.insertReaction(reaction, message.id, conversationId);
                }

            }
            await this.insertMessage(message, conversationId);
        }
        console.log("✅ Upload should have succeed");
    }


    async loadLocalMessages(conversationId: any, userId: any, page: number, pageSize: number) {
        if(!this.db) {
            console.error("Database not initialized");
            return;
        }
        //1st load messages, then load reactions and attachments and aggregate them in the messages array
        const messages = await this.db.getAllAsync(`
            SELECT * from messages WHERE conversation_id = ?
            AND deleted_at IS NULL 
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?;`, 
            [conversationId, pageSize, ((page - 1) * pageSize)]
        );
        await this.loadAttachmentsAndReactionsForMessages(messages);
        return messages;
    }

    async getMessagesAfterDate(conversationId: string, afterDate: string, limit: number = 50){
        try{
            if (!this.db) {
                console.error("Database not initialized");
                return [];
            }
            const query = `
                SELECT * FROM messages
                WHERE conversation_id = ?
                AND datetime(created_at) < datetime(?)
                AND (deleted_at IS NULL)
                ORDER BY datetime(created_at) DESC
                LIMIT ?
            ` ;
            const messages = await this.db.getAllAsync(query, [conversationId, afterDate, limit]);
            await this.loadAttachmentsAndReactionsForMessages(messages);
            return messages;
        } catch (error) {
            console.error("❌ Error in getMessagesAfterDate method in conversationStorage.tsx :", error);
            return [];
        }
    }

    async loadAttachmentsAndReactionsForMessages(messages: any){
        try{
            for(const message of messages) {
                //Check for attachment with this message.id
                if(message.replied_to_id && message.replied_to_id !== null) {
                    let reply = await this.db.getFirstAsync(`
                        SELECT id, content, type FROM messages WHERE id = ?
                    `, [message.replied_to_id]);
                    if(messages.length < 25){
                        console.log("reply : ", reply);
                    }
                    if(!reply){
                        //If no reply found locally get it from supabase
                        try{
                            const { data: reply_data, error: reply_error } = await supabase
                            .from('messages')
                            .select('id, content, type')
                            .eq('id', message.replied_to_id)
                            .single();
                            if(reply_error){
                                console.error("❌ Reply_Error when fetching reply from supabase in loadAttachmentsAndReactionsForMessages method in conversationStorage.tsx :", reply_error);
                            }else{
                                reply = reply_data;
                            }
                        }catch(error){
                            console.error("❌ Error fetching reply from supabase in loadAttachmentsAndReactionsForMessages method in conversationStorage.tsx :", error);
                        }
                    }
                    message.reply_type = reply.type;
                    message.reply_content = reply.content;
                }
                if(message.has_attachment) {
                    const attachments = await this.db.getAllAsync(`
                        SELECT id, url, type, size, created_at, local_path FROM attachments WHERE message_id = ?
                        `, [message.id]);
                        message.attachments = attachments;
                    }else{
                    message.attachments = [];
                }
                //Check for reactions with this message.id
                const reactions = await this.db.getAllAsync(`
                SELECT id, user_id, reaction, created_at FROM message_reactions WHERE message_id = ?
                `, [message.id]);
                if(reactions.length > 0){
                    message.reactions = reactions;
                }else{
                    message.reactions = [];
                }
            }
            return messages;
        }catch(error){
            console.error("❌ Error in loadAttachmentsAndReactionsForMessages method in conversationStorage.tsx :", error);
        }
    }

    async getLastMessageForConversationId(conversationId: any){
        if (!this.db) {
            console.error("Database not initialized");
            return null;
        }
        const result = await this.db.getFirstAsync(`
            SELECT created_at FROM messages
            WHERE conversation_id = ?
            ORDER BY created_at DESC
            LIMIT 1
        `, [conversationId]);
        return result?.created_at || null;
    }

    async getOldestMessageStoredInDb(conversationId: any){
        if (!this.db) {
            console.error("Database not initialized");
            return null;
        }
        const result = await this.db.getFirstAsync(`
            SELECT created_at FROM messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC
            LIMIT 1
        `, [conversationId]);
        return result?.created_ad || null;
    }

    async countMessagesConversation(conversationId: any){
        if (!this.db) {
            console.error("Database not initialized");
            return null;
        }
        try {
            const result = await this.db.getFirstAsync(
                `SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?`,
                [conversationId]
            );
    
            return result?.count ?? 0;
        } catch (error) {
            console.error("Failed to count messages:", error);
            return null;
        }
    }

    /**
     * ---------------------------------------
     * Method to delete a message from the storage
     * ---------------------------------------
    */
    async deleteMessage(messageId: string) {
        if (!this.db) {
            console.error("Database not initialized");
            return;
        }
        try {
            // Check for attachments and delete them
            const attachments = await this.db.getAllAsync(`
                SELECT local_path FROM attachments WHERE message_id = ?
            `, [messageId]);
            for (const attachment of attachments) {
                if (attachment.local_path) {
                    await this.deleteAttachment(attachment.id);
                    // Delete the file from local storage
                    await this.deleteAttachmentFromLocalStorage(attachment.local_path);
                }
            }
            await this.db.runAsync(`
                UPDATE messages SET deleted_at = datetime('now') WHERE id = ?
            `, [messageId]);
            console.log("✅ Message deleted: ", messageId);
        } catch (error) {
            console.error("❌ Error deleting message: ", error); 
        }
    }

    async deleteAttachment(attachmentId: string) {
        if (!this.db) {
            console.error("Database not initialized");
            return;
        }
        try {
            await this.db.runAsync(`
                DELETE FROM attachments WHERE id = ?
            `, [attachmentId]);
            console.log("✅ Attachment deleted: ", attachmentId);
        } catch (error) {
            console.error("❌ Error deleting attachment: ", error); 
        }
    }   

    private async deleteAttachmentFromLocalStorage(fileName: string): Promise<boolean> {
        try {
          if (!FileSystem.documentDirectory) {
            console.error("❌ FileSystem.documentDirectory is null in deleteAttachmentFromLocalStorage.");
            return false;
          }
      
          const fileUri = FileSystem.documentDirectory + fileName;
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
          if (!fileInfo.exists) {
            console.warn("⚠️ File does not exist, nothing to delete: ", fileUri);
            return false;
          }
      
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
          console.log("✅ File deleted from local storage: ", fileUri);
          return true;
      
        } catch (error) {
          console.error("❌ Error deleting file from local storage: ", error);
          return false;
        }
    }

    async deleteReaction(reactionId: string) {
        if (!this.db) {
            console.error("Database not initialized");
            return;
        }
        try {
            await this.db.runAsync(`
                DELETE FROM message_reactions WHERE id = ?
            `, [reactionId]);
            console.log("✅ Reaction deleted: ", reactionId);
        } catch (error) {
            console.error("❌ Error deleting reaction: ", error); 
        }
    }

    async getMostRecentDeletedMessage(conversationId: string) {
        if(!this.db) {
            console.error("Database not initialized");
            return null;
        }
        try {
            const result = await this.db.getFirstAsync(`
                SELECT * FROM messages
                WHERE conversation_id = ?
                AND deleted_at IS NOT NULL
                ORDER BY deleted_at DESC
                LIMIT 1
            `, [conversationId]);
            return result;
        } catch (error) {
            console.error("❌ Error fetching most recent deleted message: ", error); 
            return null;
        }
    }

    async updateDeletedMessages(messages: any, conversationId: string, userId: string) {
        if(!this.db) {
            console.error("Database not initialized");
            return;
        }
        try {
            //Go through all the messages and update their deleted_at field
            for(let message of messages) {
                if(message.deleted_at) {
                    await this.db.runAsync(`
                        UPDATE messages SET deleted_at = datetime(?) WHERE id = ?
                    `, [message.deleted_at, message.id]);
                }
                //Check for attachments and delete them
                if(message.has_attachments) {
                    const attachments = await this.db.getAllAsync(`
                        SELECT * FROM attachments WHERE message_id = ?
                    `, [message.id]);
                    for(let attachment of attachments) {
                        await this.deleteAttachment(attachment.id);
                        // Delete the file from local storage
                        await this.deleteAttachmentFromLocalStorage(attachment.local_path);
                    }
                }
            }
        } catch (error) {
            console.error("❌ Error updating deleted messages: ", error); 
        }
    }



    /** 
     * TODO
     *  ====================================================================================================================
     *  Method to check if the conversation exist in the storage
     *  -----
     *  Method to save 50 messages if nothing exist
     *  -----
     *  Method to update the stored messages (and decale the all the message to only store 50 messages)
     *  -----
     *  Method to delete the conversation from the storage
     *  -----
     *  Method to delete a specific message from the storage, it means to load a new old message to always have 50 messages
     *  -----
     *  Method to update a reaction from a specific message in the storage
     *  -----
     *  Method to delete a reaction from a specific message in the storage
     *  -----
     *  ====================================================================================================================
     */

    /**
     *  ================================================================
     *
     *  CLEAN DB AND CLEAR FILES
     * 
     *  ================================================================
     */
    async clearDatabaseAndFiles() {
        if (!this.db) {
            console.error("Database not initialized");
            return;
        }
        try {
            await this.db.execAsync(`
                DROP TABLE IF EXISTS conversations;
                DROP TABLE IF EXISTS messages;
                DROP TABLE IF EXISTS attachments;
                DROP TABLE IF EXISTS message_status;
                DROP TABLE IF EXISTS message_reactions;
                DROP TABLE IF EXISTS conversation_participants;
            `);
            console.log("✅ Database cleared successfully.");
            this.deleteAllFilesInMainFolder();
        } catch (error) {
            console.error("❌ Error clearing database: ", error); 
        }
    }

    async deleteAllFilesInMainFolder(){
        try {
          const mainDir = FileSystem.documentDirectory;
          if (!mainDir) {
            console.error("❌ FileSystem.documentDirectory is null");
            return;
          }
      
          const files = await FileSystem.readDirectoryAsync(mainDir);
      
          for (const fileName of files) {
            const fileUri = mainDir + fileName;
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            
            if (fileInfo.isDirectory) {
              // Recursively delete directories
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
            } else {
              // Delete files
              await FileSystem.deleteAsync(fileUri, { idempotent: true });
            }
          }
      
          console.log("✅ All files and folders deleted from documentDirectory");
        } catch (error) {
          console.error("❌ Failed to delete files: ", error);
        }
      };

    // loadMessages(): any[] {
    //     const messages = this.storage.getString(this.storageKey) || [];
    //     return storedMessages ? JSON.parse(storedMessages) : []; // Return the last MAX_MESSAGES
    // }

}

export default new ConversationStorageDatabase();
