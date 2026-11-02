import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import LiveTour from "../../components/LiveTour";
import { API_BASE_URL } from "../../config/api";
import useExitOnBack from "../../hooks/useExitOnBack";

// =====================================================
// TYPES
// =====================================================

type DeliveryPartner = {
  id: number;
  name: string;
  email: string;
  phone: string;
  availability_status: "Online" | "Offline" | "Busy";
};

type DashboardData = {
  total_orders: number;
  assigned: number;
  accepted: number;
  picked_up: number;
  out_for_delivery: number;
  delivered: number;
};

type TodaySummary = {
  orders_assigned_today: number;
  delivered_today: number;
  active_orders_today: number;
};

// =====================================================
// COMPONENT
// =====================================================

export default function DeliveryDashboard() {
  const router = useRouter();

  // Back press on this dashboard shows "Exit App?"
  // (hooks must be called INSIDE the component)
  useExitOnBack();

  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  // LIVE TOUR
  const [showLiveTour, setShowLiveTour] = useState(true);

  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  const loadDashboard = async () => {
    try {
      // ---------- GET LOGGED-IN USER ----------

      const savedUser = await AsyncStorage.getItem("loggedInUser");

      if (!savedUser) {
        Alert.alert("Login Required", "Please login again.", [
          { text: "OK", onPress: () => router.replace("/login") },
        ]);

        return;
      }

      let user: any;

      try {
        user = JSON.parse(savedUser);
      } catch {
        await AsyncStorage.multiRemove([
          "loggedInUser",
          "authToken",
          "userRole",
        ]);

        Alert.alert("Session Error", "Please login again.", [
          { text: "OK", onPress: () => router.replace("/login") },
        ]);

        return;
      }

      // ---------- CHECK DELIVERY ROLE ----------

      if (user?.role !== "delivery") {
        Alert.alert(
          "Access Denied",
          "This page is only for delivery partners.",
          [{ text: "OK", onPress: () => router.replace("/login") }]
        );

        return;
      }

      const deliveryPartnerId = user.id;

      if (!deliveryPartnerId) {
        throw new Error("Delivery partner ID not found.");
      }

      // ---------- GET JWT TOKEN ----------

      const token = await AsyncStorage.getItem("authToken");

      console.log("DELIVERY DASHBOARD - token exists:", token ? "YES" : "NO");

      if (!token) {
        Alert.alert(
          "Login Required",
          "Your login session has expired. Please login again.",
          [{ text: "OK", onPress: () => router.replace("/login") }]
        );

        return;
      }

      // ---------- COMMON HEADERS ----------

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      console.log("Delivery Partner ID:", deliveryPartnerId);

      // ---------- DASHBOARD API ----------

      const dashboardResponse = await fetch(
        `${API_BASE_URL}/api/delivery/dashboard/${deliveryPartnerId}`,
        { method: "GET", headers }
      );

      const dashboardData = await dashboardResponse.json();

      console.log("Delivery dashboard:", dashboardData);

      if (!dashboardResponse.ok || !dashboardData.success) {
        throw new Error(dashboardData.message || "Failed to load dashboard");
      }

      setPartner(dashboardData.delivery_partner);
      setDashboard(dashboardData.dashboard);

      // ---------- TODAY SUMMARY API ----------

      const summaryResponse = await fetch(
        `${API_BASE_URL}/api/delivery/today-summary/${deliveryPartnerId}`,
        { method: "GET", headers }
      );

      const summaryData = await summaryResponse.json();

      console.log("Today summary:", summaryData);

      if (summaryResponse.ok && summaryData.success) {
        setTodaySummary(summaryData.today_summary);
      } else {
        setTodaySummary(null);
      }
    } catch (error) {
      console.error("Delivery dashboard error:", error);

      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    loadDashboard();
  }, []);

  // REFRESH
  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // ===================================================
  // AVAILABILITY
  // ===================================================

  const handleAvailabilityChange = async (value: boolean) => {
    if (!partner) {
      return;
    }

    // BUSY CHECK
    if (partner.availability_status === "Busy") {
      Alert.alert(
        "Currently Busy",
        "You have an active delivery. You will become Online automatically after completing it."
      );

      return;
    }

    const newStatus = value ? "Online" : "Offline";

    try {
      setAvailabilityLoading(true);

      const token = await AsyncStorage.getItem("authToken");

      if (!token) {
        throw new Error("Login session expired. Please login again.");
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/delivery/availability/${partner.id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ availability_status: newStatus }),
        }
      );

      const data = await response.json();

      console.log("Availability response:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update availability");
      }

      const updatedStatus = data.availability_status || newStatus;

      setPartner((previous) =>
        previous ? { ...previous, availability_status: updatedStatus } : previous
      );

      Alert.alert(
        "Availability Updated",
        data.assigned_order
          ? `You are ${updatedStatus}. Order #${data.assigned_order} has been assigned to you.`
          : `You are now ${updatedStatus}.`
      );

      // RELOAD DASHBOARD
      loadDashboard();
    } catch (error) {
      console.error("Availability error:", error);

      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to update availability"
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },

      {
        text: "Logout",
        style: "destructive",

        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              "loggedInUser",
              "authToken",
              "userRole",
            ]);
          } catch (error) {
            console.error("Logout error:", error);
          }

          router.replace("/login");
        },
      },
    ]);
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />

        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // ===================================================
  // MAIN DASHBOARD
  // ===================================================

  const stats = [
    { label: "Total Orders", value: dashboard?.total_orders },
    { label: "Assigned", value: dashboard?.assigned },
    { label: "Accepted", value: dashboard?.accepted },
    { label: "Picked Up", value: dashboard?.picked_up },
    { label: "Out for Delivery", value: dashboard?.out_for_delivery },
    { label: "Delivered", value: dashboard?.delivered },
  ];

  const actions = [
    {
      icon: "📋",
      title: "Assigned Orders",
      subtitle: "View orders assigned to you",
      route: "/delivery/assigned-orders",
    },
    {
      icon: "🚚",
      title: "Shipments",
      subtitle: "Pickups and last-mile deliveries",
      route: "/delivery/shipments",
    },
    {
      icon: "📦",
      title: "My Deliveries",
      subtitle: "Manage active deliveries",
      route: "/delivery/my-deliveries",
    },
    {
      icon: "🕘",
      title: "Delivery History",
      subtitle: "View completed deliveries",
      route: "/delivery/history",
    },
    {
      icon: "💰",
      title: "Earnings",
      subtitle: "View delivery earnings",
      route: "/delivery/earnings",
    },
    {
      icon: "↩️",
      title: "Returns",
      subtitle: "Manage return deliveries",
      route: "/delivery/returns",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#7c3aed"
          />
        }
      >
        {/* ================= HEADER ================= */}

        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.smallTitle}>ShopEase Delivery</Text>

            <Text style={styles.title}>Welcome,</Text>

            <Text style={styles.name}>
              {partner?.name || "Delivery Partner"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push("/delivery/profile")}
          >
            <Text style={styles.profileButtonText}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* ================= AVAILABILITY ================= */}

        <View style={styles.availabilityCard}>
          <View style={styles.availabilityContent}>
            <Text style={styles.availabilityTitle}>Availability</Text>

            <Text style={styles.availabilityStatus}>
              {partner?.availability_status || "Offline"}
            </Text>

            <Text style={styles.availabilityDescription}>
              {partner?.availability_status === "Online"
                ? "You are available for new deliveries."
                : partner?.availability_status === "Busy"
                ? "You are currently handling a delivery."
                : "You are not accepting new deliveries."}
            </Text>
          </View>

          <View style={styles.switchContainer}>
            {availabilityLoading ? (
              <ActivityIndicator size="small" color="#7c3aed" />
            ) : (
              <Switch
                value={partner?.availability_status === "Online"}
                onValueChange={handleAvailabilityChange}
                disabled={partner?.availability_status === "Busy"}
                trackColor={{ false: "#d1d5db", true: "#c4b5fd" }}
                thumbColor={
                  partner?.availability_status === "Online"
                    ? "#7c3aed"
                    : "#f4f4f5"
                }
              />
            )}
          </View>
        </View>

        {/* ================= TODAY SUMMARY ================= */}

        <Text style={styles.sectionTitle}>Today's Summary</Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {todaySummary?.orders_assigned_today || 0}
            </Text>
            <Text style={styles.summaryLabel}>Assigned Today</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {todaySummary?.active_orders_today || 0}
            </Text>
            <Text style={styles.summaryLabel}>Active Today</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>
              {todaySummary?.delivered_today || 0}
            </Text>
            <Text style={styles.summaryLabel}>Delivered</Text>
          </View>
        </View>

        {/* ================= DELIVERY STATISTICS ================= */}

        <Text style={styles.sectionTitle}>Delivery Statistics</Text>

        <View style={styles.statsGrid}>
          {stats.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={styles.statNumber}>{item.value || 0}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ================= QUICK ACTIONS ================= */}

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsContainer}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.route}
              style={styles.actionButton}
              onPress={() => router.push(action.route as any)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>

              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ================= MY PROFILE ================= */}

        <TouchableOpacity
          style={styles.profileAction}
          onPress={() => router.push("/delivery/profile")}
        >
          <Text style={styles.profileActionText}>👤  My Profile</Text>
          <Text style={styles.profileActionArrow}>→</Text>
        </TouchableOpacity>

        {/* ================= LOGOUT ================= */}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ================= DELIVERY LIVE TOUR ================= */}

      {showLiveTour && (
        <LiveTour role="delivery" onFinish={() => setShowLiveTour(false)} />
      )}
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f8f8" },
  content: { padding: 20, paddingBottom: 40 },

  // loading
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 12, fontSize: 14, color: "#666" },

  // header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  headerText: { flex: 1 },
  smallTitle: {
    fontSize: 13,
    color: "#7c3aed",
    fontWeight: "700",
    marginBottom: 5,
  },
  title: { fontSize: 25, fontWeight: "800", color: "#181818" },
  name: { fontSize: 20, fontWeight: "800", color: "#333", marginTop: 2 },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
  },
  profileButtonText: { fontSize: 22 },

  // availability
  availabilityCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 25,
  },
  availabilityContent: { flex: 1 },
  availabilityTitle: { fontSize: 15, fontWeight: "800", color: "#333" },
  availabilityStatus: {
    fontSize: 20,
    fontWeight: "900",
    color: "#7c3aed",
    marginTop: 3,
  },
  availabilityDescription: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    maxWidth: 260,
  },
  switchContainer: { marginLeft: 10 },

  // section
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#181818",
    marginBottom: 12,
  },

  // summary
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 25 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryNumber: { fontSize: 23, fontWeight: "900", color: "#7c3aed" },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
    marginTop: 5,
    textAlign: "center",
  },

  // stats
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statNumber: { fontSize: 27, fontWeight: "900", color: "#7c3aed" },
  statLabel: { fontSize: 13, fontWeight: "700", color: "#666", marginTop: 5 },

  // actions
  actionsContainer: { marginBottom: 20 },
  actionButton: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  actionIcon: { fontSize: 25, marginRight: 15 },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: "800", color: "#222" },
  actionSubtitle: { fontSize: 12, color: "#777", marginTop: 3 },
  actionArrow: {
    color: "#7c3aed",
    fontSize: 21,
    fontWeight: "800",
    marginLeft: 8,
  },

  // profile
  profileAction: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#7c3aed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    flexDirection: "row",
  },
  profileActionText: { color: "#7c3aed", fontSize: 15, fontWeight: "800" },
  profileActionArrow: {
    color: "#7c3aed",
    fontSize: 20,
    fontWeight: "800",
    marginLeft: 10,
  },

  // logout
  logoutButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: { color: "#dc2626", fontSize: 15, fontWeight: "800" },
});
