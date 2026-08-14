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

  const [loading, setLoading] = React.useState(false);

  const handleRegister = async () => {
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

    if (!email.includes('@')) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address'
      );
      return;
    }

    if (phone.length !== 10) {
      Alert.alert(
        'Invalid Phone',
        'Please enter a valid 10-digit phone number'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Invalid Password',
        'Password must contain at least 6 characters'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Password Error',
        'Passwords do not match'
      );
      return;
    }

    try {
      setLoading(true);

      // TEMPORARY CONNECTION TEST
      console.log('API URL:', API_BASE_URL);

      const testResponse = await fetch(
        `${API_BASE_URL}/`
      );

      const testData = await testResponse.text();

      console.log(
        'Backend test:',
        testData
      );

      // REAL REGISTRATION REQUEST
      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Registration Failed',
          data.message ||
            'Registration failed'
        );
        return;
      }

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* LOGO */}

        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>
              S
            </Text>
          </View>

          <Text style={styles.brandName}>
            ShopEase
          </Text>
        </View>

        {/* TITLE */}

        <Text style={styles.title}>
          Create Account
        </Text>

        <Text style={styles.subtitle}>
          Sign up to start shopping with ShopEase
        </Text>

        {/* NAME */}

        <Text style={styles.label}>
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

        {/* EMAIL */}

        <Text style={styles.label}>
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

        {/* PHONE */}

        <Text style={styles.label}>
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

        {/* PASSWORD */}

        <Text style={styles.label}>
          Password
        </Text>

        <View
          style={
            styles.passwordContainer
          }
        >
          <TextInput
            style={styles.passwordInput}
            placeholder="Create a password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={
              !showPassword
            }
          />

          <TouchableOpacity
            onPress={() =>
              setShowPassword(
                (value) => !value
              )
            }
          >
            <Text style={styles.showText}>
              {showPassword
                ? 'Hide'
                : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONFIRM PASSWORD */}

        <Text style={styles.label}>
          Confirm Password
        </Text>

        <View
          style={
            styles.passwordContainer
          }
        >
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm your password"
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={
              setConfirmPassword
            }
            secureTextEntry={
              !showConfirmPassword
            }
          />

          <TouchableOpacity
            onPress={() =>
              setShowConfirmPassword(
                (value) => !value
              )
            }
          >
            <Text style={styles.showText}>
              {showConfirmPassword
                ? 'Hide'
                : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* REGISTER */}

        <TouchableOpacity
          style={[
            styles.registerButton,
            loading &&
              styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
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

        {/* LOGIN */}

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>
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
              style={styles.loginLink}
            >
              {' '}Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 55,
    paddingBottom: 40,
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

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
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
