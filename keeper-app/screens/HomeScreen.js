import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch notes from backend
  useEffect( () => {
    
    const fetchNotes = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
    
        if (!token) {
          console.error("No token found");
          return;
        }
    
        // Make request with token in headers
        const response = await axios.get("http://192.168.29.79:4000/api/notes/", {
          headers: {
            Authorization: `Bearer ${token}`, // Include token
          },
        });
        setNotes(response.data.notes);
      } catch (error) {
        // Alert.alert('Error', 'Failed to fetch notes');
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };
    
   fetchNotes();
  }, []);
  
  // Function to truncate content and show preview (first 30 characters)
  const getPreview = (content) => {
    if (!content) return '';
    return content.length > 30 ? content.substring(0, 30) + '...' : content;
  };

  return (
    <View style={styles.container}>
      {/* Show loader while fetching notes */}
      {loading ? (
        <ActivityIndicator size="large" color="#FF9800" />
      ) : notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notes found. Create one!</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item._id}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.noteCard}
              onPress={() => navigation.navigate('Note', { note: item })}
            >
              <Text style={styles.noteTitle}>{item.title}</Text>
              <Text style={styles.noteContent}>{getPreview(item.content)}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Note')}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
  },
  noteCard: {
    width: '45%',
    backgroundColor: '#FFEB3B',
    padding: 15,
    margin: 8,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  noteContent: {
    fontSize: 14,
    marginTop: 5,
    color: '#555',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },
});
