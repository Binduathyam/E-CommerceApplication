import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { API_BASE_URL } from "../../config/api";

type Merchant = {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  business_name?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

export default function MerchantProfile() {
  const router = useRouter();

  const [merchant, setMerchant] =
    useState<Merchant | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [name, setName] =
    useState("");

  const [businessName, setBusinessName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [address, setAddress] =
    useState("");

  const [city, setCity] =
    useState("");

  const [state, setState] =
    useState("");

  const [pincode, setPincode] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // GET CURRENT LOGGED-IN MERCHANT ID
  // =====================================================

  const getCurrentMerchantId =
    async (): Promise<number> => {
      const storedUser =
        await AsyncStorage.getItem(
          "loggedInUser"
        );

      if (!storedUser) {
        throw new Error(
          "Merchant login information not found. Please login again."
        );
      }

      let user: any;

      try {
        user =
          JSON.parse(storedUser);
      } catch {
        throw new Error(
          "Invalid merchant login information. Please login again."
        );
      }

      const merchantId =
        Number(user?.id);

      if (
        !merchantId ||
        Number.isNaN(merchantId)
      ) {
        throw new Error(
          "Merchant ID not found. Please login again."
        );
      }

      if (
        user?.role &&
        user.role !== "merchant"
      ) {
        throw new Error(
          "This account is not a merchant account."
        );
      }

      console.log(
        "CURRENT MERCHANT ID:",
        merchantId
      );

      return merchantId;
    };

  // =====================================================
  // LOAD PROFILE
  // =====================================================

  const fetchProfile =
    useCallback(
      async () => {
        try {
          setError("");

          const token =
            await AsyncStorage.getItem(
              "authToken"
            );

          console.log(
            "MERCHANT PROFILE - token exists:",
            token ? "YES" : "NO"
          );

          if (!token) {
            throw new Error(
              "Login session expired. Please login again."
            );
          }

          const merchantId =
            await getCurrentMerchantId();

          const response =
            await fetch(
              `${API_BASE_URL}/api/auth/merchant/${merchantId}`,
              {
                method: "GET",

                headers: {
                  Authorization:
                    `Bearer ${token}`,

                  "x-user-id":
                    String(merchantId),

                  "Content-Type":
                    "application/json",
                },
              }
            );

          const data =
            await response.json();

          console.log(
            "Merchant profile response:",
            data
          );

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.message ||
                "Failed to load profile."
            );
          }

          const user =
            data.merchant ||
            data.user ||
            data.data;

          if (!user) {
            throw new Error(
              "Merchant profile not found."
            );
          }

          setMerchant(user);

          setName(
            user.name || ""
          );

          setBusinessName(
            user.business_name || ""
          );

          setPhone(
            user.phone ||
              user.mobile ||
              ""
          );

          setAddress(
            user.address || ""
          );

          setCity(
            user.city || ""
          );

          setState(
            user.state || ""
          );

          setPincode(
            user.pincode || ""
          );
        } catch (err: any) {
          console.error(
            "Merchant profile error:",
            err
          );

          setError(
            err?.message ||
              "Unable to load profile."
          );
        }
      },
      []
    );

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const load =
      async () => {
        setLoading(true);

        await fetchProfile();

        setLoading(false);
      };

    load();
  }, [fetchProfile]);

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh =
    async () => {
      setRefreshing(true);

      await fetchProfile();

      setRefreshing(false);
    };

  // =====================================================
  // CANCEL EDIT
  // =====================================================

  const handleCancelEdit = () => {
    if (merchant) {
      setName(
        merchant.name || ""
      );

      setBusinessName(
        merchant.business_name || ""
      );

      setPhone(
        merchant.phone ||
          merchant.mobile ||
          ""
      );

      setAddress(
        merchant.address || ""
      );

      setCity(
        merchant.city || ""
      );

      setState(
        merchant.state || ""
      );

      setPincode(
        merchant.pincode || ""
      );
    }

    setEditing(false);
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSave =
    async () => {
      if (!name.trim()) {
        Alert.alert(
          "Required",
          "Please enter your name."
        );
        return;
      }

      setSaving(true);

      try {
        const token =
          await AsyncStorage.getItem(
            "authToken"
          );

        console.log(
          "UPDATE MERCHANT PROFILE - token exists:",
          token ? "YES" : "NO"
        );

        if (!token) {
          throw new Error(
            "Login session expired. Please login again."
          );
        }

        const merchantId =
          await getCurrentMerchantId();

        const response =
          await fetch(
            `${API_BASE_URL}/api/auth/merchant/${merchantId}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,

                "x-user-id":
                  String(merchantId),
              },

              body:
                JSON.stringify({
                  name:
                    name.trim(),

                  business_name:
                    businessName.trim(),

                  phone:
                    phone.trim(),

                  address:
                    address.trim(),

                  city:
                    city.trim(),

                  state:
                    state.trim(),

                  pincode:
                    pincode.trim(),
                }),
            }
          );

        const data =
          await response.json();

        console.log(
          "Merchant profile update response:",
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

        setEditing(false);

        await fetchProfile();

        Alert.alert(
          "Success",
          "Profile updated successfully."
        );
      } catch (err: any) {
        console.error(
          "Profile update error:",
          err
        );

        Alert.alert(
          "Update Failed",
          err?.message ||
            "Unable to update profile."
        );
      } finally {
        setSaving(false);
      }
    };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",

          onPress:
            async () => {
              try {
                await AsyncStorage.multiRemove([
                  "authToken",
                  "loggedInUser",
                  "userRole",
                ]);
              } catch (err) {
                console.error(
                  "Logout storage clear error:",
                  err
                );
              }

              router.replace(
                "/login"
              );
            },
        },
      ]
    );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.safeArea
        }
      >
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#7c3aed"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <KeyboardAvoidingView
        style={
          styles.keyboard
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
          style={
            styles.container
          }
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={
                handleRefresh
              }
              tintColor="#7c3aed"
            />
          }
        >
          {/* HEADER */}

          <View
            style={styles.header}
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
                ←
              </Text>
            </TouchableOpacity>

            <View
              style={
                styles.headerText
              }
            >
              <Text
                style={
                  styles.eyebrow
                }
              >
                MERCHANT
              </Text>

              <Text
                style={styles.title}
              >
                Profile
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                Manage your account
              </Text>
            </View>

            <TouchableOpacity
              style={
                styles.editHeaderButton
              }
              onPress={() => {
                if (editing) {
                  handleCancelEdit();
                } else {
                  setEditing(true);
                }
              }}
            >
              <Text
                style={
                  styles.editHeaderText
                }
              >
                {editing
                  ? "Cancel"
                  : "Edit"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* PROFILE CARD */}

          <View
            style={
              styles.profileCard
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
                {(
                  merchant?.name ||
                  "M"
                )
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <View
              style={
                styles.profileMain
              }
            >
              <Text
                style={
                  styles.profileName
                }
              >
                {merchant?.name ||
                  "Merchant"}
              </Text>

              <Text
                style={
                  styles.profileEmail
                }
              >
                {merchant?.email ||
                  "No email"}
              </Text>

              <View
                style={
                  styles.roleBadge
                }
              >
                <Text
                  style={
                    styles.roleText
                  }
                >
                  MERCHANT
                </Text>
              </View>
            </View>
          </View>

          {/* ERROR */}

          {error !== "" && (
            <View
              style={
                styles.errorCard
              }
            >
              <Text
                style={
                  styles.errorIcon
                }
              >
                ⚠️
              </Text>

              <View
                style={
                  styles.errorContent
                }
              >
                <Text
                  style={
                    styles.errorTitle
                  }
                >
                  Unable to load profile
                </Text>

                <Text
                  style={
                    styles.errorMessage
                  }
                >
                  {error}
                </Text>
              </View>

              <TouchableOpacity
                style={
                  styles.retryButton
                }
                onPress={
                  fetchProfile
                }
              >
                <Text
                  style={
                    styles.retryText
                  }
                >
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ACCOUNT INFORMATION */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            Account Information
          </Text>

          <View
            style={
              styles.formCard
            }
          >
            {/* NAME */}

            <View
              style={
                styles.formGroup
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                Full Name
              </Text>

              {editing ? (
                <TextInput
                  value={name}
                  onChangeText={
                    setName
                  }
                  placeholder="Enter name"
                  placeholderTextColor="#a1a1aa"
                  style={
                    styles.input
                  }
                />
              ) : (
                <Text
                  style={
                    styles.value
                  }
                >
                  {merchant?.name ||
                    "Not provided"}
                </Text>
              )}
            </View>

            {/* EMAIL */}

            <View
              style={
                styles.formGroup
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
                  styles.value
                }
              >
                {merchant?.email ||
                  "Not provided"}
              </Text>

              {editing && (
                <Text
                  style={
                    styles.helperText
                  }
                >
                  Email is linked to your
                  account.
                </Text>
              )}
            </View>

            {/* PHONE */}

            <View
              style={
                styles.formGroup
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                Phone Number
              </Text>

              {editing ? (
                <TextInput
                  value={phone}
                  onChangeText={
                    setPhone
                  }
                  placeholder="Enter phone number"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="phone-pad"
                  style={
                    styles.input
                  }
                />
              ) : (
                <Text
                  style={
                    styles.value
                  }
                >
                  {merchant?.phone ||
                    merchant?.mobile ||
                    "Not provided"}
                </Text>
              )}
            </View>
          </View>

          {/* BUSINESS INFORMATION */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            Business Information
          </Text>

          <View
            style={
              styles.formCard
            }
          >
            {/* BUSINESS NAME */}

            <View
              style={
                styles.formGroup
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                Business Name
              </Text>

              {editing ? (
                <TextInput
                  value={
                    businessName
                  }
                  onChangeText={
                    setBusinessName
                  }
                  placeholder="Enter business name"
                  placeholderTextColor="#a1a1aa"
                  style={
                    styles.input
                  }
                />
              ) : (
                <Text
                  style={
                    styles.value
                  }
                >
                  {merchant?.business_name ||
                    "Not provided"}
                </Text>
              )}
            </View>

            {/* ADDRESS */}

            <View
              style={
                styles.formGroup
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                Address
              </Text>

              {editing ? (
                <TextInput
                  value={
                    address
                  }
                  onChangeText={
                    setAddress
                  }
                  placeholder="Enter address"
                  placeholderTextColor="#a1a1aa"
                  multiline
                  textAlignVertical="top"
                  style={[
                    styles.input,
                    styles.textArea,
                  ]}
                />
              ) : (
                <Text
                  style={
                    styles.value
                  }
                >
                  {merchant?.address ||
                    "Not provided"}
                </Text>
              )}
            </View>

            {/* CITY */}

            <View
              style={
                styles.formGroup
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                City
              </Text>

              {editing ? (
                <TextInput
                  value={city}
                  onChangeText={
                    setCity
                  }
                  placeholder="Enter city"
                  placeholderTextColor="#a1a1aa"
                  style={
                    styles.input
                  }
                />
              ) : (
                <Text
                  style={
                    styles.value
                  }
                >
                  {merchant?.city ||
                    "Not provided"}
                </Text>
              )}
            </View>

            {/* STATE */}

            <View
              style={
                styles.formGroup
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                State
              </Text>

              {editing ? (
                <TextInput
                  value={
                    state
                  }
                  onChangeText={
                    setState
                  }
                  placeholder="Enter state"
                  placeholderTextColor="#a1a1aa"
                  style={
                    styles.input
                  }
                />
              ) : (
                <Text
                  style={
                    styles.value
                  }
                >
                  {merchant?.state ||
                    "Not provided"}
                </Text>
              )}
            </View>

            {/* PINCODE */}

            <View
              style={
                styles.formGroup
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                Pincode
              </Text>

              {editing ? (
                <TextInput
                  value={
                    pincode
                  }
                  onChangeText={
                    setPincode
                  }
                  placeholder="Enter pincode"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={
                    styles.input
                  }
                />
              ) : (
                <Text
                  style={
                    styles.value
                  }
                >
                  {merchant?.pincode ||
                    "Not provided"}
                </Text>
              )}
            </View>
          </View>

          {/* SAVE */}

          {editing && (
            <TouchableOpacity
              style={
                styles.saveButton
              }
              onPress={
                handleSave
              }
              disabled={
                saving
              }
            >
              {saving ? (
                <ActivityIndicator
                  color="#ffffff"
                />
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
          )}

          {/* LOGOUT */}

          <TouchableOpacity
            style={
              styles.logoutButton
            }
            onPress={
              handleLogout
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.logoutIcon
              }
            >
              ⇥
            </Text>

            <View
              style={
                styles.logoutContent
              }
            >
              <Text
                style={
                  styles.logoutTitle
                }
              >
                Logout
              </Text>

              <Text
                style={
                  styles.logoutDescription
                }
              >
                Sign out from your merchant account
              </Text>
            </View>

            <Text
              style={
                styles.logoutArrow
              }
            >
              →
            </Text>
          </TouchableOpacity>

          {/* ACCOUNT ID */}

          <View
            style={
              styles.accountInfoCard
            }
          >
            <Text
              style={
                styles.accountInfoLabel
              }
            >
              ACCOUNT ID
            </Text>

            <Text
              style={
                styles.accountInfoValue
              }
            >
              #
              {merchant?.id ||
                "N/A"}
            </Text>
          </View>

          <View
            style={
              styles.bottomSpace
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({

    safeArea: {
      flex: 1,
      backgroundColor:
        "#f7f7fb",
    },

    keyboard: {
      flex: 1,
    },

    container: {
      flex: 1,
      backgroundColor:
        "#f7f7fb",
    },

    content: {
      padding: 16,
      paddingBottom: 80,
    },

    // =================================================
    // HEADER
    // =================================================

    header: {
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 18,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        "#ffffff",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 12,
      elevation: 2,
    },

    backText: {
      color: "#27272a",
      fontSize: 24,
    },

    headerText: {
      flex: 1,
    },

    eyebrow: {
      color: "#7c3aed",
      fontSize: 10,
      fontWeight:
        "800",
      letterSpacing: 1,
    },

    title: {
      color: "#18181b",
      fontSize: 25,
      fontWeight:
        "800",
    },

    subtitle: {
      color: "#71717a",
      fontSize: 11,
      marginTop: 3,
    },

    editHeaderButton: {
      backgroundColor:
        "#ede9fe",
      borderRadius: 9,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },

    editHeaderText: {
      color: "#6d28d9",
      fontSize: 10,
      fontWeight:
        "800",
    },

    // =================================================
    // PROFILE
    // =================================================

    profileCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 18,
      padding: 17,
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 20,
      elevation: 2,
    },

    avatar: {
      width: 67,
      height: 67,
      borderRadius: 22,
      backgroundColor:
        "#ede9fe",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    avatarText: {
      color: "#7c3aed",
      fontSize: 28,
      fontWeight:
        "800",
    },

    profileMain: {
      flex: 1,
      marginLeft: 14,
    },

    profileName: {
      color: "#18181b",
      fontSize: 18,
      fontWeight:
        "800",
    },

    profileEmail: {
      color: "#71717a",
      fontSize: 10,
      marginTop: 3,
    },

    roleBadge: {
      alignSelf:
        "flex-start",
      backgroundColor:
        "#f5f3ff",
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginTop: 7,
    },

    roleText: {
      color: "#7c3aed",
      fontSize: 8,
      fontWeight:
        "800",
      letterSpacing:
        0.8,
    },

    // =================================================
    // ERROR
    // =================================================

    errorCard: {
      backgroundColor:
        "#fff1f2",
      borderRadius: 15,
      padding: 13,
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 18,
    },

    errorIcon: {
      fontSize: 21,
      marginRight: 9,
    },

    errorContent: {
      flex: 1,
    },

    errorTitle: {
      color: "#be123c",
      fontSize: 12,
      fontWeight:
        "800",
    },

    errorMessage: {
      color: "#9f1239",
      fontSize: 10,
      marginTop: 3,
    },

    retryButton: {
      backgroundColor:
        "#ffffff",
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },

    retryText: {
      color: "#be123c",
      fontSize: 10,
      fontWeight:
        "800",
    },

    // =================================================
    // SECTIONS
    // =================================================

    sectionTitle: {
      color: "#18181b",
      fontSize: 17,
      fontWeight:
        "800",
      marginBottom: 10,
    },

    formCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 17,
      padding: 15,
      marginBottom: 20,
      elevation: 2,
    },

    formGroup: {
      marginBottom: 17,
    },

    label: {
      color: "#52525b",
      fontSize: 10,
      fontWeight:
        "800",
      marginBottom: 6,
    },

    value: {
      color: "#18181b",
      fontSize: 13,
      lineHeight: 19,
    },

    helperText: {
      color: "#a1a1aa",
      fontSize: 9,
      marginTop: 5,
    },

    input: {
      backgroundColor:
        "#fafafa",
      borderWidth: 1,
      borderColor:
        "#e4e4e7",
      borderRadius: 9,
      paddingHorizontal: 11,
      paddingVertical: 10,
      color: "#18181b",
      fontSize: 12,
    },

    textArea: {
      minHeight: 80,
      textAlignVertical:
        "top",
    },

    // =================================================
    // SAVE
    // =================================================

    saveButton: {
      height: 48,
      borderRadius: 11,
      backgroundColor:
        "#7c3aed",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 14,
      elevation: 2,
    },

    saveButtonText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight:
        "800",
    },

    // =================================================
    // LOGOUT
    // =================================================

    logoutButton: {
      backgroundColor:
        "#ffffff",
      borderRadius: 14,
      padding: 15,
      flexDirection:
        "row",
      alignItems:
        "center",
      marginBottom: 18,
      elevation: 2,
    },

    logoutIcon: {
      color: "#dc2626",
      fontSize: 22,
      marginRight: 12,
      fontWeight:
        "700",
    },

    logoutContent: {
      flex: 1,
    },

    logoutTitle: {
      color: "#dc2626",
      fontSize: 13,
      fontWeight:
        "800",
    },

    logoutDescription: {
      color: "#71717a",
      fontSize: 10,
      marginTop: 3,
    },

    logoutArrow: {
      color: "#dc2626",
      fontSize: 20,
      fontWeight:
        "700",
    },

    // =================================================
    // ACCOUNT ID
    // =================================================

    accountInfoCard: {
      backgroundColor:
        "#ffffff",
      borderRadius: 14,
      padding: 14,
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginTop: 2,
      elevation: 1,
    },

    accountInfoLabel: {
      color: "#a1a1aa",
      fontSize: 8,
      fontWeight:
        "800",
      letterSpacing:
        0.8,
    },

    accountInfoValue: {
      color: "#52525b",
      fontSize: 11,
      fontWeight:
        "700",
    },

    // =================================================
    // LOADING
    // =================================================

    loadingContainer: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    loadingText: {
      color: "#71717a",
      fontSize: 13,
      marginTop: 12,
    },

    bottomSpace: {
      height: 25,
    },
  });