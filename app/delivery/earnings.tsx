import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { API_BASE_URL } from "../../config/api";

type Earnings = {
  total_delivered_orders: number;
  total_delivery_amount: number;
  cod_collected: number;
  online_paid_amount: number;
};

export default function DeliveryEarnings() {
  const router = useRouter();

  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEarnings = async () => {
    try {
      const userData = await AsyncStorage.getItem("loggedInUser");
      const token = await AsyncStorage.getItem("authToken");

      if (!userData) {
        router.replace("/login");
        return;
      }

      const user = JSON.parse(userData);

      if (user.role !== "delivery") {
        Alert.alert("Access Denied", "Delivery partner login required.");
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/delivery/earnings/${user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load earnings");
      }

      setEarnings(data.earnings);
    } catch (error: any) {
      console.log("Earnings error:", error);
      Alert.alert(
        "Error",
        error.message || "Unable to load earnings."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEarnings();
  }, []);

  const formatAmount = (amount: number | undefined) => {
    return `₹${Number(amount || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading earnings...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>My Earnings</Text>

          <View style={{ width: 42 }} />
        </View>

        {/* Main Amount */}
        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>
            Total Delivered Order Amount
          </Text>

          <Text style={styles.mainAmount}>
            {formatAmount(earnings?.total_delivery_amount)}
          </Text>

          <Text style={styles.mainSubText}>
            From completed deliveries
          </Text>
        </View>

        {/* Delivered Orders */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✓</Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Delivered Orders
            </Text>

            <Text style={styles.cardValue}>
              {earnings?.total_delivered_orders || 0}
            </Text>

            <Text style={styles.cardDescription}>
              Total completed deliveries
            </Text>
          </View>
        </View>

        {/* COD Collected */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>₹</Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              COD Collected
            </Text>

            <Text style={styles.cardValue}>
              {formatAmount(earnings?.cod_collected)}
            </Text>

            <Text style={styles.cardDescription}>
              Cash collected from customers
            </Text>
          </View>
        </View>

        {/* Online Paid */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>▣</Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              Online Paid
            </Text>

            <Text style={styles.cardValue}>
              {formatAmount(earnings?.online_paid_amount)}
            </Text>

            <Text style={styles.cardDescription}>
              Orders already paid online
            </Text>
          </View>
        </View>

        {/* Information */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>
            Earnings Information
          </Text>

          <Text style={styles.infoText}>
            • Delivered orders are included in the total.
          </Text>

          <Text style={styles.infoText}>
            • COD amount shows cash collected from customers.
          </Text>

          <Text style={styles.infoText}>
            • Online paid amount shows orders paid online.
          </Text>
        </View>

        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  scrollContent: {
    paddingBottom: 30,
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

  mainCard: {
    margin: 16,
    padding: 25,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },

  mainLabel: {
    color: "#dbeafe",
    fontSize: 15,
    marginBottom: 8,
  },

  mainAmount: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "800",
  },

  mainSubText: {
    color: "#dbeafe",
    fontSize: 13,
    marginTop: 5,
  },

  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },

  iconText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#2563eb",
  },

  cardContent: {
    flex: 1,
    marginLeft: 15,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  cardValue: {
    fontSize: 23,
    fontWeight: "800",
    color: "#1f2937",
    marginTop: 3,
  },

  cardDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },

  infoBox: {
    margin: 16,
    marginTop: 8,
    padding: 18,
    borderRadius: 15,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },

  infoText: {
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 21,
    marginBottom: 3,
  },

  dashboardButton: {
    marginHorizontal: 16,
    marginTop: 5,
    backgroundColor: "#111827",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  dashboardButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});