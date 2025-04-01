import React, { useRef, useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { IP_CONFIG } from "@env";
import { WebView } from "react-native-webview";

// HTML for the custom rich text editor
const editorHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: sans-serif; padding: 10px; margin: 0; }
    #editor { 
      min-height: 250px; 
      border: none; 
      padding: 10px; 
      outline: none; 
      font-size: 16px;
      line-height: 24px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div id="editor" contenteditable="true"></div>
  <script>
    function sendContent() {
      window.ReactNativeWebView.postMessage(document.getElementById('editor').innerHTML);
    }

    function updateToolbar() {
      const toolbarState = JSON.stringify({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      });
      window.ReactNativeWebView.postMessage(toolbarState);
    }

    document.getElementById('editor').addEventListener('input', () => {
      sendContent();
      updateToolbar();
    });

    document.addEventListener("message", function(event) {
      const command = event.data;
      document.execCommand(command, false, null);
      sendContent();
      updateToolbar();
    });
  </script>
</body>
</html>
`;

const NoteScreen = ({ route, navigation }) => {
  const { note } = route.params || {};
  const webViewRef = useRef(null);
  const [title, setTitle] = useState(note ? note.title : "");
  const [content, setContent] = useState(note ? note.content : "");
  const [checklist, setChecklist] = useState(note ? note.checklist || [] : []);
  const [toolbarState, setToolbarState] = useState({
    bold: false,
    italic: false,
    underline: false,
  });
  const [location, setLocation] = useState(note?.location || { type: "Point", coordinates: [0, 0] });
  const [collaborators, setCollaborators] = useState(note?.collaborators || []);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [currentUser, setCurrentUser] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const initialContentInjected = useRef(false);
  const [user, setUser] = useState({ fullname: "", email: "", avatar: "default.png" });
  // Update content from the RTE
  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (typeof data === "object" && data !== null) {
        setToolbarState(data);
        return;
      }
    } catch (error) {
      setContent(event.nativeEvent.data);
    }
  };

  // Send commands to the editor
  const sendCommand = (command) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(command);
    }
  };
  useEffect(() => {
      const fetchUserProfile = async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            Alert.alert("Error", "No token found. Please log in again.");
            return;
          }
  
          const response = await axios.get(`http://${IP_CONFIG}:4000/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (response.data.success) {
            setUser(response.data.user);
            setCurrentUser(response.data.user.email);
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        } finally {
          setLoading(false);
        }
      };
      const fetchOwner = async () => {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Error", "No token found. Please log in again.");
          return;
        }

        const response = await axios.get(`http://${IP_CONFIG}:4000/api/notes/${note._id}/owner`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setOwnerEmail(response.data.owner.email);
        }
      }
      fetchOwner();
      fetchUserProfile();
    }, []);
  // Inject content into the WebView when the component mounts or when the note is loaded
  useEffect(() => {
    if (webViewRef.current && !initialContentInjected.current) {
      webViewRef.current.injectJavaScript(`document.getElementById("editor").innerHTML = ${JSON.stringify(content)}; true;`);
      initialContentInjected.current = true;
    }
  }, [note]);

  // Checklist functions
  const addChecklistItem = () => {
    setChecklist([...checklist, { text: "", checked: false }]);
  };

  const toggleCheckbox = (index) => {
    const updatedChecklist = checklist.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updatedChecklist);
  };

  const updateChecklistText = (index, text) => {
    const updatedChecklist = checklist.map((item, i) =>
      i === index ? { ...item, text } : item
    );
    setChecklist(updatedChecklist);
  };

  const deleteChecklistItem = (index) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  // Calculate checklist completion percentage
  const completionPercentage = checklist.length
    ? (checklist.filter((item) => item.checked).length / checklist.length) * 100
    : 0;
  // Save Note
  const saveNote = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      alert("Error: Authentication token is missing. Please log in again.");
      return;
    }

    const newNote = { title, content, checklist, location, collaborators };
    const url = note
      ? `http://${IP_CONFIG}:4000/api/notes/${note._id}`
      : `http://${IP_CONFIG}:4000/api/notes`;
    const method = note ? "put" : "post";
    try {
      await axios({
        method,
        url,
        data: newNote,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      alert(note ? "Note updated" : "New note created");
      navigation.navigate("Home", { refresh: true });
    } catch (err) {
      alert(err || "Error saving note.");
    }
  };

  // Delete Note
  const deleteNote = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      alert("Error: Authentication token is missing. Please log in again.");
      return;
    }
    try {
      await axios.delete(`http://${IP_CONFIG}:4000/api/notes/${note._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Note deleted");
      navigation.navigate("Home", { refresh: true });
    } catch (err) {
      alert("Error deleting note.");
    }
  };

  // Navigate to Location Picker
  const pickLocation = () => {
    navigation.navigate("LocationPicker", {
      setLocation,
      initialLocation: location,
    });
  };

  // Add Collaborator
  const addCollaborator = async () => {
    if (!collaboratorEmail) {
      alert("Enter a valid email");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.put(
        `http://${IP_CONFIG}:4000/api/notes/${note._id}/add-collaborator`,
        { collaboratorEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCollaborators(response.data.note.collaborators);
      setCollaboratorEmail("");
      alert("Collaborator added successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Error adding collaborator");
    }
  };

  // Remove Collaborator
  const removeCollaborator = async (email) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await axios.put(
        `http://${IP_CONFIG}:4000/api/notes/${note._id}/remove-collaborator`,
        { collaboratorEmail: email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCollaborators(response.data.note.collaborators);
      alert("Collaborator removed successfully");
    } catch (error) {
      alert(error.response?.data?.message || "Error removing collaborator");
    }
  };
  collaborators.forEach(collaborator => {
    if (collaborator === ownerEmail) {
      console.log("Owner: " + collaborator);
    } else {
      console.log("Not Owner");
    }
  });
  console.log(collaborators);
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
      >
        <View style={styles.titleContainer}>
          <TextInput
            style={styles.title}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
          />
          <TouchableOpacity onPress={pickLocation}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#6A0DAD" />
          </TouchableOpacity>
        </View>

        {/* Rich Text Editor Toolbar */}
        <View style={styles.toolbar}>
          {[
            { command: "bold", icon: "format-bold", active: toolbarState.bold },
            { command: "italic", icon: "format-italic", active: toolbarState.italic },
            { command: "underline", icon: "format-underline", active: toolbarState.underline },
            { command: "insertUnorderedList", icon: "format-list-bulleted" },
            { command: "insertOrderedList", icon: "format-list-numbered" },
          ].map(({ command, icon, active }) => (
            <TouchableOpacity
              key={command}
              onPress={() => sendCommand(command)}
              style={[styles.toolbarButton, active && styles.activeButton]}
            >
              <MaterialCommunityIcons name={icon} size={20} color="#6A0DAD" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Rich Text Editor */}
        <View style={styles.editorContainer}>
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: editorHtml }}
            onMessage={onMessage}
            javaScriptEnabled
            style={styles.webView}
          />
        </View>

        {/* Checklist Section */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>List</Text>
          <TouchableOpacity onPress={addChecklistItem}>
            <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#6A0DAD" />
          </TouchableOpacity>
        </View>

        <View>
          {checklist.map((item, index) => (
            <View key={index} style={styles.checklistItem}>
              <TouchableOpacity onPress={() => toggleCheckbox(index)}>
                <MaterialCommunityIcons
                  name={item.checked ? "checkbox-marked-outline" : "checkbox-blank-outline"}
                  size={24}
                  color="#6A0DAD"
                />
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.checklistText,
                  item.checked && styles.checkedText,
                ]}
                value={item.text}
                onChangeText={(text) => updateChecklistText(index, text)}
                placeholder="Checklist item"
              />
              <TouchableOpacity onPress={() => deleteChecklistItem(index)}>
                <MaterialCommunityIcons name="trash-can-outline" size={22} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Progress Bar */}
        {checklist.length > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${completionPercentage}%` }]} />
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
          <Text style={styles.buttonText}>{note ? "Save Changes" : "Add Note"}</Text>
        </TouchableOpacity>

        {/* Delete Button (only show if editing an existing note) */}
        {note && (
          <TouchableOpacity style={styles.deleteButton} onPress={deleteNote}>
            <Text style={styles.deleteButtonText}>Delete Note</Text>
          </TouchableOpacity>
        )}

        {/* Collaborators Section (only show if editing an existing note) */}
        {note && (
          <View style={styles.collaboratorContainer}>
            <Text style={styles.collaboratorTitle}>Collaborators</Text>

            {/* Input to Add New Collaborator */}
            <TextInput
              style={styles.collaboratorInput}
              placeholder="Enter collaborator's email"
              value={collaboratorEmail}
              onChangeText={setCollaboratorEmail}
            />
            <TouchableOpacity style={styles.addButton} onPress={addCollaborator}>
              <Text style={styles.buttonText}>Add Collaborator</Text>
            </TouchableOpacity>

            {/* List of Added Collaborators */}
            {collaborators.length > 1 ? (
              collaborators.map((email, index) => (
                (user.email !== email) &&
                <View key={index} style={styles.collaboratorItem}>
                  <Text>{email} { (email === ownerEmail) && 
                    <MaterialCommunityIcons name="crown" size={20} color="gold" />
                  }
                  </Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeCollaborator(email)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={{ color: "#6A0DAD", textAlign: "center", marginTop: 10 }}>
                No collaborators added yet
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F0FA" },
  scrollContainer: { flexGrow: 1, padding: 20 },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    height: 50,
    fontSize: 20,
    borderColor: "#A780D5",
    borderWidth: 1,
    paddingLeft: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
    flex: 1,
    marginRight: 10,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#f3f3f3",
    marginBottom: 10,
  },
  toolbarButton: {
    padding: 10,
    borderRadius: 5,
  },
  activeButton: {
    backgroundColor: "#ddd",
  },
  editorContainer: {
    flex: 1,
    minHeight: 250,
    borderColor: "#A780D5",
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  listTitle: { fontSize: 18, fontWeight: "bold", color: "#6A0DAD" },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  checklistText: { flex: 1, marginLeft: 10, fontSize: 16, color: "#000" },
  checkedText: { color: "gray" },
  progressContainer: {
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    marginVertical: 10,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#6A0DAD",
  },
  saveButton: {
    backgroundColor: "#6A0DAD",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "white", fontWeight: "bold" },
  deleteButton: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  deleteButtonText: { color: "white", fontWeight: "bold" },
  collaboratorContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#A780D5",
  },
  collaboratorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#6A0DAD",
    marginBottom: 10,
  },
  collaboratorInput: {
    height: 40,
    borderColor: "#A780D5",
    borderWidth: 1,
    paddingLeft: 10,
    borderRadius: 5,
    backgroundColor: "#F4F0FA",
    marginBottom: 10,
  },
  collaboratorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderColor: "#E0E0E0",
  },
  removeButton: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: "red",
  },
  removeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#6A0DAD",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
});

export default NoteScreen;