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

type NotificationItem = {
  id: number;
  title?: string;
  message?: string;
  notification_type?: string;
  is_read?: number | boolean;
  created_at?: string;
};

export default function DeliveryNotifications() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getUser = async () => {
    const userData = await AsyncStorage.getItem("loggedInUser");

    if (!userData) {
      router.replace("/login");
      return null;
    }

    const user = JSON.parse(userData);

    if (user.role !== "delivery") {
      Alert.alert(
        "Access Denied",
        "Delivery partner login required."
      );
      router.replace("/login");
      return null;
    }

    return user;
  };

  const loadNotifications = async () => {
    try {
      const user = await getUser();

      if (!user) return;

      const token = await AsyncStorage.getItem("authToken");

      const response = await fetch(
        `${API_BASE_URL}/api/delivery/notifications/${user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load notifications"
        );
      }

      setNotifications(data.notifications || []);
    } catch (error: any) {
      console.log(
        "Notifications error:",
        error
      );

      Alert.alert(
        "Error",
        error.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, []);

  const markAsRead = async (
    notificationId: number
  ) => {
    try {
      const token =
        await AsyncStorage.getItem("authToken");

      const response = await fetch(
        `${API_BASE_URL}/api/delivery/notifications/read/${notificationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to mark notification as read"
        );
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? { ...item, is_read: 1 }
            : item
        )
      );
    } catch (error: any) {
      console.log(
        "Mark read error:",
        error
      );

      Alert.alert(
        "Error",
        error.message ||
          "Unable to mark notification as read."
      );
    }
  };

  const deleteNotification = async (
    notificationId: number
  ) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token =
                await AsyncStorage.getItem("authToken");

              const response = await fetch(
                `${API_BASE_URL}/api/delivery/notifications/${notificationId}`,
                {
                  method: "DELETE",
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
                  data.message ||
                    "Failed to delete notification"
                );
              }

              setNotifications((current) =>
                current.filter(
                  (item) =>
                    item.id !== notificationId
                )
              );
            } catch (error: any) {
              console.log(
                "Delete notification error:",
                error
              );

              Alert.alert(
                "Error",
                error.message ||
                  "Unable to delete notification."
              );
            }
          },
        },
      ]
    );
  };

  const isRead = (
    notification: NotificationItem
  ) => {
    return (
      notification.is_read === 1 ||
      notification.is_read === true
    );
  };

  const formatDate = (
    dateString?: string
  ) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return date.toLocaleString();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Loading notifications...
        </Text>
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

          <Text style={styles.headerTitle}>
            Notifications
          </Text>

          <View style={{ width: 42 }} />
        </View>

        {/* Empty State */}
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>
                🔔
              </Text>
            </View>

            <Text style={styles.emptyTitle}>
              No Notifications
            </Text>

            <Text style={styles.emptyText}>
              You don't have any notifications right now.
            </Text>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadNotifications}
            >
              <Text style={styles.refreshButtonText}>
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Notification Count */}
            <View style={styles.countBox}>
              <Text style={styles.countText}>
                {notifications.length}{" "}
                {notifications.length === 1
                  ? "Notification"
                  : "Notifications"}
              </Text>
            </View>

            {/* Notification List */}
            {notifications.map((notification) => {
              const read = isRead(notification);

              return (
                <View
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !read && styles.unreadCard,
                  ]}
                >
                  <View style={styles.notificationTop}>
                    <View
                      style={[
                        styles.notificationIcon,
                        !read &&
                          styles.unreadIcon,
                      ]}
                    >
                      <Text
                        style={styles.notificationIconText}
                      >
                        🔔
                      </Text>
                    </View>

                    <View style={styles.notificationMain}>
                      <View style={styles.titleRow}>
                        <Text
                          style={[
                            styles.notificationTitle,
                            !read &&
                              styles.unreadTitle,
                          ]}
                        >
                          {notification.title ||
                            "Notification"}
                        </Text>

                        {!read && (
                          <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>
                              NEW
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.notificationMessage}>
                        {notification.message ||
                          "You have a new notification."}
                      </Text>

                      {notification.notification_type ? (
                        <Text style={styles.typeText}>
                          Type:{" "}
                          {notification.notification_type}
                        </Text>
                      ) : null}

                      <Text style={styles.dateText}>
                        {formatDate(
                          notification.created_at
                        )}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.actions}>
                    {!read && (
                      <TouchableOpacity
                        style={styles.readButton}
                        onPress={() =>
                          markAsRead(notification.id)
                        }
                      >
                        <Text style={styles.readButtonText}>
                          Mark as Read
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() =>
                        deleteNotification(
                          notification.id
                        )
                      }
                    >
                      <Text
                        style={styles.deleteButtonText}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Dashboard */}
        <TouchableOpacity
          style={styles.dashboardButton}
          onPress={() =>
            router.replace("/delivery")
          }
        >
          <Text style={styles.dashboardButtonText}>
            Back to Dashboard
          </Text>
        </TouchableOpacity>
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
    paddingBottom: 35,
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

  countBox: {
    marginHorizontal: 16,
    marginTop: 15,
    marginBottom: 10,
  },

  countText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },

  notificationCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  unreadCard: {
    borderColor: "#93c5fd",
    backgroundColor: "#f8fbff",
  },

  notificationTop: {
    flexDirection: "row",
  },

  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },

  unreadIcon: {
    backgroundColor: "#dbeafe",
  },

  notificationIconText: {
    fontSize: 21,
  },

  notificationMain: {
    flex: 1,
    marginLeft: 12,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },

  unreadTitle: {
    color: "#111827",
  },

  newBadge: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 7,
  },

  newBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },

  notificationMessage: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginTop: 6,
  },

  typeText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 7,
  },

  dateText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 6,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  readButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    marginRight: 8,
  },

  readButtonText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "700",
  },

  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fef2f2",
  },

  deleteButtonText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
  },

  emptyContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginTop: 30,
    paddingVertical: 45,
    paddingHorizontal: 25,
    borderRadius: 18,
    alignItems: "center",
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyIconText: {
    fontSize: 32,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginTop: 15,
  },

  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 7,
  },

  refreshButton: {
    marginTop: 18,
    backgroundColor: "#2563eb",
    paddingHorizontal: 25,
    paddingVertical: 11,
    borderRadius: 10,
  },

  refreshButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },

  dashboardButton: {
    marginHorizontal: 16,
    marginTop: 20,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#111827",
    justifyContent: "center",
    alignItems: "center",
  },

  dashboardButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});