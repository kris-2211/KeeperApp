import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';

const NoteScreen = ({ route, navigation }) => {
  // Retrieve the note passed from the Home screen (either for viewing/editing or adding a new note)
  const { note } = route.params || {}; // Check if note exists

  // State for holding the note's title and content (if editing an existing note)
  const [newNote, setNewNote] = useState({
    title: note ? note.title : '',
    content: note ? note.content : '',
  });

  useEffect(() => {
    if (note) {
      // If note is passed, set the state to the note data for editing
      setNewNote({ title: note.title, content: note.content });
    }
  }, [note]);

  // Function to add a new or update an existing note
  const saveNote = () => {
    if (newNote.title && newNote.content) {
      // Add your logic here to save the note (either to a list or database)
      if (note) {
        // If note exists (editing), update the note
        Alert.alert('Success', 'Note updated successfully');
      } else {
        // If no note (adding new), create a new note
        Alert.alert('Success', 'New note added successfully');
      }
      setNewNote({ title: '', content: '' }); // Clear the input fields after saving the note
      navigation.navigate('Home'); // Go back to Home screen
    } else {
      Alert.alert('Error', 'Please fill in both title and content');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{note ? 'Edit Note' : 'Add New Note'}</Text>
      
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

// Define your styles here
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
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
    height: 80, // Adjust this as needed for the content area
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
