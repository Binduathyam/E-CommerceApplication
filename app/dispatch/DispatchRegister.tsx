import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// ⚠️ Adjust this import to wherever your mobile app keeps API_BASE_URL
import { API_BASE_URL } from '../../config/api';

type FormKey = "name" | "email" | "phone" | "password" | "confirmPassword";

const EMPTY_FORM: Record<FormKey, string> = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function DispatchRegister({
  onGoLogin,
  onBack,
}: {
  onGoLogin?: () => void;
  onBack?: () => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (key: FormKey, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (form.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/dispatch/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to submit registration request.");
      }

      setSuccess(
        data.message || "Registration request submitted. Please wait for admin approval."
      );
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setError(err?.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <TouchableOpacity style={styles.backRow} onPress={onBack} activeOpacity={0.7}>
              <Feather name="arrow-left" size={18} color="#52627a" />
              <Text style={styles.backText}>Back to ShopEase</Text>
            </TouchableOpacity>

            <View style={styles.brand}>
              <View style={styles.logo}>
                <Feather name="truck" size={27} color="#ed7625" />
              </View>
              <View>
                <Text style={styles.brandTitle}>SHOPEASE</Text>
                <Text style={styles.brandSub}>LOGISTICS</Text>
              </View>
            </View>

            <View style={styles.heading}>
              <Text style={styles.eyebrow}>DISPATCH PORTAL</Text>
              <Text style={styles.headingTitle}>Create your account</Text>
              <Text style={styles.headingSub}>
                Submit your details to request access to ShopEase Logistics.
              </Text>
            </View>

            {error !== "" && (
              <View style={[styles.alert, styles.alertError]}>
                <Feather name="alert-circle" size={18} color="#b42332" />
                <Text style={[styles.alertText, { color: "#b42332" }]}>{error}</Text>
              </View>
            )}

            {success !== "" && (
              <View style={[styles.alert, styles.alertSuccess]}>
                <Feather name="check-circle" size={18} color="#187443" />
                <Text style={[styles.alertText, { color: "#187443" }]}>{success}</Text>
              </View>
            )}

            <View style={styles.form}>
              {/* Full name */}
              <View style={styles.field}>
                <Text style={styles.label}>Full name</Text>
                <View style={styles.inputWrap}>
                  <Feather name="user" size={19} color="#8a98ab" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#a1acbb"
                    value={form.name}
                    onChangeText={(text) => handleChange("name", text)}
                    autoComplete="name"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.field}>
                <Text style={styles.label}>Email address</Text>
                <View style={styles.inputWrap}>
                  <Feather name="mail" size={19} color="#8a98ab" />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#a1acbb"
                    value={form.email}
                    onChangeText={(text) => handleChange("email", text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                  />
                </View>
              </View>

              {/* Phone */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Phone number <Text style={styles.optional}>(optional)</Text>
                </Text>
                <View style={styles.inputWrap}>
                  <Feather name="phone" size={19} color="#8a98ab" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#a1acbb"
                    value={form.phone}
                    onChangeText={(text) => handleChange("phone", text)}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrap}>
                  <Feather name="lock" size={19} color="#8a98ab" />
                  <TextInput
                    style={styles.input}
                    placeholder="Minimum 8 characters"
                    placeholderTextColor="#a1acbb"
                    value={form.password}
                    onChangeText={(text) => handleChange("password", text)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                  />
                  <TouchableOpacity onPress={() => setShowPassword((value) => !value)} hitSlop={10}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={19} color="#8492a6" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm password */}
              <View style={styles.field}>
                <Text style={styles.label}>Confirm password</Text>
                <View style={styles.inputWrap}>
                  <Feather name="lock" size={19} color="#8a98ab" />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#a1acbb"
                    value={form.confirmPassword}
                    onChangeText={(text) => handleChange("confirmPassword", text)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((value) => !value)}
                    hitSlop={10}
                  >
                    <Feather
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={19}
                      color="#8492a6"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.note}>
                Registration requests require administrator approval. Submitting this form does not
                automatically grant dispatch access.
              </Text>

              <TouchableOpacity
                style={[styles.submit, loading && styles.disabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Request Dispatch Access</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={onGoLogin}>
                <Text style={styles.footerLink}>Sign in</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.copyright}>© ShopEase Logistics. All rights reserved.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#eaf0f9" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 12 },
  card: {
    padding: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7edf5",
    borderRadius: 15,
    shadowColor: "#142b4f",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" },
  backText: { color: "#52627a", fontSize: 13, fontWeight: "600" },
  brand: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 23, marginBottom: 25 },
  logo: {
    width: 53,
    height: 53,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff0e4",
    borderRadius: 14,
  },
  brandTitle: { color: "#14243e", fontSize: 21, fontWeight: "800", letterSpacing: 1.3 },
  brandSub: { color: "#ed7625", fontSize: 10, fontWeight: "800", letterSpacing: 3.4, marginTop: 3 },
  heading: { marginBottom: 23 },
  eyebrow: { color: "#e87525", fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  headingTitle: { color: "#172944", fontSize: 24, fontWeight: "700", marginTop: 9, marginBottom: 8 },
  headingSub: { color: "#718096", fontSize: 13, lineHeight: 22 },
  alert: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    padding: 12,
    marginBottom: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
  alertError: { backgroundColor: "#fff1f2", borderColor: "#fecaca" },
  alertSuccess: { backgroundColor: "#effcf4", borderColor: "#b7ebcb" },
  alertText: { flex: 1, fontSize: 12, lineHeight: 19 },
  form: { gap: 17 },
  field: { gap: 8 },
  label: { color: "#293951", fontSize: 12, fontWeight: "700" },
  optional: { color: "#8b98aa", fontSize: 11, fontWeight: "400" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minHeight: 48,
    paddingHorizontal: 13,
    backgroundColor: "#fbfcfe",
    borderWidth: 1,
    borderColor: "#dce4ef",
    borderRadius: 10,
  },
  input: { flex: 1, minWidth: 0, height: 46, padding: 0, color: "#182b46", fontSize: 13 },
  note: { color: "#78869a", fontSize: 11, lineHeight: 18 },
  submit: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 49,
    backgroundColor: "#e96820",
    borderRadius: 10,
  },
  submitText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  disabled: { opacity: 0.65 },
  footerRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 25 },
  footerText: { color: "#718096", fontSize: 12 },
  footerLink: { color: "#e87525", fontSize: 12, fontWeight: "700" },
  copyright: {
    color: "#9aa5b4",
    fontSize: 10,
    textAlign: "center",
    marginTop: 25,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: "#edf0f5",
  },
});
