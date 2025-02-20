import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_REACT_NATIVE_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_REACT_NATIVE_SUPABASE_ANON_KEY;
// const supabaseUrl = YOUR_REACT_NATIVE_SUPABASE_URL
// const supabaseAnonKey = YOUR_REACT_NATIVE_SUPABASE_ANON_KEY

console.log("SUPA URL :", supabaseUrl, supabaseAnonKey);
 
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// export default supabase;