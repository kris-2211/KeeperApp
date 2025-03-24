import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { IP_CONFIG } from '@env';
import { navigationRef } from './navigationRef';

const LOCATION_TASK_NAME = 'background-location-task';
let lastNotificationTime = 0;
const DEBOUNCE_INTERVAL = 60000; // 1 minute

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

    const currentTime = Date.now();
    if (currentTime - lastNotificationTime < DEBOUNCE_INTERVAL) {
      console.log('Debounced: Too soon to check for nearby notes again.');
      return;
    }

    const response = await axios.get(`http://${IP_CONFIG}:4000/api/notes/nearby`, {
      params: { latitude, longitude, radius: 500 }, // Adjust radius as needed
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.found) {
      const { notes } = response.data;
      if (notes.length > 0) {
        for (const note of notes) {
          await sendNotification(note);
        }
        lastNotificationTime = currentTime; // Update the last notification time
      }
    }
  } catch (error) {
    console.error('Error checking nearby notes:', error);
  }
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Function to send a notification
const sendNotification = async (note) => {
  console.log("Sending notification");
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nearby Note',
      body: `You are near the location of the note: ${note.title}`,
      data: { note },
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
      deferredUpdatesDistance: 100, // meters
      distanceInterval: 100, // Adjust distance interval as needed
    });
  } else {
    console.error('Location permission not granted');
  }
};

// Function to stop location tracking
export const stopLocationTracking = async () => {
  const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isTaskRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  } else {
    console.log(`Task '${LOCATION_TASK_NAME}' is not registered.`);
  }
};

// Handle notification response
Notifications.addNotificationResponseReceivedListener((response) => {
  const { note } = response.notification.request.content.data;
  if (note) {
    // Navigate to the NoteScreen with the note data
    navigationRef.navigate('Note', { note });
  }
});