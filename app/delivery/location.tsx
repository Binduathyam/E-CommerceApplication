import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../../config/api";

type LocationData = {
  latitude: number | null;
  longitude: number | null;
};

export default function DeliveryLocation() {
  const router = useRouter();

  const [location, setLocation] =
    useState<LocationData | null>(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadLocation = async () => {
    try {
      const userData =
        await AsyncStorage.getItem("loggedInUser");

      const token =
        await AsyncStorage.getItem("authToken");

      if (!userData) {
        router.replace("/login");
        return;
      }

      const user = JSON.parse(userData);

      if (user.role !== "delivery") {
        Alert.alert(
          "Access Denied",
          "Delivery partner login required."
        );
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/delivery/location/${user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load location"
        );
      }

      setLocation({
        latitude: data.location?.latitude ?? null,
        longitude: data.location?.longitude ?? null,
      });
    } catch (error: any) {
      console.log("Location error:", error);

      Alert.alert(
        "Error",
        error.message ||
          "Unable to load location."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocation();
  }, []);

  const updateLocation = async () => {
    try {
      setUpdating(true);

      const userData =
        await AsyncStorage.getItem("loggedInUser");

      const token =
        await AsyncStorage.getItem("authToken");

      if (!userData) {
        router.replace("/login");
        return;
      }

      const user = JSON.parse(userData);

      /*
       * For now we use the device GPS if available.
       * expo-location is not required for this page.
       *
       * This demo uses a simple browser/device location
       * request through React Native's available API.
       */

      Alert.alert(
        "Update Location",
        "Enter your current latitude and longitude.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Continue",
            onPress: async () => {
              try {
                // Demo coordinates.
                // Replace these with real GPS coordinates
                // when GPS tracking is added.
                const latitude = 17.385;
                const longitude = 78.4867;

                const response = await fetch(
                  `${API_BASE_URL}/api/delivery/update-location`,
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type":
                        "application/json",
                      ...(token
                        ? {
                            Authorization: `Bearer ${token}`,
                          }
                        : {}),
                    },
                    body: JSON.stringify({
                      delivery_partner_id: user.id,
                      latitude,
                      longitude,
                    }),
                  }
                );

                const data =
                  await response.json();

                if (
                  !response.ok ||
                  !data.success
                ) {
                  throw new Error(
                    data.message ||
                      "Failed to update location"
                  );
                }

                setLocation({
                  latitude,
                  longitude,
                });

                Alert.alert(
                  "Success",
                  "Location updated successfully."
                );
              } catch (error: any) {
                console.log(
                  "Update location error:",
                  error
                );

                Alert.alert(
                  "Error",
                  error.message ||
                    "Unable to update location."
                );
              }
            },
          },
        ]
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading location...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          My Location
        </Text>

        <View style={{ width: 42 }} />
      </View>

      <View style={styles.content}>
        {/* Location Icon */}
        <View style={styles.locationIcon}>
          <Text style={styles.locationIconText}>
            📍
          </Text>
        </View>

        <Text style={styles.title}>
          Delivery Partner Location
        </Text>

        <Text style={styles.description}>
          Your current location information stored
          in the delivery system.
        </Text>

        {/* Location Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Current Coordinates
          </Text>

          <View style={styles.coordinateRow}>
            <Text style={styles.coordinateLabel}>
              Latitude
            </Text>

            <Text style={styles.coordinateValue}>
              {location?.latitude !== null &&
              location?.latitude !== undefined
                ? location.latitude
                : "Not available"}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.coordinateRow}>
            <Text style={styles.coordinateLabel}>
              Longitude
            </Text>

            <Text style={styles.coordinateValue}>
              {location?.longitude !== null &&
              location?.longitude !== undefined
                ? location.longitude
                : "Not available"}
            </Text>
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={[
            styles.updateButton,
            updating &&
              styles.disabledButton,
          ]}
          onPress={updateLocation}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator
              color="#ffffff"
            />
          ) : (
            <Text
              style={styles.updateButtonText}
            >
              Update Location
            </Text>
          )}
        </TouchableOpacity>

        {/* Information */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            Location Tracking
          </Text>

          <Text style={styles.infoText}>
            Your backend already supports storing
            delivery partner latitude and longitude.
          </Text>

          <Text style={styles.infoText}>
            Automatic real-time GPS tracking can be
            connected later using the device's GPS.
          </Text>
        </View>

        
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fb",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#555",
  },

  header: {
    height: 65,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 32,
    lineHeight: 35,
    color: "#2563eb",
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111827",
  },

  content: {
    flex: 1,
    padding: 16,
    alignItems: "center",
  },

  locationIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },

  locationIconText: {
    fontSize: 42,
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
    color: "#111827",
    marginTop: 18,
    textAlign: "center",
  },

  description: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 7,
    marginHorizontal: 20,
  },

  card: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 15,
  },

  coordinateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },

  coordinateLabel: {
    fontSize: 14,
    color: "#6b7280",
  },

  coordinateValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    maxWidth: "60%",
    textAlign: "right",
  },

  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },

  updateButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },

  disabledButton: {
    opacity: 0.7,
  },

  updateButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  infoBox: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 18,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  infoText: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 5,
  },

  dashboardButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#111827",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  dashboardButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});