import { Text, View, StyleSheet } from "react-native";
import { Link, Redirect } from 'expo-router';

export default function Index() {

  return (
    <Redirect href="/conversations/conversationsList" />
    // <View
    //   style={styles.container}
    // >
    //   <Text style={styles.text} >Home Screen.</Text>
    //   <Link href="/about" style={styles.button}>
    //     About Us
    //   </Link>
    // </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
  },
  button: {
    fontSize: 20,
    textDecorationLine: 'underline',
    color: '#fff',
  },
})
