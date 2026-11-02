import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

import * as ImagePicker from "expo-image-picker";

import { API_BASE_URL } from "../../config/api";

const SECURITY_QUESTIONS = [
  "What was the name of your first school?",
  "What was the name of your first pet?",
  "What is your childhood nickname?",
  "What is your favourite food?",
];

// same special-character rule as the web app
const SPECIAL_CHARACTER = /[!@#$%^&*(),.?":{}|<>_\-\\[\]/`~+=;']/;

export default function MerchantRegister() {
  const router = useRouter();

  // PERSONAL & BUSINESS
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");

  // PICKUP ADDRESS (same fields as the web app)
  const [businessAddress, setBusinessAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  // LOGIN & SECURITY
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [showQuestionList, setShowQuestionList] = useState(false);

  // IDENTITY
  const [aadhaarImage, setAadhaarImage] = useState<any>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // =====================================================
  // PASSWORD VALIDATION (same rules as the web app: 8+)
  // =====================================================

  const hasMinimumLength = password.length >= 8;
  const hasCapitalLetter = /[A-Z]/.test(password);
  const hasSmallLetter = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = SPECIAL_CHARACTER.test(password);

  const isStrongPassword =
    hasMinimumLength &&
    hasCapitalLetter &&
    hasSmallLetter &&
    hasNumber &&
    hasSymbol;

  // =====================================================
  // PICK AADHAAR IMAGE
  // =====================================================

  const pickAadhaarImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow photo library permission to upload your Aadhaar image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset) {
        return;
      }

      if (
        asset.mimeType &&
        !["image/jpeg", "image/jpg", "image/png"].includes(asset.mimeType)
      ) {
        Alert.alert("Invalid Image", "Please select a JPG, JPEG or PNG image.");
        return;
      }

      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert("Image Too Large", "Aadhaar image must be less than 5MB.");
        return;
      }

      setAadhaarImage(asset);
    } catch (error) {
      console.error("Aadhaar image picker error:", error);

      Alert.alert("Error", "Unable to select Aadhaar image.");
    }
  };

  // =====================================================
  // VALIDATION (same order and messages as the web app)
  // returns [title, message] or null
  // =====================================================

  const validateForm = (): [string, string] | null => {
    if (!name.trim()) {
      return ["Missing Details", "Please enter your full name."];
    }

    if (!businessName.trim()) {
      return ["Missing Details", "Please enter your business name."];
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      return ["Invalid Phone", "Phone number must contain exactly 10 digits."];
    }

    if (!businessAddress.trim()) {
      return ["Missing Details", "Please enter your business street address."];
    }

    if (!city.trim()) {
      return ["Missing Details", "Please enter your city."];
    }

    if (!state.trim()) {
      return ["Missing Details", "Please enter your state."];
    }

    if (!/^[0-9]{6}$/.test(pincode.trim())) {
      return ["Invalid Pincode", "Pincode must contain exactly 6 digits."];
    }

    if (!email.trim()) {
      return ["Missing Details", "Please enter your email."];
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return ["Invalid Email", "Please enter a valid email address."];
    }

    if (!hasMinimumLength) {
      return ["Invalid Password", "Password must be at least 8 characters long."];
    }

    if (!hasCapitalLetter) {
      return [
        "Invalid Password",
        "Password must contain at least one uppercase letter.",
      ];
    }

    if (!hasSmallLetter) {
      return [
        "Invalid Password",
        "Password must contain at least one lowercase letter.",
      ];
    }

    if (!hasNumber) {
      return ["Invalid Password", "Password must contain at least one number."];
    }

    if (!hasSymbol) {
      return [
        "Invalid Password",
        "Password must contain at least one special character.",
      ];
    }

    if (password !== confirmPassword) {
      return ["Password Mismatch", "Passwords do not match."];
    }

    if (!securityQuestion) {
      return ["Security Question", "Please select a security question."];
    }

    if (!securityAnswer.trim()) {
      return ["Security Answer", "Please enter your security answer."];
    }

    return null;
  };

  // =====================================================
  // REGISTER MERCHANT
  // =====================================================

  const handleRegister = async () => {
    if (loading) {
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      Alert.alert(validationError[0], validationError[1]);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("name", name.trim());
      formData.append("businessName", businessName.trim());
      formData.append("businessAddress", businessAddress.trim());
      formData.append("city", city.trim());
      formData.append("state", state.trim());
      formData.append("pincode", pincode.trim());
      formData.append("email", email.trim().toLowerCase());
      formData.append("phone", phone.trim());
      formData.append("password", password);
      formData.append("role", "merchant");
      formData.append("security_question", securityQuestion);
      formData.append("security_answer", securityAnswer.trim());

      // Aadhaar is optional, same as the web app
      if (aadhaarImage) {
        formData.append("aadhaar", {
          uri: aadhaarImage.uri,
          name: aadhaarImage.fileName || "aadhaar.jpg",
          type: aadhaarImage.mimeType || "image/jpeg",
        } as any);
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/merchant/register`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Merchant registration failed.");
      }

      Alert.alert(
        "Registration Submitted",
        "Registration submitted successfully! Your account is pending admin approval.",
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
      console.error("Merchant registration error:", error);

      Alert.alert(
        "Registration Failed",
        error?.message || "Unable to register merchant."
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>MERCHANT</Text>
              <Text style={styles.title}>Create Merchant Account</Text>
              <Text style={styles.subtitle}>
                Start selling your products on ShopEase
              </Text>
            </View>
          </View>

          {/* INTRO */}

          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Text style={styles.introIconText}>🏪</Text>
            </View>

            <View style={styles.introContent}>
              <Text style={styles.introTitle}>Register Your Store</Text>

              <Text style={styles.introText}>
                Enter your details to create a merchant account.
              </Text>
            </View>
          </View>

          {/* =================================================
              PERSONAL & BUSINESS DETAILS
          ================================================= */}

          <Text style={styles.sectionTitle}>Personal & Business Details</Text>
          <Text style={styles.sectionHint}>
            Your store information for orders and pickups.
          </Text>

          <View style={styles.formCard}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>

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
              <Text style={styles.label}>Business Name *</Text>

              <TextInput
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="Enter your store name"
                placeholderTextColor="#a1a1aa"
                autoCapitalize="words"
                editable={!loading}
                style={styles.input}
              />
            </View>

            <View style={styles.formGroupLast}>
              <Text style={styles.label}>Phone Number *</Text>

              <TextInput
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                placeholder="10-digit mobile number"
                placeholderTextColor="#a1a1aa"
                keyboardType="phone-pad"
                maxLength={10}
                editable={!loading}
                style={styles.input}
              />
            </View>
          </View>

          {/* =================================================
              BUSINESS PICKUP ADDRESS
          ================================================= */}

          <Text style={styles.sectionTitle}>Business Pickup Address</Text>
          <Text style={styles.sectionHint}>
            This address helps pickup partners find your store. It will be used
            as the shipment pickup location.
          </Text>

          <View style={styles.formCard}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Street Address *</Text>

              <TextInput
                value={businessAddress}
                onChangeText={setBusinessAddress}
                placeholder="Door number, street, area, landmark"
                placeholderTextColor="#a1a1aa"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
                style={[styles.input, styles.textArea]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>City *</Text>

              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Chennai"
                placeholderTextColor="#a1a1aa"
                autoCapitalize="words"
                editable={!loading}
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>State *</Text>

              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="e.g. Tamil Nadu"
                placeholderTextColor="#a1a1aa"
                autoCapitalize="words"
                editable={!loading}
                style={styles.input}
              />
            </View>

            <View style={styles.formGroupLast}>
              <Text style={styles.label}>Pincode *</Text>

              <TextInput
                value={pincode}
                onChangeText={(text) =>
                  setPincode(text.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="6 digits"
                placeholderTextColor="#a1a1aa"
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                style={styles.input}
              />
            </View>
          </View>

          {/* =================================================
              LOGIN & SECURITY
          ================================================= */}

          <Text style={styles.sectionTitle}>Login & Security</Text>
          <Text style={styles.sectionHint}>
            Use these details to access your merchant account.
          </Text>

          <View style={styles.formCard}>
            {/* EMAIL */}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address *</Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="merchant@example.com"
                placeholderTextColor="#a1a1aa"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
              />
            </View>

            {/* PASSWORD */}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password *</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  style={styles.passwordInput}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  <Text style={styles.eyeText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>

              {password.length > 0 && (
                <View style={styles.requirementsContainer}>
                  <Text
                    style={[
                      styles.requirementText,
                      hasMinimumLength && styles.requirementValid,
                    ]}
                  >
                    {hasMinimumLength ? "✓" : "○"} At least 8 characters
                  </Text>

                  <Text
                    style={[
                      styles.requirementText,
                      hasCapitalLetter && styles.requirementValid,
                    ]}
                  >
                    {hasCapitalLetter ? "✓" : "○"} At least one uppercase letter
                  </Text>

                  <Text
                    style={[
                      styles.requirementText,
                      hasSmallLetter && styles.requirementValid,
                    ]}
                  >
                    {hasSmallLetter ? "✓" : "○"} At least one lowercase letter
                  </Text>

                  <Text
                    style={[
                      styles.requirementText,
                      hasNumber && styles.requirementValid,
                    ]}
                  >
                    {hasNumber ? "✓" : "○"} At least one number
                  </Text>

                  <Text
                    style={[
                      styles.requirementText,
                      hasSymbol && styles.requirementValid,
                    ]}
                  >
                    {hasSymbol ? "✓" : "○"} At least one special character
                  </Text>

                  <Text
                    style={[
                      styles.passwordStatus,
                      isStrongPassword && styles.passwordStatusValid,
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password *</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#a1a1aa"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  style={styles.passwordInput}
                />

                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  <Text style={styles.eyeText}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>

              {confirmPassword.length > 0 && (
                <Text
                  style={[
                    styles.matchText,
                    password === confirmPassword && styles.matchValid,
                  ]}
                >
                  {password === confirmPassword
                    ? "✓ Passwords match"
                    : "Passwords do not match"}
                </Text>
              )}
            </View>

            {/* SECURITY QUESTION */}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Security Question *</Text>

              <TouchableOpacity
                style={styles.select}
                onPress={() => setShowQuestionList((value) => !value)}
                disabled={loading}
              >
                <Text
                  style={
                    securityQuestion ? styles.selectText : styles.placeholderText
                  }
                >
                  {securityQuestion || "Select a security question"}
                </Text>

                <Text style={styles.arrow}>{showQuestionList ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {showQuestionList && (
                <View style={styles.questionList}>
                  {SECURITY_QUESTIONS.map((question) => (
                    <TouchableOpacity
                      key={question}
                      style={styles.questionItem}
                      onPress={() => {
                        setSecurityQuestion(question);
                        setShowQuestionList(false);
                      }}
                    >
                      <Text style={styles.questionText}>{question}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* SECURITY ANSWER */}

            <View style={styles.formGroupLast}>
              <Text style={styles.label}>Security Answer *</Text>

              <TextInput
                value={securityAnswer}
                onChangeText={setSecurityAnswer}
                placeholder="Enter your answer"
                placeholderTextColor="#a1a1aa"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.input}
              />
            </View>
          </View>

          {/* =================================================
              IDENTITY VERIFICATION
          ================================================= */}

          <Text style={styles.sectionTitle}>Identity Verification</Text>
          <Text style={styles.sectionHint}>
            Upload the document required for admin verification.
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Aadhaar Card Image</Text>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickAadhaarImage}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.uploadIcon}>📄</Text>

              <View style={styles.uploadTextContainer}>
                <Text style={styles.uploadTitle}>
                  {aadhaarImage ? "Change Aadhaar Image" : "Upload Aadhaar Image"}
                </Text>

                <Text style={styles.uploadSubtitle}>
                  JPG, JPEG or PNG • Maximum 5MB
                </Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.uploadNote}>
              Upload only if required by the verification process. Your document
              is handled securely.
            </Text>

            {aadhaarImage && (
              <View style={styles.previewContainer}>
                <Image
                  source={{ uri: aadhaarImage.uri }}
                  style={styles.aadhaarPreview}
                />

                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setAadhaarImage(null)}
                  disabled={loading}
                >
                  <Text style={styles.removeImageText}>Remove Image</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* REGISTER BUTTON */}

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#ffffff" />
                <Text style={styles.loadingButtonText}>Creating Account...</Text>
              </>
            ) : (
              <Text style={styles.registerButtonText}>Register as Merchant</Text>
            )}
          </TouchableOpacity>

          {/* LOGIN */}

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have a merchant account?</Text>

            <TouchableOpacity onPress={() => router.back()} disabled={loading}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>

          {/* NOTE */}

          <View style={styles.noteCard}>
            <Text style={styles.noteIcon}>🔒</Text>

            <Text style={styles.noteText}>
              Your account information is securely handled by ShopEase.
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
  safeArea: { flex: 1, backgroundColor: "#f7f7fb" },
  keyboard: { flex: 1 },
  container: { flex: 1, backgroundColor: "#f7f7fb" },
  content: { padding: 16, paddingBottom: 80 },

  // header
  header: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
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
  backText: { color: "#27272a", fontSize: 24 },
  headerText: { flex: 1 },
  eyebrow: { color: "#7c3aed", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#18181b", fontSize: 23, fontWeight: "800" },
  subtitle: { color: "#71717a", fontSize: 11, marginTop: 3 },

  // intro
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
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  introIconText: { fontSize: 25 },
  introContent: { flex: 1, marginLeft: 12 },
  introTitle: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  introText: { color: "#ede9fe", fontSize: 10, lineHeight: 15, marginTop: 4 },

  // sections
  sectionTitle: { color: "#18181b", fontSize: 17, fontWeight: "800" },
  sectionHint: {
    color: "#71717a",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
    marginBottom: 10,
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 17,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
  },
  formGroup: { marginBottom: 17 },
  formGroupLast: { marginBottom: 0 },
  label: { color: "#52525b", fontSize: 10, fontWeight: "800", marginBottom: 6 },
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
  textArea: { height: 82, paddingTop: 11 },

  // aadhaar
  uploadButton: {
    minHeight: 65,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#ddd6fe",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  uploadIcon: { fontSize: 25, marginRight: 11 },
  uploadTextContainer: { flex: 1 },
  uploadTitle: { color: "#7c3aed", fontSize: 12, fontWeight: "800" },
  uploadSubtitle: { color: "#71717a", fontSize: 9, marginTop: 3 },
  uploadNote: { color: "#a1a1aa", fontSize: 9, lineHeight: 14, marginTop: 8 },
  previewContainer: { marginTop: 12 },
  aadhaarPreview: {
    width: "100%",
    height: 190,
    borderRadius: 10,
    resizeMode: "cover",
    backgroundColor: "#f4f4f5",
  },
  removeImageButton: { marginTop: 8, alignSelf: "flex-end" },
  removeImageText: { color: "#dc2626", fontSize: 10, fontWeight: "800" },

  // password
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
  eyeButton: { paddingHorizontal: 11 },
  eyeText: { color: "#7c3aed", fontSize: 10, fontWeight: "800" },

  requirementsContainer: {
    marginTop: 9,
    backgroundColor: "#fafafa",
    borderRadius: 9,
    padding: 10,
    borderWidth: 1,
    borderColor: "#eeeeee",
  },
  requirementText: { color: "#777777", fontSize: 10, marginBottom: 5 },
  requirementValid: { color: "#16a34a", fontWeight: "700" },
  passwordStatus: { marginTop: 5, color: "#dc2626", fontSize: 10, fontWeight: "700" },
  passwordStatusValid: { color: "#16a34a" },
  matchText: { marginTop: 7, color: "#dc2626", fontSize: 10, fontWeight: "700" },
  matchValid: { color: "#16a34a" },

  // security question
  select: {
    minHeight: 44,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 9,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { flex: 1, color: "#18181b", fontSize: 12 },
  placeholderText: { flex: 1, color: "#a1a1aa", fontSize: 12 },
  arrow: { color: "#7c3aed", fontSize: 11, marginLeft: 10 },
  questionList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 9,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  questionItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  questionText: { color: "#333333", fontSize: 11, lineHeight: 17 },

  // register button
  registerButton: {
    height: 49,
    borderRadius: 11,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 2,
  },
  disabledButton: { opacity: 0.65 },
  registerButtonText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  loadingButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "800", marginLeft: 8 },

  // login
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  loginText: { color: "#71717a", fontSize: 10 },
  loginLink: { color: "#7c3aed", fontSize: 10, fontWeight: "800", marginLeft: 5 },

  // note
  noteCard: {
    backgroundColor: "#ffffff",
    borderRadius: 13,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  noteIcon: { fontSize: 16, marginRight: 8 },
  noteText: { flex: 1, color: "#71717a", fontSize: 9, lineHeight: 14 },

  bottomSpace: { height: 25 },
});
