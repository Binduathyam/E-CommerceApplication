import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { API_BASE_URL } from "../config/api";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
};

export default function AccountSettings() {
  const router = useRouter();

  // ==========================================
  // FORM
  // ==========================================

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  // ==========================================
  // LOAD USER
  // ==========================================

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const savedUser =
        await AsyncStorage.getItem("loggedInUser");

      if (!savedUser) {
        setError(
          "User information not found. Please login again."
        );

        setLoading(false);
        return;
      }

      const loggedInUser: User =
        JSON.parse(savedUser);

      if (!loggedInUser?.id) {
        setError(
          "User ID not found. Please login again."
        );

        setLoading(false);
        return;
      }

      setUserId(loggedInUser.id);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/user/${loggedInUser.id}`
      );

      const data = await response.json();

      console.log(
        "Account settings response:",
        data
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load profile"
        );
      }

      const user = data.user;

      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    } catch (err: any) {
      console.error(
        "Account settings error:",
        err
      );

      setError(
        err.message ||
          "Unable to load account details."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD WHEN SCREEN OPENS
  // ==========================================

  useEffect(() => {
    fetchProfile();
  }, []);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (
    field: "name" | "phone",
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
    setError("");
  };

  // ==========================================
  // SAVE
  // ==========================================

  const handleSave = async () => {
    if (!userId) {
      setError("User ID not found.");
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/auth/user/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
          }),
        }
      );

      const data = await response.json();

      console.log(
        "Account update response:",
        data
      );

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to update profile"
        );
      }

      // ========================================
      // UPDATE LOCAL USER
      // ========================================

      const savedUser =
        await AsyncStorage.getItem(
          "loggedInUser"
        );

      if (savedUser) {
        const currentUser =
          JSON.parse(savedUser);

        const updatedUser = {
          ...currentUser,
          name:
            data.user.name ||
            form.name,
          email:
            data.user.email ||
            form.email,
          phone:
            data.user.phone ||
            form.phone,
        };

        await AsyncStorage.setItem(
          "loggedInUser",
          JSON.stringify(updatedUser)
        );
      }

      setForm({
        name: data.user.name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
      });

      setMessage(
        "Account details updated successfully."
      );
    } catch (err: any) {
      console.error(
        "Update profile error:",
        err
      );

      setError(
        err.message ||
          "Failed to update account details."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.loadingContainer}
        >
          <Text
            style={styles.loadingIcon}
          >
            👤
          </Text>

          <ActivityIndicator
            size="large"
            color="#7c3aed"
          />

          <Text
            style={styles.loadingTitle}
          >
            Loading account details...
          </Text>

          <Text
            style={styles.loadingText}
          >
            Please wait.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
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
            styles.content
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >

          {/* ==================================
              HEADER
          ================================== */}

          <View
            style={styles.header}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                router.back()
              }
              disabled={saving}
            >
              <Text
                style={styles.backText}
              >
                ‹
              </Text>
            </TouchableOpacity>

            <View
              style={styles.headerCenter}
            >
              <Text
                style={
                  styles.headerSmall
                }
              >
                ACCOUNT
              </Text>

              <Text
                style={
                  styles.headerTitle
                }
              >
                Account Settings
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                Manage your account information
              </Text>
            </View>

            <View
              style={styles.headerSpacer}
            />
          </View>

          {/* ==================================
              FORM CARD
          ================================== */}

          <View
            style={styles.card}
          >

            {/* CARD HEADER */}

            <View
              style={
                styles.cardHeader
              }
            >
              <View
                style={styles.avatar}
              >
                <Text
                  style={
                    styles.avatarText
                  }
                >
                  {form.name
                    ? form.name
                        .charAt(0)
                        .toUpperCase()
                    : "U"}
                </Text>
              </View>

              <View
                style={
                  styles.cardHeaderInfo
                }
              >
                <Text
                  style={
                    styles.cardHeaderSmall
                  }
                >
                  PERSONAL INFORMATION
                </Text>

                <Text
                  style={
                    styles.cardHeaderTitle
                  }
                >
                  Your Details
                </Text>
              </View>
            </View>

            {/* ERROR */}

            {error !== "" && (
              <View
                style={
                  styles.errorBox
                }
              >
                <Text
                  style={
                    styles.errorText
                  }
                >
                  ⚠️ {error}
                </Text>
              </View>
            )}

            {/* SUCCESS */}

            {message !== "" && (
              <View
                style={
                  styles.successBox
                }
              >
                <Text
                  style={
                    styles.successText
                  }
                >
                  ✓ {message}
                </Text>
              </View>
            )}

            {/* NAME */}

            <View
              style={styles.field}
            >
              <Text
                style={styles.label}
              >
                Full Name
              </Text>

              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(value) =>
                  handleChange(
                    "name",
                    value
                  )
                }
                placeholder="Enter your name"
                placeholderTextColor="#9ca3af"
                editable={!saving}
              />
            </View>

            {/* EMAIL */}

            <View
              style={styles.field}
            >
              <Text
                style={styles.label}
              >
                Email Address
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.disabledInput,
                ]}
                value={form.email}
                editable={false}
              />

              <Text
                style={styles.helperText}
              >
                Email address cannot be changed
                here.
              </Text>
            </View>

            {/* PHONE */}

            <View
              style={styles.field}
            >
              <Text
                style={styles.label}
              >
                Phone Number
              </Text>

              <TextInput
                style={styles.input}
                value={form.phone}
                onChangeText={(value) =>
                  handleChange(
                    "phone",
                    value.replace(
                      /[^0-9]/g,
                      ""
                    )
                  )
                }
                placeholder="Enter your phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                maxLength={10}
                editable={!saving}
              />
            </View>

            {/* BUTTONS */}

            <View
              style={styles.actions}
            >
              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={() =>
                  router.back()
                }
                disabled={saving}
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving &&
                    styles.disabledButton,
                ]}
                onPress={
                  handleSave
                }
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#ffffff"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveText
                    }
                  >
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>
            </View>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    padding: 14,
    paddingBottom: 80,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 15,
    marginBottom: 16,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    fontSize: 32,
    color: "#222",
    marginTop: -4,
  },

  headerCenter: {
    flex: 1,
    marginLeft: 14,
  },

  headerSmall: {
    fontSize: 11,
    fontWeight: "800",
    color: "#7c3aed",
    letterSpacing: 1,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#181818",
    marginTop: 3,
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
  },

  headerSpacer: {
    width: 42,
  },

  // ===================================================
  // CARD
  // ===================================================

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },

  cardHeaderInfo: {
    marginLeft: 13,
  },

  cardHeaderSmall: {
    fontSize: 10,
    fontWeight: "800",
    color: "#7c3aed",
    letterSpacing: 0.8,
  },

  cardHeaderTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#222",
    marginTop: 3,
  },

  // ===================================================
  // MESSAGE
  // ===================================================

  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },

  errorText: {
    color: "#dc2626",
    fontSize: 13,
    lineHeight: 19,
  },

  successBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },

  successText: {
    color: "#16a34a",
    fontSize: 13,
    lineHeight: 19,
  },

  // ===================================================
  // FORM
  // ===================================================

  field: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 13,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#ffffff",
  },

  disabledInput: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },

  helperText: {
    fontSize: 11,
    color: "#888",
    marginTop: 6,
  },

  // ===================================================
  // ACTIONS
  // ===================================================

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 5,
    marginBottom: 20,
  },

  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },

  cancelText: {
    color: "#555",
    fontSize: 14,
    fontWeight: "700",
  },

  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#7c3aed",
    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.7,
  },

  saveText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  loadingIcon: {
    fontSize: 40,
    marginBottom: 15,
  },

  loadingTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#222",
    marginTop: 15,
  },

  loadingText: {
    fontSize: 13,
    color: "#777",
    marginTop: 5,
  },
});