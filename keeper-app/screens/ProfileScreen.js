import React, { useEffect, useState } from "react";
import { Modal, ScrollView } from "react-native";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Import the icon component
import { IP_CONFIG } from "@env";

// Import Local Avatars
import defaultAvatar from "../assets/avatars/default.png";

const ProfileScreen = () => {
  const [user, setUser] = useState({ fullname: "", email: "", avatar: "default.png" });
  const [loading, setLoading] = useState(true);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

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
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        Alert.alert("Error", "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Select and Change Avatar Locally
  const pickImage = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Allow access to your gallery to change profile picture.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setUser({ ...user, avatar: result.assets[0].uri });
    }
  };

  const viewImage = () => {
    setIsModalVisible(true);
  };

  // Get Avatar Source (Local or User-Selected)
  const getAvatarSource = () => {
    if (user.avatar === "default.png") {
      return defaultAvatar;
    } else {
      return { uri: user.avatar };
    }
  };

  // Update Full Name & Email
  const handleUpdateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "No token found. Please log in again.");
        return;
      }

      const response = await axios.get(`http://${IP_CONFIG}:4000/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const originalUser = response.data.user;

      if (
        originalUser.fullname === user.fullname &&
        originalUser.email === user.email &&
        originalUser.avatar === user.avatar
      ) {
        Alert.alert("", "No updates made");
        setIsEditing(!isEditing);
        return;
      }

      await axios.put(
        `http://${IP_CONFIG}:4000/api/auth/update-profile`,
        { fullname: user.fullname, email: user.email, avatar: user.avatar },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Profile updated successfully.");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert("Error", "Please enter both old and new passwords.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `http://${IP_CONFIG}:4000/api/auth/change-password`,
        { oldPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setShowPasswordFields(false);
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Error", "Failed to change password.");
    }
  };

  if (loading) {
    return (
      <View style={styles.profileContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.profileContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>User Profile</Text>
        </View>

        {/* Avatar at the Top */}
        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={isEditing ? pickImage : viewImage}>
            <Image source={getAvatarSource()} style={styles.avatar} />
          </TouchableOpacity>
          {isEditing && ( // Show edit icon only in editing mode
            <View style={styles.editIconContainer}>
              <MaterialCommunityIcons name="pencil" size={20} color="#6A0DAD" onPress={pickImage}/>
            </View>
          )}
        </View>

        {/* Full-Screen Image Modal */}
        <Modal visible={isModalVisible} transparent={true}>
          <TouchableOpacity style={styles.modalContainer} onPress={() => setIsModalVisible(false)}>
            <Image source={getAvatarSource()} style={styles.fullscreenImage} />
          </TouchableOpacity>
        </Modal>

        {/* Full Name - Editable */}
        <TextInput
          style={[styles.input, isEditing ? styles.editableInput : styles.nonEditableInput]}
          value={user.fullname}
          onChangeText={(text) => setUser({ ...user, fullname: text })}
          editable={isEditing}
          placeholder="Full Name"
          placeholderTextColor="#888"
        />

        {/* Email - Editable */}
        {isEditing ? (
          <TextInput
            style={[styles.input, styles.editableInput]}
            value={user.email}
            onChangeText={(text) => setUser({ ...user, email: text })}
            editable={isEditing}
            placeholder="Email"
            placeholderTextColor="#888"
          />
        ) : (
          <View style={styles.emailContainer}>
            <Text style={styles.emailLabel}>Email: </Text>
            <Text style={styles.emailText}>{user.email}</Text>
          </View>
        )}

        {/* Edit/Save Button */}
        <TouchableOpacity
          style={[styles.editButton, isEditing ? styles.saveButton : {}]}
          onPress={() => (isEditing ? handleUpdateProfile() : setIsEditing(true))}
        >
          <Text style={styles.buttonText}>{isEditing ? "Save Changes" : "Edit Profile"}</Text>
        </TouchableOpacity>

        {/* Change Password Section */}
        <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPasswordFields(!showPasswordFields)}>
          <Text style={styles.passwordToggleText}>{showPasswordFields ? "Change Password (Hide)" : "Change Password"} </Text>
        </TouchableOpacity>

        {showPasswordFields && (
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Old Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              style={styles.passwordInput}
              placeholder="New Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity style={styles.changePasswordButton} onPress={handleChangePassword}>
              <Text style={styles.buttonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    width: "120%",
    alignItems: "center",
    marginTop: -20,
    paddingVertical: 20,
    backgroundColor: "#4B0082",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
  },
  profileContainer: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255, 182, 193, 0.3)",
    padding: 20,
  },
  avatarWrapper: {
    position: "relative", // Required for absolute positioning of the edit icon
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#6A0DAD",
  },
  editIconContainer: {
    position: "absolute",
    top: "50%", // Center vertically
    left: "18%", // Center horizontally
    transform: [{ translateX: -10 }, { translateY: -10 }],
    opacity : 0.7, // Adjust based on icon size
    backgroundColor: "white",
    borderRadius: 10,
    padding: 5,
    elevation: 3, // For shadow (Android)
    shadowColor: "#000", // For shadow (iOS)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  input: {
    width: "100%",
    height: 50,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  nonEditableInput: {
    backgroundColor: "transparent",
    borderWidth: 0,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#4B0082",
  },
  editableInput: {
    backgroundColor: "#FFF",
    borderColor: "#6A0DAD",
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  emailLabel: {
    fontSize: 16,
    color: "#4B0082",
    fontWeight: "bold",
  },
  emailText: {
    fontSize: 16,
    color: "#4B0082",
  },
  editButton: {
    backgroundColor: "#6A0DAD",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
    marginTop: 10,
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  passwordToggle: {
    marginBottom: 15,
  },
  passwordToggleText: {
    color: "#6A0DAD",
    fontSize: 14,
    fontWeight: "bold",
  },
  passwordContainer: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    elevation: 3,
  },
  passwordInput: {
    width: "100%",
    height: 50,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: "#F4F0FA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  changePasswordButton: {
    backgroundColor: "#6A0DAD",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: "center",
    elevation: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
  },
  loadingText: {
    fontSize: 18,
    color: "#4B0082",
  },
});

export default ProfileScreen;