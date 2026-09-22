import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { API_BASE_URL } from "../../config/api";

// =====================================================
// TYPES
// =====================================================

type Profile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  vehicle_type: string;
  vehicle_number: string;
  license_number: string;
  availability_status: string;
  status: string;
};

// =====================================================
// COMPONENT
// =====================================================

export default function DeliveryProfile() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [state, setState] =
    useState("");

  const [vehicleType, setVehicleType] =
    useState("");

  const [vehicleNumber, setVehicleNumber] =
    useState("");

  const [licenseNumber, setLicenseNumber] =
    useState("");

  const [availability, setAvailability] =
    useState("Offline");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [changingAvailability, setChangingAvailability] =
    useState(false);

  // =====================================================
  // LOAD PROFILE
  // =====================================================

  const loadProfile = async () => {
    try {
      setLoading(true);

      const userData =
        await AsyncStorage.getItem(
          "loggedInUser"
        );

      if (!userData) {
        Alert.alert(
          "Login Required",
          "Please login again.",
          [
            {
              text: "OK",
              onPress: () =>
                router.replace("/login"),
            },
          ]
        );

        return;
      }

      let user: any;

      try {
        user = JSON.parse(userData);
      } catch {
        await AsyncStorage.multiRemove([
          "loggedInUser",
          "authToken",
          "userRole",
        ]);

        Alert.alert(
          "Session Error",
          "Please login again.",
          [
            {
              text: "OK",
              onPress: () =>
                router.replace("/login"),
            },
          ]
        );

        return;
      }

      // =================================================
      // CHECK ROLE
      // =================================================

      if (user?.role !== "delivery") {
        Alert.alert(
          "Access Denied",
          "Delivery partner login required.",
          [
            {
              text: "OK",
              onPress: () =>
                router.replace("/login"),
            },
          ]
        );

        return;
      }

      if (!user?.id) {
        throw new Error(
          "Delivery partner ID not found."
        );
      }

      // =================================================
      // GET TOKEN
      // =================================================

      const token =
        await AsyncStorage.getItem(
          "authToken"
        );

      console.log(
        "DELIVERY PROFILE - token exists:",
        token ? "YES" : "NO"
      );

      if (!token) {
        Alert.alert(
          "Login Required",
          "Your login session has expired. Please login again.",
          [
            {
              text: "OK",
              onPress: () =>
                router.replace("/login"),
            },
          ]
        );

        return;
      }

      console.log(
        "DELIVERY PROFILE - partner ID:",
        user.id
      );

      // =================================================
      // GET PROFILE
      // =================================================

      const response =
        await fetch(
          `${API_BASE_URL}/api/delivery/profile/${user.id}`,
          {
            method: "GET",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      let data: any;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Server returned an invalid profile response."
        );
      }

      console.log(
        "DELIVERY PROFILE RESPONSE:",
        data
      );

      console.log(
        "DELIVERY PROFILE HTTP STATUS:",
        response.status
      );

      // =================================================
      // API ERROR
      // =================================================

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to load profile. HTTP ${response.status}`
        );
      }

      if (data?.success === false) {
        throw new Error(
          data?.message ||
            "Failed to load profile."
        );
      }

      // =================================================
      // FIND PROFILE OBJECT
      // =================================================

      const p =
        data?.partner ||
        data?.profile ||
        data?.delivery_partner ||
        data?.deliveryPartner ||
        data?.user ||
        data?.data?.partner ||
        data?.data?.profile ||
        data?.data?.delivery_partner ||
        data?.data?.user ||
        data?.data ||
        null;

      const profileData =
        p ||
        (
          data &&
          (
            data.id !== undefined ||
            data.name !== undefined ||
            data.email !== undefined ||
            data.phone !== undefined
          )
            ? data
            : null
        );

      // =================================================
      // PROFILE NOT FOUND
      // =================================================

      if (!profileData) {
        console.error(
          "PROFILE OBJECT NOT FOUND:",
          JSON.stringify(
            data,
            null,
            2
          )
        );

        throw new Error(
          "Profile data not found in server response."
        );
      }

      // =================================================
      // NORMALIZE PROFILE
      // =================================================

      const normalizedProfile: Profile = {
        id:
          Number(
            profileData.id ||
              user.id
          ),

        name:
          profileData.name ||
          user.name ||
          "Delivery Partner",

        email:
          profileData.email ||
          user.email ||
          "",

        phone:
          profileData.phone ||
          profileData.mobile ||
          "",

        address:
          profileData.address ||
          "",

        city:
          profileData.city ||
          "",

        state:
          profileData.state ||
          "",

        vehicle_type:
          profileData.vehicle_type ||
          profileData.vehicleType ||
          "",

        vehicle_number:
          profileData.vehicle_number ||
          profileData.vehicleNumber ||
          "",

        license_number:
          profileData.license_number ||
          profileData.licenseNumber ||
          "",

        availability_status:
          profileData.availability_status ||
          profileData.availability ||
          user.availability_status ||
          "Offline",

        status:
          profileData.status ||
          "Active",
      };

      setProfile(
        normalizedProfile
      );

      // =================================================
      // SET FORM VALUES
      // =================================================

      setPhone(
        normalizedProfile.phone
      );

      setAddress(
        normalizedProfile.address
      );

      setCity(
        normalizedProfile.city
      );

      setState(
        normalizedProfile.state
      );

      setVehicleType(
        normalizedProfile.vehicle_type
      );

      setVehicleNumber(
        normalizedProfile.vehicle_number
      );

      setLicenseNumber(
        normalizedProfile.license_number
      );

      setAvailability(
        normalizedProfile.availability_status
      );

      console.log(
        "DELIVERY PROFILE - profile loaded:",
        normalizedProfile
      );
    } catch (error: any) {
      console.error(
        "Profile error:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "Unable to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadProfile();
  }, []);

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const saveProfile = async () => {
    if (!profile) {
      Alert.alert(
        "Error",
        "Profile information is not available."
      );

      return;
    }

    // =================================================
    // VALIDATION
    // =================================================

    if (!phone.trim()) {
      Alert.alert(
        "Required",
        "Please enter your phone number."
      );

      return;
    }

    if (!address.trim()) {
      Alert.alert(
        "Required",
        "Please enter your address."
      );

      return;
    }

    if (!city.trim()) {
      Alert.alert(
        "Required",
        "Please enter your city."
      );

      return;
    }

    if (!state.trim()) {
      Alert.alert(
        "Required",
        "State is required."
      );

      return;
    }

    if (!vehicleType.trim()) {
      Alert.alert(
        "Required",
        "Please enter vehicle type."
      );

      return;
    }

    if (!vehicleNumber.trim()) {
      Alert.alert(
        "Required",
        "Please enter vehicle number."
      );

      return;
    }

    if (!licenseNumber.trim()) {
      Alert.alert(
        "Required",
        "Please enter license number."
      );

      return;
    }

    try {
      setSaving(true);

      // =================================================
      // TOKEN
      // =================================================

      const token =
        await AsyncStorage.getItem(
          "authToken"
        );

      console.log(
        "SAVE DELIVERY PROFILE - token exists:",
        token ? "YES" : "NO"
      );

      if (!token) {
        throw new Error(
          "Login session expired. Please login again."
        );
      }

      // =================================================
      // UPDATE PROFILE
      // =================================================

      const response =
        await fetch(
          `${API_BASE_URL}/api/delivery/profile/${profile.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              phone:
                phone.trim(),

              address:
                address.trim(),

              city:
                city.trim(),

              state:
                state.trim(),

              vehicle_type:
                vehicleType.trim(),

              vehicle_number:
                vehicleNumber.trim(),

              license_number:
                licenseNumber.trim(),
            }),
          }
        );

      let data: any;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      console.log(
        "Save profile response:",
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to update profile."
        );
      }

      Alert.alert(
        "Success",
        "Profile updated successfully."
      );

      await loadProfile();
    } catch (error: any) {
      console.error(
        "Save profile error:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // TOGGLE AVAILABILITY
  // =====================================================

  const toggleAvailability = async () => {
    if (
      !profile ||
      changingAvailability
    ) {
      return;
    }

    if (
      availability === "Busy"
    ) {
      Alert.alert(
        "Currently Busy",
        "You cannot manually change availability while handling an active delivery."
      );

      return;
    }

    const newStatus =
      availability === "Online"
        ? "Offline"
        : "Online";

    try {
      setChangingAvailability(
        true
      );

      const token =
        await AsyncStorage.getItem(
          "authToken"
        );

      if (!token) {
        throw new Error(
          "Login session expired. Please login again."
        );
      }

      const response =
        await fetch(
          `${API_BASE_URL}/api/delivery/availability/${profile.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              availability_status:
                newStatus,
            }),
          }
        );

      let data: any;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      console.log(
        "Availability response:",
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Failed to update availability."
        );
      }

      const updatedStatus =
        data.availability_status ||
        newStatus;

      setAvailability(
        updatedStatus
      );

      setProfile(
        (previous) =>
          previous
            ? {
                ...previous,
                availability_status:
                  updatedStatus,
              }
            : previous
      );

      const userData =
        await AsyncStorage.getItem(
          "loggedInUser"
        );

      if (userData) {
        try {
          const user =
            JSON.parse(
              userData
            );

          user.availability_status =
            updatedStatus;

          await AsyncStorage.setItem(
            "loggedInUser",
            JSON.stringify(user)
          );
        } catch (
          storageError
        ) {
          console.error(
            "User storage update error:",
            storageError
          );
        }
      }

      Alert.alert(
        "Availability Updated",
        `You are now ${updatedStatus}.`
      );
    } catch (error: any) {
      console.error(
        "Availability error:",
        error
      );

      Alert.alert(
        "Error",
        error?.message ||
          "Unable to update availability."
      );
    } finally {
      setChangingAvailability(
        false
      );
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading profile...
        </Text>
      </View>
    );
  }

  // =====================================================
  // MAIN SCREEN
  // =====================================================

  return (
    <KeyboardAvoidingView
      style={
        styles.container
      }
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
      keyboardVerticalOffset={
        Platform.OS === "ios"
          ? 0
          : 20
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* =========================================
            HEADER
        ========================================= */}

        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              ‹
            </Text>
          </TouchableOpacity>

          <Text
            style={
              styles.headerTitle
            }
          >
            My Profile
          </Text>

          <View
            style={
              styles.headerSpacer
            }
          />
        </View>

        {/* =========================================
            PROFILE HEADER
        ========================================= */}

        <View
          style={
            styles.profileHeader
          }
        >
          <View
            style={
              styles.avatar
            }
          >
            <Text
              style={
                styles.avatarText
              }
            >
              {profile?.name
                ? profile.name
                    .charAt(0)
                    .toUpperCase()
                : "D"}
            </Text>
          </View>

          <Text
            style={
              styles.name
            }
          >
            {profile?.name ||
              "Delivery Partner"}
          </Text>

          <Text
            style={
              styles.email
            }
          >
            {profile?.email ||
              ""}
          </Text>

          <View
            style={[
              styles.statusBadge,
              availability ===
              "Online"
                ? styles.onlineBadge
                : availability ===
                  "Busy"
                ? styles.busyBadge
                : styles.offlineBadge,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                availability ===
                "Online"
                  ? styles.onlineDot
                  : availability ===
                    "Busy"
                  ? styles.busyDot
                  : styles.offlineDot,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                availability ===
                "Online"
                  ? styles.onlineText
                  : availability ===
                    "Busy"
                  ? styles.busyText
                  : styles.offlineText,
              ]}
            >
              {availability}
            </Text>
          </View>
        </View>

        {/* =========================================
            AVAILABILITY
        ========================================= */}

        <View
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Availability
          </Text>

          <View
            style={
              styles.availabilityCard
            }
          >
            <View
              style={
                styles.availabilityLeft
              }
            >
              <Text
                style={
                  styles.availabilityTitle
                }
              >
                {availability ===
                "Online"
                  ? "You are Online"
                  : availability ===
                    "Busy"
                  ? "You are Busy"
                  : "You are Offline"}
              </Text>

              <Text
                style={
                  styles.availabilityDescription
                }
              >
                {availability ===
                "Online"
                  ? "You can receive new delivery orders."
                  : availability ===
                    "Busy"
                  ? "You are currently handling an active delivery."
                  : "You will not receive new delivery orders."}
              </Text>
            </View>

            {changingAvailability ? (
              <ActivityIndicator
                size="small"
                color="#2563eb"
              />
            ) : (
              <Switch
                value={
                  availability ===
                  "Online"
                }
                onValueChange={
                  toggleAvailability
                }
                disabled={
                  availability ===
                  "Busy"
                }
                trackColor={{
                  false:
                    "#d1d5db",
                  true:
                    "#93c5fd",
                }}
                thumbColor={
                  availability ===
                  "Online"
                    ? "#2563eb"
                    : "#f4f4f5"
                }
              />
            )}
          </View>
        </View>

        {/* =========================================
            ACCOUNT INFORMATION
        ========================================= */}

        <View
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Account Information
          </Text>

          <View
            style={
              styles.readOnlyBox
            }
          >
            <Text
              style={
                styles.label
              }
            >
              Name
            </Text>

            <Text
              style={
                styles.readOnlyText
              }
            >
              {profile?.name ||
                ""}
            </Text>
          </View>

          <View
            style={
              styles.readOnlyBoxLast
            }
          >
            <Text
              style={
                styles.label
              }
            >
              Email
            </Text>

            <Text
              style={
                styles.readOnlyText
              }
            >
              {profile?.email ||
                ""}
            </Text>
          </View>
        </View>

        {/* =========================================
            CONTACT INFORMATION
        ========================================= */}

        <View
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Contact Information
          </Text>

          <Text
            style={
              styles.label
            }
          >
            Phone Number
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              phone
            }
            onChangeText={
              setPhone
            }
            placeholder="Enter phone number"
            placeholderTextColor="#9ca3af"
            keyboardType="phone-pad"
            editable={
              !saving
            }
          />

          <Text
            style={
              styles.label
            }
          >
            Address
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            value={
              address
            }
            onChangeText={
              setAddress
            }
            placeholder="Enter address"
            placeholderTextColor="#9ca3af"
            multiline
            editable={
              !saving
            }
          />

          <Text
            style={
              styles.label
            }
          >
            City
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              city
            }
            onChangeText={
              setCity
            }
            placeholder="Enter city"
            placeholderTextColor="#9ca3af"
            editable={
              !saving
            }
          />

          <Text
            style={
              styles.label
            }
          >
            State
          </Text>

          <TextInput
            style={
              styles.inputLast
            }
            value={
              state
            }
            placeholder="State"
            placeholderTextColor="#9ca3af"
            editable={false}
          />
        </View>

        {/* =========================================
            VEHICLE INFORMATION
        ========================================= */}

        <View
          style={
            styles.section
          }
        >
          <Text
            style={
              styles.sectionTitle
            }
          >
            Vehicle Information
          </Text>

          <Text
            style={
              styles.label
            }
          >
            Vehicle Type
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              vehicleType
            }
            onChangeText={
              setVehicleType
            }
            placeholder="Example: Bike, Scooter, Car"
            placeholderTextColor="#9ca3af"
            editable={
              !saving
            }
          />

          <Text
            style={
              styles.label
            }
          >
            Vehicle Number
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              vehicleNumber
            }
            onChangeText={
              setVehicleNumber
            }
            placeholder="Enter vehicle number"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            editable={
              !saving
            }
          />

          <Text
            style={
              styles.label
            }
          >
            License Number
          </Text>

          <TextInput
            style={
              styles.inputLast
            }
            value={
              licenseNumber
            }
            onChangeText={
              setLicenseNumber
            }
            placeholder="Enter license number"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            editable={
              !saving
            }
          />
        </View>

        {/* =========================================
            SAVE
        ========================================= */}

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving &&
              styles.disabledButton,
          ]}
          onPress={
            saveProfile
          }
          disabled={
            saving
          }
        >
          {saving ? (
            <>
              <ActivityIndicator
                color="#ffffff"
              />

              <Text
                style={
                  styles.saveLoadingText
                }
              >
                Saving...
              </Text>
            </>
          ) : (
            <Text
              style={
                styles.saveButtonText
              }
            >
              Save Changes
            </Text>
          )}
        </TouchableOpacity>

        <View
          style={
            styles.bottomSpace
          }
        />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        "#f5f7fb",
    },

    scrollContent: {
      paddingBottom: 80,
    },

    // =================================================
    // LOADING
    // =================================================

    loadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#f5f7fb",
    },

    loadingText: {
      marginTop: 10,
      fontSize: 15,
      color: "#555",
    },

    // =================================================
    // HEADER
    // =================================================

    header: {
      height: 65,
      backgroundColor:
        "#ffffff",
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        "#e5e7eb",
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        "#eef2ff",
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    backText: {
      fontSize: 32,
      lineHeight: 35,
      color: "#2563eb",
    },

    headerTitle: {
      fontSize: 21,
      fontWeight:
        "700",
      color: "#111827",
    },

    headerSpacer: {
      width: 42,
    },

    // =================================================
    // PROFILE HEADER
    // =================================================

    profileHeader: {
      backgroundColor:
        "#ffffff",
      alignItems:
        "center",
      paddingVertical: 25,
      marginBottom: 10,
    },

    avatar: {
      width: 82,
      height: 82,
      borderRadius: 41,
      backgroundColor:
        "#2563eb",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginBottom: 10,
    },

    avatarText: {
      fontSize: 34,
      fontWeight:
        "800",
      color: "#ffffff",
    },

    name: {
      fontSize: 22,
      fontWeight:
        "800",
      color: "#111827",
    },

    email: {
      fontSize: 14,
      color: "#6b7280",
      marginTop: 4,
    },

    statusBadge: {
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 10,
    },

    onlineBadge: {
      backgroundColor:
        "#dcfce7",
    },

    busyBadge: {
      backgroundColor:
        "#fff7ed",
    },

    offlineBadge: {
      backgroundColor:
        "#f3f4f6",
    },

    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 6,
    },

    onlineDot: {
      backgroundColor:
        "#16a34a",
    },

    busyDot: {
      backgroundColor:
        "#f97316",
    },

    offlineDot: {
      backgroundColor:
        "#6b7280",
    },

    statusText: {
      fontSize: 13,
      fontWeight:
        "700",
    },

    onlineText: {
      color: "#15803d",
    },

    busyText: {
      color: "#c2410c",
    },

    offlineText: {
      color: "#4b5563",
    },

    // =================================================
    // SECTION
    // =================================================

    section: {
      backgroundColor:
        "#ffffff",
      marginHorizontal: 16,
      marginTop: 12,
      padding: 18,
      borderRadius: 15,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight:
        "800",
      color: "#111827",
      marginBottom: 15,
    },

    // =================================================
    // AVAILABILITY
    // =================================================

    availabilityCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
    },

    availabilityLeft: {
      flex: 1,
      paddingRight: 10,
    },

    availabilityTitle: {
      fontSize: 16,
      fontWeight:
        "700",
      color: "#111827",
    },

    availabilityDescription: {
      fontSize: 13,
      color: "#6b7280",
      marginTop: 5,
      lineHeight: 19,
    },

    // =================================================
    // LABEL
    // =================================================

    label: {
      fontSize: 14,
      fontWeight:
        "600",
      color: "#374151",
      marginBottom: 7,
    },

    // =================================================
    // READ ONLY
    // =================================================

    readOnlyBox: {
      marginBottom: 15,
    },

    readOnlyBoxLast: {
      marginBottom: 0,
    },

    readOnlyText: {
      minHeight: 48,
      borderWidth: 1,
      borderColor:
        "#e5e7eb",
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 14,
      fontSize: 15,
      color: "#6b7280",
      backgroundColor:
        "#f9fafb",
    },

    // =================================================
    // INPUT
    // =================================================

    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor:
        "#d1d5db",
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 11,
      fontSize: 15,
      color: "#111827",
      backgroundColor:
        "#ffffff",
      marginBottom: 15,
    },

    inputLast: {
      minHeight: 48,
      borderWidth: 1,
      borderColor:
        "#d1d5db",
      borderRadius: 10,
      paddingHorizontal: 13,
      paddingVertical: 11,
      fontSize: 15,
      color: "#6b7280",
      backgroundColor:
        "#f9fafb",
    },

    multilineInput: {
      minHeight: 85,
      textAlignVertical:
        "top",
    },

    // =================================================
    // SAVE
    // =================================================

    saveButton: {
      marginHorizontal: 16,
      marginTop: 18,
      height: 52,
      borderRadius: 12,
      backgroundColor:
        "#2563eb",
      justifyContent:
        "center",
      alignItems:
        "center",
      flexDirection:
        "row",
    },

    disabledButton: {
      opacity: 0.7,
    },

    saveButtonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight:
        "800",
    },

    saveLoadingText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight:
        "700",
      marginLeft: 8,
    },

    bottomSpace: {
      height: 30,
    },
  });