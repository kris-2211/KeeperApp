import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text, Image, TouchableOpacity, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as SplashScreen from "expo-splash-screen";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import NoteScreen from "./screens/NoteScreen";
import { DrawerActions } from "@react-navigation/native";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import Toast from "react-native-toast-message";  // Import Toast

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
SplashScreen.preventAutoHideAsync();

const Sidebar = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const { setIsLoggedIn } = useAuth();

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const storedNotes = await AsyncStorage.getItem("notes");
        if (storedNotes) {
          setNotes(JSON.parse(storedNotes));
        }
      } catch (error) {
        console.error("Error fetching notes:", error);
      }
    };
    fetchNotes();
  }, []);

  const handleDeleteNote = async (noteId) => {
    try {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
      setNotes(updatedNotes);

      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Note deleted successfully!",
        position : "top",
      });

    } catch (error) {
      console.error("Error deleting note:", error);

      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete the note.",
        position : "top",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("isLoggedIn");
      setIsLoggedIn(false);

      Toast.show({
        type: "info",
        text1: "Logged Out",
        text2: "You have been logged out successfully!",
        position : "top",
      });

    } catch (error) {
      console.error("Error logging out:", error);

      Toast.show({
        type: "error",
        text1: "Logout Failed",
        text2: "Something went wrong.",
        position : "top",
      });
    }
  };

  return (
    <View style={styles.drawerContainer}>
      <TouchableOpacity style={styles.drawerItem} onPress={handleLogout}>
        <Text>Logout</Text>
      </TouchableOpacity>

      {notes.map(note => (
        <View key={note.id} style={styles.noteContainer}>
          <Text>{note.title}</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteNote(note.id)}
          >
            <Image source={require("./assets/trash.png")} style={styles.trashIcon} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const StackNavigator = ({ navigation }) => {
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    setSearchQuery('');
  };

  return (
    <Stack.Navigator
      screenOptions={{
        headerTitle: () => (
          searchVisible ? (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search notes..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <TouchableOpacity onPress={toggleSearch}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.headerContainer}>
              <Image source={require("./assets/note.png")} style={styles.headerImage} />
              <Text style={styles.header}>Mind Scribe</Text>
            </View>
          )
        ),
        headerStyle: { backgroundColor: "#F4E1FF", height: 100 },
        headerTitleAlign: "center",
        headerLeft: () => (
          !searchVisible && (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
              style={styles.headerIcon}
            >
              <Ionicons name="menu" size={30} color="black" />
            </TouchableOpacity>
          )
        )
      }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Note" component={NoteScreen} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { isLoggedIn, setIsLoggedIn } = useAuth();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const response = await axios.get('http://192.168.29.79:4000/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setIsLoggedIn(response.data.valid);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        setIsLoggedIn(false);
      }
      setIsLoading(false);
      await SplashScreen.hideAsync();
    };
    checkLoginStatus();
  }, []);

  if (isLoading) return null;

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <Drawer.Navigator drawerContent={({ navigation }) => <Sidebar navigation={navigation} />} screenOptions={{ headerShown: false }}>
          <Drawer.Screen name="Main" component={StackNavigator} />
        </Drawer.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <Toast />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  headerContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F4E1FF" },
  headerImage: { width: 30, height: 30, marginRight: 10 },
  header: { fontSize: 24, fontWeight: "bold", color: "#4B0082" },
  headerIcon: { marginHorizontal: 15 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#E6D8F3", borderRadius: 10, paddingHorizontal: 10, width: "100%", marginHorizontal: 70 },
  searchInput: { flex: 1, fontSize: 18, paddingVertical: 5, color: "#4B0082" },
  drawerContainer: { flex: 1, paddingTop: 50, paddingLeft: 20, backgroundColor: "#F4F0FA" },
  drawerItem: { marginBottom: 20, fontSize: 18, color: "#6A0DAD" },
  noteContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20, backgroundColor: "#F4E1FF", padding: 10, borderRadius: 10 },
  deleteButton: { marginLeft: 10 },
  trashIcon: { width: 20, height: 20, tintColor: "#FF1744" }
});
