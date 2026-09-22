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

import { useRouter } from "expo-router";

import { API_BASE_URL } from "../../config/api";

export default function DeliveryRegister() {
  const router = useRouter();

  // ==========================================
  // FORM DATA
  // ==========================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [vehicleType, setVehicleType] =
    useState("");

  const [vehicleNumber, setVehicleNumber] =
    useState("");

  const [licenseNumber, setLicenseNumber] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // ==========================================
  // PASSWORD VALIDATION
  // ==========================================

  const hasCapitalLetter =
    /[A-Z]/.test(password);

  const hasSmallLetter =
    /[a-z]/.test(password);

  const hasNumber =
    /[0-9]/.test(password);

  const hasSymbol =
    /[^A-Za-z0-9]/.test(password);

  const hasMinimumLength =
    password.length >= 8;

  const isStrongPassword =
    hasCapitalLetter &&
    hasSmallLetter &&
    hasNumber &&
    hasSymbol &&
    hasMinimumLength;

  // ==========================================
  // REGISTER
  // ==========================================

  const handleSubmit = async () => {
    setMessage("");

    // ========================================
    // REQUIRED FIELDS
    // ========================================

    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !state.trim() ||
      !vehicleType ||
      !vehicleNumber.trim() ||
      !licenseNumber.trim() ||
      !password ||
      !confirmPassword
    ) {
      setMessage(
        "Please fill all the required fields."
      );

      return;
    }

    // ========================================
    // EMAIL CHECK
    // ========================================

    const normalizedEmail =
      email.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        normalizedEmail
      )
    ) {
      setMessage(
        "Please enter a valid email address."
      );

      return;
    }

    // ========================================
    // PHONE CHECK
    // ========================================

    const cleanedPhone =
      phone.replace(
        /[^0-9]/g,
        ""
      );

    if (
      cleanedPhone.length !== 10
    ) {
      setMessage(
        "Please enter a valid 10-digit phone number."
      );

      return;
    }

    // ========================================
    // PASSWORD LENGTH
    // ========================================

    if (password.length < 8) {
      setMessage(
        "Password must be at least 8 characters long."
      );

      return;
    }

    // ========================================
    // CAPITAL LETTER
    // ========================================

    if (!hasCapitalLetter) {
      setMessage(
        "Password must contain at least one uppercase letter."
      );

      return;
    }

    // ========================================
    // SMALL LETTER
    // ========================================

    if (!hasSmallLetter) {
      setMessage(
        "Password must contain at least one lowercase letter."
      );

      return;
    }

    // ========================================
    // NUMBER
    // ========================================

    if (!hasNumber) {
      setMessage(
        "Password must contain at least one number."
      );

      return;
    }

    // ========================================
    // SYMBOL
    // ========================================

    if (!hasSymbol) {
      setMessage(
        "Password must contain at least one special character."
      );

      return;
    }

    // ========================================
    // PASSWORD MATCH
    // ========================================

    if (
      password !==
      confirmPassword
    ) {
      setMessage(
        "Passwords do not match."
      );

      return;
    }

    // ========================================
    // VEHICLE CHECK
    // ========================================

    if (!vehicleType) {
      setMessage(
        "Please select a vehicle type."
      );

      return;
    }

    // ========================================
    // CITY CHECK
    // ========================================

    if (!city.trim()) {
      setMessage(
        "Please enter your city."
      );

      return;
    }

    // ========================================
    // STATE CHECK
    // ========================================

    if (!state.trim()) {
      setMessage(
        "Please enter your state."
      );

      return;
    }

    // ========================================
    // REGISTER
    // ========================================

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/delivery/register`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            name:
              name.trim(),

            email:
              normalizedEmail,

            phone:
              cleanedPhone,

            password:
              password,

            address:
              address.trim(),

            city:
              city.trim(),

            state:
              state.trim(),

            vehicle_type:
              vehicleType,

            vehicle_number:
              vehicleNumber.trim(),

            license_number:
              licenseNumber.trim(),
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "Delivery registration response:",
        data
      );

      // ========================================
      // ERROR
      // ========================================

      if (!response.ok) {
        setMessage(
          data.message ||
            "Delivery partner registration failed."
        );

        return;
      }

      // ========================================
      // SUCCESS
      // ========================================

      setMessage(
        "Registration successful! Please login."
      );

      Alert.alert(
        "Registration Successful",
        "Your delivery partner account has been created. Please login.",
        [
          {
            text: "Login",
            onPress: () =>
              router.replace(
                "/login"
              ),
          },
        ]
      );

    } catch (error) {
      console.error(
        "Delivery registration error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // MAIN UI
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
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={
            false
          }
        >

          {/* ==================================
              BACK
          ================================== */}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
            disabled={loading}
          >
            <Text
              style={styles.backText}
            >
              ← Back
            </Text>
          </TouchableOpacity>

          {/* ==================================
              HEADER
          ================================== */}

          <View
            style={styles.header}
          >
            <View
              style={styles.iconCircle}
            >
              <Text
                style={styles.icon}
              >
                🚚
              </Text>
            </View>

            <Text
              style={styles.title}
            >
              Become a Delivery Partner
            </Text>

            <Text
              style={styles.subtitle}
            >
              Register and start delivering
              orders.
            </Text>
          </View>

          {/* ==================================
              FORM CARD
          ================================== */}

          <View
            style={styles.card}
          >

            {/* FULL NAME */}

            <View
              style={styles.formGroup}
            >
              <Text
                style={styles.label}
              >
                Full Name
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            {/* PHONE */}

            <View
              style={styles.formGroup}
            >
              <Text
                style={styles.label}
              >
                Phone Number
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit phone number"
                placeholderTextColor="#9ca3af"
                value={phone}
                onChangeText={(text) =>
                  setPhone(
                    text.replace(
                      /[^0-9]/g,
                      ""
                    )
                  )
                }
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading}
              />
            </View>

            {/* EMAIL */}

            <View
              style={styles.formGroup}
            >
              <Text
                style={styles.label}
              >
                Email Address
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* ADDRESS */}

            <View
              style={styles.formGroup}
            >
              <Text
                style={styles.label}
              >
                Address
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                ]}
                placeholder="Enter your complete address"
                placeholderTextColor="#9ca3af"
                value={address}
                onChangeText={setAddress}
                multiline
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* CITY */}

            <View
              style={styles.formGroup}
            >
              <Text
                style={styles.label}
              >
                City
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your city"
                placeholderTextColor="#9ca3af"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            {/* STATE */}

            <View
              style={styles.formGroup}
            >
              <Text
                style={styles.label}
              >
                State
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your state"
                placeholderTextColor="#9ca3af"
                value={state}
                onChangeText={setState}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            {/* VEHICLE TYPE */}

            <View
              style={styles.formGroup}
            >
              <Text
                style={styles.label}
              >
                Vehicle Type
              </Text>

              <Text
                style={styles.selectHint}
              >
                Select your vehicle
              </Text>

              <View
                style={
                  styles.vehicleContainer
                }
              >
                {[
                  "Bike",
                  "Scooter",
                  "Car",
                  "Van",
                ].map(
                  (vehicle) => {
                    const selected =
                      vehicleType ===
                      vehicle;

                    return (
                      <TouchableOpacity
                        key={vehicle}
                        style={[
                          styles.vehicleButton,
                          selected &&
                            styles.vehicleButtonSelected,
                        ]}
                        onPress={() =>
                          setVehicleType(
                            vehicle
                          )
                        }
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.vehicleText,
                            selected &&
                              styles.vehicleTextSelected,
                          ]}
                        >
                          {vehicle}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </View>

            {/* VEHICLE NUMBER */}

            <View
              style={styles.formGroup}
            >
              <Text
                style={styles.label}
              >
                Vehicle Number
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Example: TN 01 AB 1234"
                placeholderTextColor="#9ca3af"
                value={vehicleNumber}
                onChangeText={
                  setVehicleNumber
                }
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>

            {/* LICENSE NUMBER */}

            <View
              style={styles.formGroup}
            >
              <Text
                style={styles.label}
              >
                Driving License Number
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter license number"
                placeholderTextColor="#9ca3af"
                value={licenseNumber}
                onChangeText={
                  setLicenseNumber
                }
                autoCapitalize="characters"
                editable={!loading}
              />
            </View>

            {/* PASSWORD */}

            <View
              style={styles.formGroup}
            >
              <Text
                style={styles.label}
              >
                Password
              </Text>

              <View
                style={
                  styles.passwordContainer
                }
              >
                <TextInput
                  style={
                    styles.passwordInput
                  }
                  placeholder="Create password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={
                    setPassword
                  }
                  secureTextEntry={
                    !showPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <TouchableOpacity
                  style={
                    styles.showButton
                  }
                  onPress={() =>
                    setShowPassword(
                      (value) =>
                        !value
                    )
                  }
                  disabled={loading}
                >
                  <Text
                    style={
                      styles.showText
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* PASSWORD REQUIREMENTS */}

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
                    At least 8 characters
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
                    One uppercase letter (A-Z)
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
                    One lowercase letter (a-z)
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
                    One special character
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
              style={styles.formGroup}
            >
              <Text
                style={styles.label}
              >
                Confirm Password
              </Text>

              <View
                style={
                  styles.passwordContainer
                }
              >
                <TextInput
                  style={
                    styles.passwordInput
                  }
                  placeholder="Confirm password"
                  placeholderTextColor="#9ca3af"
                  value={
                    confirmPassword
                  }
                  onChangeText={
                    setConfirmPassword
                  }
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <TouchableOpacity
                  style={
                    styles.showButton
                  }
                  onPress={() =>
                    setShowConfirmPassword(
                      (value) =>
                        !value
                    )
                  }
                  disabled={loading}
                >
                  <Text
                    style={
                      styles.showText
                    }
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* PASSWORD MATCH */}

              {confirmPassword.length >
                0 && (
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

            {/* MESSAGE */}

            {message !== "" && (
              <View
                style={
                  styles.messageBox
                }
              >
                <Text
                  style={
                    styles.messageText
                  }
                >
                  {message}
                </Text>
              </View>
            )}

            {/* REGISTER BUTTON */}

            <TouchableOpacity
              style={[
                styles.registerButton,
                loading &&
                  styles.disabledButton,
              ]}
              onPress={
                handleSubmit
              }
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator
                  color="#ffffff"
                />
              ) : (
                <Text
                  style={
                    styles.registerButtonText
                  }
                >
                  Register as Delivery Partner
                </Text>
              )}
            </TouchableOpacity>

          </View>

          {/* LOGIN */}

          <View
            style={
              styles.loginContainer
            }
          >
            <Text
              style={styles.loginText}
            >
              Already registered?
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.replace(
                  "/login"
                )
              }
              disabled={loading}
            >
              <Text
                style={
                  styles.loginButton
                }
              >
                Login
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    padding: 18,
    paddingBottom: 80,
  },

  // ====================================================
  // BACK
  // ====================================================

  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
  },

  backText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "700",
  },

  // ====================================================
  // HEADER
  // ====================================================

  header: {
    alignItems: "center",
    marginBottom: 22,
  },

  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },

  icon: {
    fontSize: 35,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 7,
    textAlign: "center",
  },

  // ====================================================
  // CARD
  // ====================================================

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  // ====================================================
  // FORM
  // ====================================================

  formGroup: {
    marginBottom: 17,
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

  textArea: {
    height: 100,
    paddingTop: 13,
  },

  // ====================================================
  // VEHICLE
  // ====================================================

  selectHint: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 8,
  },

  vehicleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  vehicleButton: {
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
  },

  vehicleButtonSelected: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },

  vehicleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b5563",
  },

  vehicleTextSelected: {
    color: "#ffffff",
  },

  // ====================================================
  // PASSWORD
  // ====================================================

  passwordContainer: {
    height: 50,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 13,
    fontSize: 14,
    color: "#111827",
  },

  showButton: {
    paddingHorizontal: 13,
  },

  showText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "800",
  },

  // ====================================================
  // PASSWORD REQUIREMENTS
  // ====================================================

  requirementsContainer: {
    marginTop: 9,
    padding: 11,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  requirementText: {
    color: "#6b7280",
    fontSize: 11,
    marginBottom: 5,
  },

  requirementValid: {
    color: "#16a34a",
    fontWeight: "700",
  },

  passwordStatus: {
    marginTop: 5,
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "700",
  },

  passwordStatusValid: {
    color: "#16a34a",
  },

  // ====================================================
  // PASSWORD MATCH
  // ====================================================

  matchText: {
    marginTop: 7,
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "700",
  },

  matchValid: {
    color: "#16a34a",
  },

  // ====================================================
  // MESSAGE
  // ====================================================

  messageBox: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },

  messageText: {
    color: "#1d4ed8",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  // ====================================================
  // REGISTER
  // ====================================================

  registerButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },

  disabledButton: {
    opacity: 0.7,
  },

  registerButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  // ====================================================
  // LOGIN
  // ====================================================

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  loginText: {
    color: "#6b7280",
    fontSize: 13,
  },

  loginButton: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 5,
  },
});