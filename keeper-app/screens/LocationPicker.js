import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import axios from "axios";
import { GOOGLE_MAPS_API_KEY } from "@env";

const LocationPicker = ({ route, navigation }) => {
  const { setLocation, initialLocation } = route.params;
  const [region, setRegion] = useState({
    latitude: initialLocation ? initialLocation.coordinates[1] : 37.78825,
    longitude: initialLocation ? initialLocation.coordinates[0] : -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [marker, setMarker] = useState(initialLocation ? initialLocation.coordinates : null);
  const [search, setSearch] = useState("");
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setRegion({
        ...region,
        latitude,
        longitude,
      });

      // Set the initial marker to the user's current location
      setMarker([longitude, latitude]);
    })();
  }, []);

  const handleSearch = async (text) => {
    setSearch(text);
    if (text.length > 2) {
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
          {
            params: {
              input: text,
              key: GOOGLE_MAPS_API_KEY,
              location: `${region.latitude},${region.longitude}`,
              radius: 50000, // 50 km radius
            },
          }
        );
        setPredictions(response.data.predictions.slice(0, 3)); // Top 3 results
      } catch (error) {
        console.error("Error fetching autocomplete predictions:", error);
      }
    } else {
      setPredictions([]);
    }
  };

  const handleSelectPrediction = async (placeId) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: GOOGLE_MAPS_API_KEY,
          },
        }
      );
      const { lat, lng } = response.data.result.geometry.location;
      setRegion({
        ...region,
        latitude: lat,
        longitude: lng,
      });
      setMarker([lng, lat]);
      setSearch(response.data.result.name);
      setPredictions([]);
    } catch (error) {
      console.error("Error fetching place details:", error);
    }
  };

  const handleSaveLocation = () => {
    if (marker) {
      setLocation({
        type: "Point",
        coordinates: marker,
      });
      navigation.goBack();
    } else {
      alert("Please select a location");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a location"
          value={search}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton}>
          <MaterialCommunityIcons name="magnify" size={24} color="#6A0DAD" />
        </TouchableOpacity>
      </View>
      {predictions.length > 0 && (
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.predictionItem}
              onPress={() => handleSelectPrediction(item.place_id)}
            >
              <Text style={styles.predictionText}>{item.description}</Text>
            </TouchableOpacity>
          )}
          style={styles.predictionsList}
        />
      )}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsMyLocationButton={true}
        showsUserLocation={true}
        onRegionChangeComplete={setRegion}
        onPress={(e) =>
          setMarker([e.nativeEvent.coordinate.longitude, e.nativeEvent.coordinate.latitude])
        }
      >
        {marker && (
          <Marker
            coordinate={{
              latitude: marker[1],
              longitude: marker[0],
            }}
          />
        )}
      </MapView>
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveLocation}>
        <Text style={styles.saveButtonText}>Save Location</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  searchButton: {
    marginLeft: 10,
  },
  predictionsList: {
    backgroundColor: "#fff",
    position: "absolute",
    top: 60,
    left: 10,
    right: 10,
    zIndex: 1,
    borderRadius: 5,
    elevation: 3,
  },
  predictionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  predictionText: {
    fontSize: 16,
  },
  map: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: "#6A0DAD",
    padding: 15,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default LocationPicker;