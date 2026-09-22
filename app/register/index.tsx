import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE_URL } from '../../config/api';

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] =
    React.useState('');

  const [showPassword, setShowPassword] =
    React.useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    React.useState(false);

  const [loading, setLoading] =
    React.useState(false);

  // =========================================
  // PASSWORD VALIDATION
  // =========================================

  const hasCapitalLetter =
    /[A-Z]/.test(password);

  const hasSmallLetter =
    /[a-z]/.test(password);

  const hasNumber =
    /[0-9]/.test(password);

  const hasSymbol =
    /[^A-Za-z0-9]/.test(password);

  const hasMinimumLength =
    password.length >= 6;

  const isStrongPassword =
    hasCapitalLetter &&
    hasSmallLetter &&
    hasNumber &&
    hasSymbol &&
    hasMinimumLength;

  // =========================================
  // REGISTER
  // =========================================

  const handleRegister = async () => {
    // =======================================
    // CHECK EMPTY FIELDS
    // =======================================

    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        'Missing Details',
        'Please fill all the fields'
      );
      return;
    }

    // =======================================
    // EMAIL VALIDATION
    // =======================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailRegex.test(
        email.trim()
      )
    ) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address'
      );
      return;
    }

    // =======================================
    // PHONE VALIDATION
    // =======================================

    if (phone.length !== 10) {
      Alert.alert(
        'Invalid Phone',
        'Please enter a valid 10-digit phone number'
      );
      return;
    }

    // =======================================
    // PASSWORD VALIDATION
    // =======================================

    if (!hasMinimumLength) {
      Alert.alert(
        'Invalid Password',
        'Password must contain at least 6 characters.'
      );
      return;
    }

    if (!hasCapitalLetter) {
      Alert.alert(
        'Invalid Password',
        'Password must contain at least one capital letter (A-Z).'
      );
      return;
    }

    if (!hasSmallLetter) {
      Alert.alert(
        'Invalid Password',
        'Password must contain at least one small letter (a-z).'
      );
      return;
    }

    if (!hasNumber) {
      Alert.alert(
        'Invalid Password',
        'Password must contain at least one number (0-9).'
      );
      return;
    }

    if (!hasSymbol) {
      Alert.alert(
        'Invalid Password',
        'Password must contain at least one symbol such as ! @ # $ % & *.'
      );
      return;
    }

    // =======================================
    // CONFIRM PASSWORD
    // =======================================

    if (
      password !== confirmPassword
    ) {
      Alert.alert(
        'Password Error',
        'Passwords do not match'
      );
      return;
    }

    try {
      setLoading(true);

      // =====================================
      // CONNECTION TEST
      // =====================================

      console.log(
        'API URL:',
        API_BASE_URL
      );

      const testResponse =
        await fetch(
          `${API_BASE_URL}/`
        );

      const testData =
        await testResponse.text();

      console.log(
        'Backend test:',
        testData
      );

      // =====================================
      // REGISTRATION REQUEST
      // =====================================

      const response =
        await fetch(
          `${API_BASE_URL}/api/auth/register`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              name: name.trim(),
              email: email
                .trim()
                .toLowerCase(),
              phone: phone.trim(),
              password,
            }),
          }
        );

      const data =
        await response.json();

      // =====================================
      // BACKEND ERROR
      // =====================================

      if (!response.ok) {
        Alert.alert(
          'Registration Failed',
          data.message ||
            'Registration failed'
        );
        return;
      }

      // =====================================
      // SUCCESS
      // =====================================

      Alert.alert(
        'Success',
        'Registration successful',
        [
          {
            text: 'Login',
            onPress: () =>
              router.replace(
                '/login' as any
              ),
          },
        ]
      );
    } catch (error) {
      console.error(
        'Register error:',
        error
      );

      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // UI
  // =========================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
      keyboardVerticalOffset={
        Platform.OS === 'ios'
          ? 0
          : 20
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* ===================================
            LOGO
        ==================================== */}

        <View
          style={
            styles.logoContainer
          }
        >
          <View
            style={
              styles.logoCircle
            }
          >
            <Text
              style={
                styles.logoText
              }
            >
              S
            </Text>
          </View>

          <Text
            style={
              styles.brandName
            }
          >
            ShopEase
          </Text>
        </View>

        {/* ===================================
            TITLE
        ==================================== */}

        <Text
          style={styles.title}
        >
          Create Account
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Sign up to start shopping with ShopEase
        </Text>

        {/* ===================================
            NAME
        ==================================== */}

        <Text
          style={styles.label}
        >
          Full Name
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        {/* ===================================
            EMAIL
        ==================================== */}

        <Text
          style={styles.label}
        >
          Email Address
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* ===================================
            PHONE
        ==================================== */}

        <Text
          style={styles.label}
        >
          Phone Number
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter 10-digit phone number"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={(text) =>
            setPhone(
              text.replace(
                /[^0-9]/g,
                ''
              )
            )
          }
          keyboardType="phone-pad"
          maxLength={10}
        />

        {/* ===================================
            PASSWORD
        ==================================== */}

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
            placeholder="Create a password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={
              setPassword
            }
            secureTextEntry={
              !showPassword
            }
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            onPress={() =>
              setShowPassword(
                (value) => !value
              )
            }
          >
            <Text
              style={
                styles.showText
              }
            >
              {showPassword
                ? 'Hide'
                : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===================================
            PASSWORD REQUIREMENTS
        ==================================== */}

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
                ? '✓'
                : '○'}{' '}
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
                ? '✓'
                : '○'}{' '}
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
                ? '✓'
                : '○'}{' '}
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
                ? '✓'
                : '○'}{' '}
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
                ? '✓'
                : '○'}{' '}
              One symbol (! @ # $ % & *)
            </Text>
          </View>
        )}

        {/* ===================================
            CONFIRM PASSWORD
        ==================================== */}

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
            placeholder="Confirm your password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={
              setConfirmPassword
            }
            secureTextEntry={
              !showConfirmPassword
            }
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            onPress={() =>
              setShowConfirmPassword(
                (value) => !value
              )
            }
          >
            <Text
              style={
                styles.showText
              }
            >
              {showConfirmPassword
                ? 'Hide'
                : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===================================
            REGISTER BUTTON
        ==================================== */}

        <TouchableOpacity
          style={[
            styles.registerButton,
            loading &&
              styles.registerButtonDisabled,
          ]}
          onPress={
            handleRegister
          }
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text
            style={
              styles.registerButtonText
            }
          >
            {loading
              ? 'Creating Account...'
              : 'Create Account'}
          </Text>
        </TouchableOpacity>

        {/* ===================================
            LOGIN
        ==================================== */}

        <View
          style={styles.loginRow}
        >
          <Text
            style={styles.loginText}
          >
            Already have an account?
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push(
                '/login' as any
              )
            }
          >
            <Text
              style={
                styles.loginLink
              }
            >
              {' '}Login
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// =========================================
// STYLES
// =========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 50,
    paddingBottom: 80,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },

  logoCircle: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
  },

  brandName: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '800',
    color: '#181818',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#181818',
  },

  subtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 7,
    marginBottom: 25,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 11,
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#222',
  },

  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 11,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
    paddingRight: 14,
  },

  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#222',
  },

  showText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '800',
  },

  // =======================================
  // PASSWORD REQUIREMENTS
  // =======================================

  requirementsContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },

  requirementText: {
    fontSize: 12,
    color: '#777',
    marginBottom: 5,
  },

  requirementValid: {
    color: '#16a34a',
    fontWeight: '700',
  },

  // =======================================
  // REGISTER BUTTON
  // =======================================

  registerButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },

  registerButtonDisabled: {
    opacity: 0.6,
  },

  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  // =======================================
  // LOGIN
  // =======================================

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },

  loginText: {
    color: '#777',
    fontSize: 14,
  },

  loginLink: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '800',
  },
});