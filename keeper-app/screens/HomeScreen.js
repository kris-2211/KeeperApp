import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IP_CONFIG } from '@env';
import { useFocusEffect } from '@react-navigation/native'; // Import for refreshing notes

const HomeScreen = ({ navigation }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState([]);

  // 🔄 Fetch Notes from Backend
  const fetchNotes = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        return;
      }
      const response = await axios.get(`http://${IP_CONFIG}:4000/api/notes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(response.data.notes);
      setFilteredNotes(response.data.notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // 👇 Run fetchNotes when the screen is focused (ensures data is fresh)
  useFocusEffect(
    React.useCallback(() => {
      fetchNotes();
    }, [])
  );

  // 🔍 Handle Search (Fix for structured content)
  useEffect(() => {
    const searchLower = searchQuery.toLowerCase();
    setFilteredNotes(
      notes.filter((note) =>
        note.title.toLowerCase().includes(searchLower) ||
        (note.content
          .map((item) => (item.type === "text" ? item.text.toLowerCase() : ""))
          .join(" ")
          .includes(searchLower))
      )
    );
  }, [searchQuery, notes]);

  // 📌 Extract text preview from structured content
  const getPreview = (content) => {
    const textItems = content.filter(item => item.type === "text").map(item => item.text);
    return textItems.length > 0 ? (textItems[0].length > 30 ? textItems[0].substring(0, 30) + '...' : textItems[0]) : "No text content";
  };

  return (
    <View style={styles.container}>
      {/* 🔎 Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search notes..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* ⏳ Show Loading Indicator */}
      {loading ? (
        <ActivityIndicator size="large" color="#FF9800" />
      ) : filteredNotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notes found. Create one!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
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

      {/* ➕ Floating Add Button */}
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
    backgroundColor: '#F4F0FA', // Light purple background
  },
  searchBar: {
    height: 40,
    borderColor: '#A780D5', // Soft purple border
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#6A0DAD', // Deep purple text
    textAlign: 'center',
  },
  noteCard: {
    width: '45%',
    backgroundColor: '#D8BFD8', // Light lavender card
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
    color: '#4B0082', // Dark purple title
  },
  noteContent: {
    fontSize: 14,
    marginTop: 5,
    color: '#4B0082', // Dark purple content
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#6A0DAD', // Deep purple floating button
    padding: 15,
    borderRadius: 50,
    elevation: 5,
  },
});
