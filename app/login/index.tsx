import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] =
    React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing Details',
        'Please enter email and password'
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

    try {
      setLoading(true);

      console.log(
        'Login API:',
        `${API_BASE_URL}/api/auth/login`
      );

      const response = await fetch(
        `${API_BASE_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
          }),
        }
      );

      const data = await response.json();

      console.log('Login response:', data);

      if (!response.ok) {
        Alert.alert(
          'Login Failed',
          data.message ||
            'Invalid email or password'
        );
        return;
      }

      // Save logged-in user
      await AsyncStorage.setItem(
        'loggedInUser',
        JSON.stringify(data.user)
      );

      console.log(
        'User saved:',
        data.user
      );

      Alert.alert(
        'Login Successful',
        `Welcome ${data.user.name}`,
        [
          {
            text: 'Continue',
            onPress: () => {
              router.replace('/(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        'Login error:',
        error
      );

      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please make sure the backend is running.'
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
          Welcome Back
        </Text>

        <Text style={styles.subtitle}>
          Login to continue shopping with ShopEase
        </Text>

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

        {/* PASSWORD */}

        <Text style={styles.label}>
          Password
        </Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
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

        {/* FORGOT PASSWORD */}

        <TouchableOpacity
          style={styles.forgotButton}
          onPress={() =>
            Alert.alert(
              'Forgot Password',
              'Password reset will be connected later.'
            )
          }
        >
          <Text style={styles.forgotText}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* LOGIN */}

        <TouchableOpacity
          style={[
            styles.loginButton,
            loading &&
              styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading
              ? 'Logging in...'
              : 'Login'}
          </Text>
        </TouchableOpacity>

        {/* REGISTER */}

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>
            Don't have an account?
          </Text>

          <TouchableOpacity
            onPress={() =>
              router.push(
                '/register' as any
              )
            }
          >
            <Text style={styles.registerLink}>
              {' '}Create Account
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
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 70,
    paddingBottom: 40,
    justifyContent: 'center',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 35,
  },

  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },

  brandName: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '800',
    color: '#181818',
  },

  title: {
    fontSize: 29,
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
    marginTop: 14,
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

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },

  forgotText: {
    color: '#7c3aed',
    fontSize: 13,
    fontWeight: '700',
  },

  loginButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },

  loginButtonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },

  registerText: {
    color: '#777',
    fontSize: 14,
  },

  registerLink: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '800',
  },
});