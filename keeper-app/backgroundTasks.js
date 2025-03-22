import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { IP_CONFIG } from '@env';

const LOCATION_TASK_NAME = 'background-location-task';

// Define the background task for location tracking
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data;
    const [location] = locations;
    if (location) {
      const { latitude, longitude } = location.coords;
      await checkNearbyNotes(latitude, longitude);
    }
  }
});

// Function to check for nearby notes and send notifications
const checkNearbyNotes = async (latitude, longitude) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    const response = await axios.get(`http://${IP_CONFIG}:4000/api/notes/nearby`, {
      params: { latitude, longitude, radius: 500 }, // Adjust radius as needed
      headers: { Authorization: `Bearer ${token}` },
    });

    const { notes } = response.data;
    if (notes.length > 0) {
      for (const note of notes) {
        await sendNotification(note);
      }
    }
  } catch (error) {
    console.error('Error checking nearby notes:', error);
  }
};

// Function to send a notification
const sendNotification = async (note) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nearby Note',
      body: `You are near the location of the note: ${note.title}`,
      data: { noteId: note._id },
    },
    trigger: null,
  });
};

// Function to start location tracking in the background
export const startLocationTracking = async () => {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status === 'granted') {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 100, // Adjust distance interval as needed
    });
  } else {
    console.error('Location permission not granted');
  }
};

// Function to stop location tracking
export const stopLocationTracking = async () => {
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
};

// Handle notification response
Notifications.addNotificationResponseReceivedListener((response) => {
  const { noteId } = response.notification.request.content.data;
  if (noteId) {
    // Navigate to the NoteScreen with the noteId
    // Assuming you have a navigation reference set up
    navigationRef.current?.navigate('Note', { noteId });
  }
});