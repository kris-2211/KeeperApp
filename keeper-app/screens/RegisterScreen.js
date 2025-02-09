import React, { useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
import axios from "axios";
import { Text, TextInput, Button } from "react-native-paper";



const RegisterScreen = ({ navigation }) => {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullnameError, setFullnameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateFullname = (name) => {
    if (!name) return "Full name is required.";
    if (name.length < 3) return "Full name must be at least 3 characters.";
    return "";
  };

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

  const handleRegister = async () => {
    setFullnameError(validateFullname(fullname));
    setEmailError(validateEmail(email));
    setPasswordError(validatePassword(password));

    if (validateFullname(fullname) || validateEmail(email) || validatePassword(password)) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://192.168.29.79:4000/api/auth/register', {
        fullname,
        email,
        password,
      });

      if (response.data.success) {
        Alert.alert("Success", "Account created! Please log in.");
        navigation.navigate("Login");
      } else {
        Alert.alert("Error", response.data.message || "Registration failed");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput
        label="Full Name"
        value={fullname}
        onChangeText={setFullname}
        onBlur={() => setFullnameError(validateFullname(fullname))}
        mode="outlined"
        style={styles.input}
        error={!!fullnameError}
      />
      {fullnameError ? <Text style={styles.error}>{fullnameError}</Text> : null}

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

      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        disabled={loading}
        style={styles.button}
      >
        Register
      </Button>

      <Button mode="text" onPress={() => navigation.navigate("Login")} style={styles.backButton}>
        Back to Login
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
  backButton: {
    marginTop: 10,
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
});

export default RegisterScreen;
