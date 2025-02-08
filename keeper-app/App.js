import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./screens/LoginScreen.js";
import RegisterScreen from "./screens/RegisterScreen.js";
import HomeScreen from "./screens/HomeScreen.js";

const Stack = createStackNavigator();
// Keep splash screen visible while checking auth status
SplashScreen.preventAutoHideAsync();

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    getData()
    const checkLoginStatus = async () => {
      try {
        AsyncStorage.removeItem("token");
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const response = await axios.get('http://192.168.29.79:4000/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log(response);
          setIsLoggedIn(response.data.valid);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        setIsLoggedIn(false);
      }
      setIsLoading(false);
      await SplashScreen.hideAsync(); // Hide splash screen after checking auth
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return null; // Keep splash screen visible
  }

  console.log(Stack.Screen);

  async function getData()
  {
    const data = AsyncStorage.getItem("isLoggedIn");
    console.log(data);
    setIsLoggedIn(data);
  }

  return (
    <NavigationContainer>
     
        {isLoggedIn ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            </Stack.Navigator>
        )}
        
    </NavigationContainer>
  );
};


export default function App() {
  return (
    <AppNavigator />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

});
 