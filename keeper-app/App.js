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
import { DrawerActions } from "@react-navigation/native";  // Import DrawerActions
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
SplashScreen.preventAutoHideAsync();

const Sidebar = ({ navigation }) => {
  const [notes, setNotes] = useState([]); // Assuming you have a list of notes
  const { setIsLoggedIn } = useAuth();
  // Function to fetch notes (or use any other way to store/fetch them)
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        // Fetch your notes from AsyncStorage or API
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

  // Function to delete a specific note
  const handleDeleteNote = async (noteId) => {
    try {
      // Filter out the note you want to delete
      const updatedNotes = notes.filter(note => note.id !== noteId);
      
      // Save updated notes to AsyncStorage or your API
      await AsyncStorage.setItem("notes", JSON.stringify(updatedNotes));
      
      // Update the state
      setNotes(updatedNotes);
      alert("Note deleted successfully!");
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleLogout = async () => {
    try {
      // Remove token from AsyncStorage to log the user out
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("isLoggedIn");
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <View style={styles.drawerContainer}>
      <TouchableOpacity style={styles.drawerItem} onPress={() => handleLogout()}>
        <Text>Logout</Text>
      </TouchableOpacity>
      
      {/* Iterate through notes and display delete button for each */}
      {notes.map(note => (
        <View key={note.id} style={styles.noteContainer}>
          <Text>{note.title}</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteNote(note.id)}  // Pass note id to delete specific note
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
        headerStyle: { backgroundColor: "#FFEB3B", height: 100 },
        headerTitleAlign: "center",
        headerLeft: () => (
          !searchVisible && (
            <TouchableOpacity
              onPress={() => navigation.dispatch(DrawerActions.openDrawer())}  // Use DrawerActions here
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
  const {isLoggedIn, setIsLoggedIn} = useAuth();

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

  return(
  <AuthProvider> 
      <AppNavigator />
  </AuthProvider>
  );
};

const styles = StyleSheet.create({
  headerContainer: { flexDirection: "row", alignItems: "center" },
  headerImage: { width: 30, height: 30, marginRight: 10 },
  header: { fontSize: 24, fontWeight: "bold", color: "#333" },
  headerIcon: { marginHorizontal: 15 },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 10, paddingHorizontal: 10, width: "100%", marginHorizontal: 70 },
  searchInput: { flex: 1, fontSize: 18, paddingVertical: 5 },
  drawerContainer: { flex: 1, paddingTop: 50, paddingLeft: 20 },
  drawerItem: { marginBottom: 20, fontSize: 18 },
  noteContainer: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  deleteButton: { marginLeft: 10 },
  trashIcon: { width: 20, height: 20 },  // Set size of trash icon
});
