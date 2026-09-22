import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

import { API_BASE_URL } from "../../config/api";

export default function MerchantRegister() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  // =====================================================
  // PASSWORD VALIDATION
  // =====================================================

  const hasCapitalLetter = /[A-Z]/.test(password);
  const hasSmallLetter = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasMinimumLength = password.length >= 6;

  const isStrongPassword =
    hasCapitalLetter &&
    hasSmallLetter &&
    hasNumber &&
    hasSymbol &&
    hasMinimumLength;

  // =====================================================
  // REGISTER MERCHANT
  // =====================================================

  const handleRegister = async () => {
    if (loading) {
      return;
    }

    if (
      !name.trim() ||
      !businessName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        "Missing Details",
        "Please fill all the required fields."
      );

      return;
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );

      return;
    }

    const cleanedPhone = phone.replace(
      /[^0-9]/g,
      ""
    );

    if (cleanedPhone.length !== 10) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid 10-digit phone number."
      );

      return;
    }

    if (!hasMinimumLength) {
      Alert.alert(
        "Invalid Password",
        "Password must contain at least 6 characters."
      );

      return;
    }

    if (!hasCapitalLetter) {
      Alert.alert(
        "Invalid Password",
        "Password must contain at least one capital letter (A-Z)."
      );

      return;
    }

    if (!hasSmallLetter) {
      Alert.alert(
        "Invalid Password",
        "Password must contain at least one small letter (a-z)."
      );

      return;
    }

    if (!hasNumber) {
      Alert.alert(
        "Invalid Password",
        "Password must contain at least one number (0-9)."
      );

      return;
    }

    if (!hasSymbol) {
      Alert.alert(
        "Invalid Password",
        "Password must contain at least one symbol such as ! @ # $ % & *."
      );

      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Passwords do not match."
      );

      return;
    }

    try {
      setLoading(true);

      console.log(
        "MERCHANT REGISTER - starting registration..."
      );

      const response = await fetch(
        `${API_BASE_URL}/api/auth/merchant/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),

            businessName:
              businessName.trim(),

            email: normalizedEmail,

            phone: cleanedPhone,

            password,

            role: "merchant",
          }),
        }
      );

      const data = await response.json();

      console.log(
        "Merchant registration response:",
        data
      );

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Registration failed."
        );
      }

      Alert.alert(
        "Account Created",
        "Merchant account created successfully.",
        [
          {
            text: "Continue",
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error(
        "Merchant registration error:",
        error
      );

      Alert.alert(
        "Registration Failed",
        error?.message ||
          "Unable to create merchant account."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
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
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.backText}>
                ←
              </Text>
            </TouchableOpacity>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>
                MERCHANT
              </Text>

              <Text style={styles.title}>
                Create Account
              </Text>

              <Text style={styles.subtitle}>
                Start selling on ShopEase
              </Text>
            </View>
          </View>

          {/* =================================================
              INTRO
          ================================================= */}

          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Text
                style={styles.introIconText}
              >
                🏪
              </Text>
            </View>

            <View style={styles.introContent}>
              <Text style={styles.introTitle}>
                Become a ShopEase Merchant
              </Text>

              <Text style={styles.introText}>
                Create your merchant account and
                manage products, inventory, orders
                and sales.
              </Text>
            </View>
          </View>

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <Text style={styles.sectionTitle}>
            Personal Information
          </Text>

          <View style={styles.formCard}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Full Name *
              </Text>

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#a1a1aa"
                autoCapitalize="words"
                editable={!loading}
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Email *
              </Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#a1a1aa"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
              />
            </View>

            <View style={styles.formGroupLast}>
              <Text style={styles.label}>
                Phone Number *
              </Text>

              <TextInput
                value={phone}
                onChangeText={(text) =>
                  setPhone(
                    text.replace(
                      /[^0-9]/g,
                      ""
                    )
                  )
                }
                placeholder="Enter 10-digit phone number"
                placeholderTextColor="#a1a1aa"
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading}
                style={styles.input}
              />
            </View>
          </View>

          {/* =================================================
              BUSINESS INFORMATION
          ================================================= */}

          <Text style={styles.sectionTitle}>
            Business Information
          </Text>

          <View style={styles.formCard}>
            <View style={styles.formGroupLast}>
              <Text style={styles.label}>
                Business Name *
              </Text>

              <TextInput
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Enter your business name"
                placeholderTextColor="#a1a1aa"
                autoCapitalize="words"
                editable={!loading}
                style={styles.input}
              />
            </View>
          </View>

          {/* =================================================
              SECURITY
          ================================================= */}

          <Text style={styles.sectionTitle}>
            Account Security
          </Text>

          <View style={styles.formCard}>
            {/* PASSWORD */}

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Password *
              </Text>

              <View
                style={
                  styles.passwordContainer
                }
              >
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create password"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={
                    !showPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  style={
                    styles.passwordInput
                  }
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  <Text
                    style={styles.eyeText}
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>

              {password.length > 0 && (
                <View
                  style={
                    styles.requirementsContainer
                  }
                >
                  <Text
                    style={[
                      styles.requirementText,
                      hasMinimumLength &&
                        styles.requirementValid,
                    ]}
                  >
                    {hasMinimumLength
                      ? "✓"
                      : "○"}{" "}
                    At least 6 characters
                  </Text>

                  <Text
                    style={[
                      styles.requirementText,
                      hasCapitalLetter &&
                        styles.requirementValid,
                    ]}
                  >
                    {hasCapitalLetter
                      ? "✓"
                      : "○"}{" "}
                    One capital letter (A-Z)
                  </Text>

                  <Text
                    style={[
                      styles.requirementText,
                      hasSmallLetter &&
                        styles.requirementValid,
                    ]}
                  >
                    {hasSmallLetter
                      ? "✓"
                      : "○"}{" "}
                    One small letter (a-z)
                  </Text>

                  <Text
                    style={[
                      styles.requirementText,
                      hasNumber &&
                        styles.requirementValid,
                    ]}
                  >
                    {hasNumber
                      ? "✓"
                      : "○"}{" "}
                    One number (0-9)
                  </Text>

                  <Text
                    style={[
                      styles.requirementText,
                      hasSymbol &&
                        styles.requirementValid,
                    ]}
                  >
                    {hasSymbol
                      ? "✓"
                      : "○"}{" "}
                    One symbol (! @ # $ % & *)
                  </Text>

                  <Text
                    style={[
                      styles.passwordStatus,
                      isStrongPassword &&
                        styles.passwordStatusValid,
                    ]}
                  >
                    {isStrongPassword
                      ? "✓ Strong password"
                      : "Password requirements not completed"}
                  </Text>
                </View>
              )}
            </View>

            {/* CONFIRM PASSWORD */}

            <View
              style={styles.formGroupLast}
            >
              <Text style={styles.label}>
                Confirm Password *
              </Text>

              <View
                style={
                  styles.passwordContainer
                }
              >
                <TextInput
                  value={confirmPassword}
                  onChangeText={
                    setConfirmPassword
                  }
                  placeholder="Confirm password"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  style={
                    styles.passwordInput
                  }
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  <Text
                    style={styles.eyeText}
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>

              {confirmPassword.length > 0 && (
                <Text
                  style={[
                    styles.matchText,
                    password ===
                      confirmPassword &&
                      styles.matchValid,
                  ]}
                >
                  {password ===
                  confirmPassword
                    ? "✓ Passwords match"
                    : "Passwords do not match"}
                </Text>
              )}
            </View>
          </View>

          {/* =================================================
              REGISTER BUTTON
          ================================================= */}

          <TouchableOpacity
            style={[
              styles.registerButton,
              loading &&
                styles.disabledButton,
            ]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#ffffff" />

                <Text
                  style={
                    styles.loadingButtonText
                  }
                >
                  Creating Account...
                </Text>
              </>
            ) : (
              <Text
                style={
                  styles.registerButtonText
                }
              >
                Create Merchant Account
              </Text>
            )}
          </TouchableOpacity>

          {/* =================================================
              LOGIN
          ================================================= */}

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              Already have a merchant account?
            </Text>

            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text
                style={styles.loginLink}
              >
                Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* =================================================
              NOTE
          ================================================= */}

          <View style={styles.noteCard}>
            <Text style={styles.noteIcon}>
              🔒
            </Text>

            <Text style={styles.noteText}>
              Your account information is securely
              handled by ShopEase.
            </Text>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7fb",
  },

  keyboard: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#f7f7fb",
  },

  content: {
    padding: 16,
    paddingBottom: 80,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "800",
    letterSpacing: 1,
  },

  title: {
    color: "#18181b",
    fontSize: 25,
    fontWeight: "800",
  },

  subtitle: {
    color: "#71717a",
    fontSize: 11,
    marginTop: 3,
  },

  // ===================================================
  // INTRO
  // ===================================================

  introCard: {
    backgroundColor: "#7c3aed",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    elevation: 3,
  },

  introIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor:
      "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },

  introIconText: {
    fontSize: 25,
  },

  introContent: {
    flex: 1,
    marginLeft: 12,
  },

  introTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  introText: {
    color: "#ede9fe",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  // ===================================================
  // SECTIONS
  // ===================================================

  sectionTitle: {
    color: "#18181b",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
  },

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 17,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },

  formGroup: {
    marginBottom: 17,
  },

  formGroupLast: {
    marginBottom: 0,
  },

  label: {
    color: "#52525b",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
  },

  input: {
    height: 44,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 9,
    paddingHorizontal: 11,
    color: "#18181b",
    fontSize: 12,
  },

  // ===================================================
  // PASSWORD
  // ===================================================

  passwordContainer: {
    height: 44,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: 11,
    color: "#18181b",
    fontSize: 12,
  },

  eyeButton: {
    paddingHorizontal: 11,
  },

  eyeText: {
    color: "#7c3aed",
    fontSize: 10,
    fontWeight: "800",
  },

  // ===================================================
  // PASSWORD REQUIREMENTS
  // ===================================================

  requirementsContainer: {
    marginTop: 9,
    backgroundColor: "#fafafa",
    borderRadius: 9,
    padding: 10,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },

  requirementText: {
    color: "#777777",
    fontSize: 10,
    marginBottom: 5,
  },

  requirementValid: {
    color: "#16a34a",
    fontWeight: "700",
  },

  passwordStatus: {
    marginTop: 5,
    color: "#dc2626",
    fontSize: 10,
    fontWeight: "700",
  },

  passwordStatusValid: {
    color: "#16a34a",
  },

  matchText: {
    marginTop: 7,
    color: "#dc2626",
    fontSize: 10,
    fontWeight: "700",
  },

  matchValid: {
    color: "#16a34a",
  },

  // ===================================================
  // REGISTER BUTTON
  // ===================================================

  registerButton: {
    height: 49,
    borderRadius: 11,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 2,
  },

  disabledButton: {
    opacity: 0.65,
  },

  registerButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  loadingButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 8,
  },

  // ===================================================
  // LOGIN
  // ===================================================

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },

  loginText: {
    color: "#71717a",
    fontSize: 10,
  },

  loginLink: {
    color: "#7c3aed",
    fontSize: 10,
    fontWeight: "800",
    marginLeft: 5,
  },

  // ===================================================
  // NOTE
  // ===================================================

  noteCard: {
    backgroundColor: "#ffffff",
    borderRadius: 13,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  noteIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  noteText: {
    flex: 1,
    color: "#71717a",
    fontSize: 9,
    lineHeight: 14,
  },

  bottomSpace: {
    height: 25,
  },
});