import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import axios from 'axios'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { IP_CONFIG } from '@env';

const NoteScreen = ({ route, navigation }) => {
  const { note } = route.params || {}; 

  const [progress, setProgress] = useState(0);

  const [editMode, setEditMode] = useState(false); // Toggle for editing mode

  const [newNote, setNewNote] = useState({
    title: note ? note.title : '',
    category: note ? note.category : '',
    content: note ? note.content : [],
  });

  useEffect(() => {
    if (note) {
      setNewNote({
        title: note.title,
        category: note.category || '',
        content: note.content ? [...note.content] : [],
      });
    } else {
      setNewNote({
        title: '',
        category: '',
        content: [],
      });
    }
  }, [note]);

  useEffect(() => {
    const checkboxes = newNote.content.filter(item => item.type === "checkbox");
    if (checkboxes.length === 0) {
      setProgress(0);
      return;
    }
    
    const checkedCount = checkboxes.filter(item => item.checked).length;
    setProgress(checkedCount / checkboxes.length);
  }, [newNote.content]);

  
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => setEditMode(!editMode)} style={{ marginRight: 15 }}>
          <Ionicons name={editMode ? "checkmark-done-outline" : "create-outline"} size={24} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, editMode]);

  const handleChangeContent = (index, key, value) => {
    setNewNote((prevNote) => {
      const updatedContent = [...prevNote.content];
      updatedContent[index] = { ...updatedContent[index], [key]: value };
      return { ...prevNote, content: updatedContent };
    });
  };
  
  const deleteContentItem = (index) => {
    setNewNote((prevNote) => {
      const updatedContent = [...prevNote.content];
      updatedContent.splice(index, 1); // Remove item at index
      return { ...prevNote, content: updatedContent };
    });
  };
  
  const addNewContent = (type) => {
    setNewNote({
      ...newNote,
      content: [...newNote.content, { type, text: "", checked: false, imageUrl: "" }]
    });
  };

  const saveNote = async () => {
    const token = await AsyncStorage.getItem("token");

  
    if (!token) {
      Alert.alert("Error", "Authentication token is missing. Please log in again.");
      return;
    }
  
    try {
      const url = note ? `http://${IP_CONFIG}:4000/api/notes/${note._id}` : `http://${IP_CONFIG}:4000/api/notes`;
      const method = note ? "put" : "post";
  
      const response = await axios({
        method,
        url,
        data: newNote,
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
  
      console.log("✅ Response:", response.data);
  
      Alert.alert("Success", note ? "Note updated successfully" : "New note added successfully");
      navigation.navigate("Home", { refresh: true });
  
    } catch (error) {
      console.error("❌ Error saving note:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to save the note.");
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
              await axios.delete(`http://${IP_CONFIG}:4000/api/notes/${note._id}`, {
                headers: { Authorization: `Bearer ${token}` }
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

      <View style={styles.contentContainer}>
        <ScrollView style={styles.scrollView}>
          {newNote.content.length === 0 && (
            <Text style={styles.placeholderText}>Content</Text>
          )}
          {newNote.content.map((item, index) => (
            <View key={index} style={styles.contentItem}>        
              {item.type === "text" && (
                <TextInput
                  style={styles.input}
                  placeholder="Enter text..."
                  value={item.text}
                  onChangeText={(text) => handleChangeContent(index, "text", text)}
                  editable={editMode} 
                >
                </TextInput>
              )}
              {item.type === "checkbox" && (
                <TouchableOpacity 
                  style={styles.checkboxContainer} 
                  onPress={() => editMode && handleChangeContent(index, "checked", !item.checked)}
                >
                  <Ionicons name={item.checked ? "checkbox" : "square-outline"} size={24} color="#6A0DAD" />
                  <TextInput
                    style={styles.inputCheckbox}
                    placeholder="Checklist item"
                    value={item.text}
                    onChangeText={(text) => handleChangeContent(index, "text", text)}
                    editable={editMode} 
                  />
                </TouchableOpacity>
              )}
              {item.type === "image" && (
                <View>
                  {editMode ? (
                    <TextInput
                      style={styles.input}
                      placeholder="Image URL"
                      value={item.imageUrl}
                      onChangeText={(text) => handleChangeContent(index, "imageUrl", text)}
                    />
                  ) : (
                    item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.imagePreview} /> : null
                  )}
                </View>
              )}
              { editMode &&
                  <TouchableOpacity onPress={() => deleteContentItem(index)} style={styles.deleteIconContainer}>
                    <Ionicons name="trash-outline" size={15} color="red" />
                  </TouchableOpacity> 
                }
            </View>
          ))}
          {newNote.content.some(item => item.type === "checkbox") && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.addButton} onPress={() => addNewContent("text")}>
          <Ionicons name="text" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => addNewContent("checkbox")}>
          <Ionicons name="checkbox-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => addNewContent("image")}>
          <Ionicons name="image-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
        <Text style={styles.buttonText}>{note ? 'Save Changes' : 'Add Note'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F4F0FA' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#4B0082' },
  deleteIcon: { width: 24, height: 24, tintColor: '#FF1744' },
  title: { height: 50, fontSize: 20, borderColor: '#A780D5', borderWidth: 1, marginBottom: 10, paddingLeft: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
  input: { width : 250, marginTop: 5, height: 40, borderColor: '#A780D5', borderWidth: 1, marginBottom: 10, paddingLeft: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
  inputCheckbox: { marginLeft: 10, fontSize: 16 },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  imagePreview: { width: "100%", height: 200, resizeMode: "cover", marginTop: 10 },
  buttonRow: { flexDirection: "row", justifyContent: "space-around", marginVertical: 10 },
  addButton: { backgroundColor: '#6A0DAD', padding: 10, borderRadius: 50 },
  saveButton: { backgroundColor: '#6A0DAD', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 20 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  placeholderText: {color : 'rgba(0,0,0,0.5)', fontSize: 20},
  contentItem: {display: 'flex', flexDirection: 'row'},
  contentContainer : { display: 'flex', flexDirection : 'column', alignItems : 'center', height: 250, fontSize: 20, borderColor: '#A780D5', borderWidth: 1, marginBottom: 10, paddingLeft: 10, borderRadius: 5, backgroundColor: '#FFFFFF'},
  progressContainer: {
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#6A0DAD",
  }  
});

export default NoteScreen;
