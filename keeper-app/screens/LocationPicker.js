import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setRegion({
        ...region,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const handleSearch = async () => {
    try {
      let geocode = await Location.geocodeAsync(search);
      if (geocode.length > 0) {
        const { latitude, longitude } = geocode[0];
        setRegion({
          ...region,
          latitude,
          longitude,
        });
        setMarker([longitude, latitude]);
      } else {
        alert("Location not found");
      }
    } catch (error) {
      alert("Error searching location");
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
          onChangeText={setSearch}
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <MaterialCommunityIcons name="magnify" size={24} color="#6A0DAD" />
        </TouchableOpacity>
      </View>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={(e) => setMarker([e.nativeEvent.coordinate.longitude, e.nativeEvent.coordinate.latitude])}
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