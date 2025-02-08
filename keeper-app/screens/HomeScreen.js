import React, { use } from "react";
import { View, Text, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";


const HomeScreen = ({navigation}) => {

  const handleLogout = async () => {
    await AsyncStorage.setItem("token","");
    await AsyncStorage.setItem("isLoggedIn","");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Welcome to the Home Page!</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
};

export default HomeScreen;
