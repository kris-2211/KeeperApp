import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert, Image } from 'react-native';
import axios from 'axios'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; // Importing Ionicons for the back arrow

const NoteScreen = ({ route, navigation }) => {
  const { note } = route.params || {}; 

  const [newNote, setNewNote] = useState({
    title: note ? note.title : '',
    content: note ? note.content : '',
  });

  useEffect(() => {
    if (note) {
      setNewNote({ title: note.title, content: note.content });
    }
  }, [note]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      ),
      headerRight: () => null,
    });
  }, [navigation]);

  const saveNote = async () => {
    if (!newNote.title || !newNote.content) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }
    const token = await AsyncStorage.getItem("token");
    
    if (!token) {
      console.error("No token found");
      return;
    }

    try {
      if (note) {
        await axios.put(
          `http://192.168.29.79:4000/api/notes/${note._id}`, 
          newNote, 
          {
            headers: {
              Authorization: `Bearer ${token}`, 
              "Content-Type": "application/json", 
            },
          }
        );
        Alert.alert('Success', 'Note updated successfully');
      } else {
        await axios.post(
          "http://192.168.29.79:4000/api/notes",
          newNote, 
          {
            headers: {
              Authorization: `Bearer ${token}`, 
              "Content-Type": "application/json", 
            },
          }
        );
        Alert.alert('Success', 'New note added successfully');
      }
  
      setNewNote({ title: '', content: '' });
      navigation.navigate('Home', { refresh: true });
  
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Network Error', error.message);
    }
  };

  const deleteNote = async () => {
    if (!note) return;

    const token = await AsyncStorage.getItem("token");
    
    if (!token) {
      console.error("No token found");
      return;
    }

    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await axios.delete(`http://192.168.29.79:4000/api/notes/${note._id}`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });

              Alert.alert("Success", "Note deleted successfully");
              navigation.navigate("Home", { refresh: true }); 
            } catch (error) {
              console.error("Error deleting note:", error);
              Alert.alert("Error", "Failed to delete the note");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>{note ? 'Edit Note' : 'Add New Note'}</Text>
        {note && (
          <TouchableOpacity onPress={deleteNote}>
            <Image source={require('../assets/trash.png')} style={styles.deleteIcon} />
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.title}
        placeholder="Title"
        value={newNote.title}
        onChangeText={(text) => setNewNote({ ...newNote, title: text })}
      />
      <TextInput
        style={[styles.input, styles.inputContent]}
        placeholder="Content"
        value={newNote.content}
        onChangeText={(text) => setNewNote({ ...newNote, content: text })}
      />
      <TouchableOpacity style={styles.addButton} onPress={saveNote}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {note ? 'Save Changes' : 'Add Note'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  deleteIcon: {
    width: 24,
    height: 24,
    tintColor: 'red',
  },
  input: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
  },
  inputContent: {
    height: 80,
  },
  addButton: {
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    height: 50,
    fontSize: 20,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
  }
});

export default NoteScreen;
