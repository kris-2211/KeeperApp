import React, { useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Text, TextInput, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {IP_CONFIG} from '@env';

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { setIsLoggedIn } = useAuth();

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required.";
    if (!regex.test(email)) return "Enter a valid email.";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return "";
  };

  const handleLogin = async () => {
    setEmailError(validateEmail(email));
    setPasswordError(validatePassword(password));

    if (validateEmail(email) || validatePassword(password)) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`http://${IP_CONFIG}:4000/api/auth/login`, {
        email,
        password,
      });

      if (response.data.token) {
        await AsyncStorage.setItem("token", response.data.token);
        await AsyncStorage.setItem("isLoggedIn",JSON.stringify(true))
        await setIsLoggedIn(true);
        navigation.reset({
          index: 0, 
          routes:[{ name: "Login" }],
        });
      } else {
        Alert.alert("Login failed", "Invalid credentials");
      }
    } catch (error) {
      Alert.alert("Error", "No such user exists.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        onBlur={() => setEmailError(validateEmail(email))}
        mode="outlined"
        style={styles.input}
        error={!!emailError}
      />
      {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        onBlur={() => setPasswordError(validatePassword(password))}
        secureTextEntry
        mode="outlined"
        style={styles.input}
        error={!!passwordError}
      />
      {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}

      <Button mode="contained" onPress={handleLogin} loading={loading} disabled={loading} style={styles.button}>
        Login
      </Button>

      <Button mode="text" onPress={() => navigation.navigate("Register")} style={styles.registerButton}>
        New user? Register
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
    padding: 5,
  },
  registerButton: {
    marginTop: 10,
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
});

export default LoginScreen;
