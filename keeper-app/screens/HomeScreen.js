import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HomeScreen = ({ navigation }) => {
  // Set initial notes state
  const [notes, setNotes] = useState([
    { id: '1', title: 'Buy Groceries', content: 'Milk, Eggs, Bread' },
    { id: '2', title: 'Workout Plan', content: 'Push-ups, Squats, Running' },
    { id: '3', title: 'Project Idea', content: 'Build a note-taking app like Google Keep' },
    { id: '4', title: 'Long text', content: 'adkfldskalf jkdslajfkl dsjaklf jskldfj;klsdafj kldsfjdsajkl;fjds;klfjkldsasdaklf;kldsajf;kldsaj' }
  ]);

  // Function to truncate content and show preview (first 100 characters)
  const getPreview = (content) => {
    if (!content) return ''; // Return empty if there's no content

    // Limit the preview to the first 100 characters
    const preview = content.length > 30 ? content.substring(0, 30) + '...' : content;

    return preview;
  };

  return (
    <View style={styles.container}>
      {/* Notes List */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        numColumns={2} // Fixed number of columns
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.noteCard}
            onPress={() => navigation.navigate('Note', { note: item })} // Pass note data when navigating
          >
            <Text style={styles.noteTitle}>{item.title}</Text>
            <Text style={styles.noteContent}>
              {getPreview(item.content)} {/* Show preview */}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 80 }} // Add padding for the floating button
      />

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
  noteCard: {
    width: '45%', // Adjust based on the number of columns
    backgroundColor: '#FFEB3B',
    padding: 15,
    margin: 8,
    borderRadius: 10,
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333', // Add a darker color for better contrast
  },
  noteContent: {
    fontSize: 14,
    marginTop: 5,
    color: '#555', // Add a slightly lighter color for content
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
