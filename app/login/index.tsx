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

type LoginType = 'customer' | 'merchant' | 'delivery';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] =
    React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [loginType, setLoginType] =
    React.useState<LoginType>('customer');

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

      const loginUrl =
        loginType === 'delivery'
          ? `${API_BASE_URL}/api/delivery/login`
          : `${API_BASE_URL}/api/auth/login`;

      console.log('LOGIN TYPE:', loginType);
      console.log('LOGIN URL:', loginUrl);
      console.log(
        'LOGIN EMAIL:',
        email.trim().toLowerCase()
      );

      const requestBody =
        loginType === 'delivery'
          ? {
              email: email.trim().toLowerCase(),
              password,
            }
          : {
              email: email.trim().toLowerCase(),
              password,
              role: loginType,
            };

      const response = await fetch(
        loginUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      console.log(
        'Login response:',
        data
      );

      console.log(
        'USER ROLE:',
        data.user?.role
      );

      if (!response.ok || !data.success) {
        Alert.alert(
          'Login Failed',
          data.message ||
            'Invalid email or password'
        );
        return;
      }

      if (data.token) {
        await AsyncStorage.setItem(
          'authToken',
          data.token
        );

        console.log(
          'JWT token saved successfully'
        );
      }

      await AsyncStorage.setItem(
        'loggedInUser',
        JSON.stringify(data.user)
      );

      console.log(
        'User saved:',
        data.user
      );

      await AsyncStorage.setItem(
        'userRole',
        data.user.role
      );

      Alert.alert(
        'Login Successful',
        `Welcome ${data.user.name}`,
        [
          {
            text: 'Continue',
            onPress: () => {
              console.log(
                'LOGIN ROLE:',
                data.user.role
              );

              if (
                data.user.role ===
                'customer'
              ) {
                router.replace(
                  '/(tabs)'
                );
              } else if (
                data.user.role ===
                'merchant'
              ) {
                router.replace(
                  '/merchant'
                );
              } else if (
                data.user.role ===
                'delivery'
              ) {
                router.replace(
                  '/delivery'
                );
              } else {
                Alert.alert(
                  'Login Error',
                  'Unknown user role received from server.'
                );
              }
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
        showsVerticalScrollIndicator={false}
      >

        {/* LOGO */}

        <View
          style={styles.logoContainer}
        >
          <View
            style={styles.logoCircle}
          >
            <Text
              style={styles.logoText}
            >
              S
            </Text>
          </View>

          <Text
            style={styles.brandName}
          >
            ShopEase
          </Text>
        </View>

        {/* LOGIN TYPE */}

        <View
          style={
            styles.loginTypeContainer
          }
        >

          {/* CUSTOMER */}

          <TouchableOpacity
            style={[
              styles.loginTypeButton,
              loginType ===
                'customer' &&
                styles.activeLoginType,
            ]}
            onPress={() =>
              setLoginType(
                'customer'
              )
            }
          >
            <Text
              style={[
                styles.loginTypeText,
                loginType ===
                  'customer' &&
                  styles.activeLoginTypeText,
              ]}
            >
              Customer
            </Text>
          </TouchableOpacity>

          {/* MERCHANT */}

          <TouchableOpacity
            style={[
              styles.loginTypeButton,
              loginType ===
                'merchant' &&
                styles.activeLoginType,
            ]}
            onPress={() =>
              setLoginType(
                'merchant'
              )
            }
          >
            <Text
              style={[
                styles.loginTypeText,
                loginType ===
                  'merchant' &&
                  styles.activeLoginTypeText,
              ]}
            >
              Merchant
            </Text>
          </TouchableOpacity>

          {/* DELIVERY */}

          <TouchableOpacity
            style={[
              styles.loginTypeButton,
              loginType ===
                'delivery' &&
                styles.activeLoginType,
            ]}
            onPress={() =>
              setLoginType(
                'delivery'
              )
            }
          >
            <Text
              style={[
                styles.loginTypeText,
                loginType ===
                  'delivery' &&
                  styles.activeLoginTypeText,
              ]}
            >
              Delivery
            </Text>
          </TouchableOpacity>

        </View>

        {/* TITLE */}

        <Text
          style={styles.title}
        >
          Welcome Back
        </Text>

        <Text
          style={styles.subtitle}
        >
          {loginType ===
          'merchant'
            ? 'Login to manage your products and orders'
            : loginType ===
              'delivery'
            ? 'Login to manage your deliveries'
            : 'Login to continue shopping'}
        </Text>

        {/* EMAIL */}

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

        {/* PASSWORD */}

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
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={
              setPassword
            }
            secureTextEntry={
              !showPassword
            }
          />

          <TouchableOpacity
            onPress={() =>
              setShowPassword(
                value => !value
              )
            }
          >
            <Text
              style={styles.showText}
            >
              {showPassword
                ? 'Hide'
                : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* FORGOT PASSWORD */}

        <TouchableOpacity
          style={
            styles.forgotButton
          }
          onPress={() =>
            Alert.alert(
              'Forgot Password',
              'Password reset will be connected later.'
            )
          }
        >
          <Text
            style={styles.forgotText}
          >
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* LOGIN BUTTON */}

        <TouchableOpacity
          style={[
            styles.loginButton,
            loading &&
              styles.loginButtonDisabled,
          ]}
          onPress={
            handleLogin
          }
          disabled={loading}
        >
          <Text
            style={
              styles.loginButtonText
            }
          >
            {loading
              ? 'Logging in...'
              : loginType ===
                'merchant'
              ? 'Merchant Login'
              : loginType ===
                'delivery'
              ? 'Delivery Partner Login'
              : 'Customer Login'}
          </Text>
        </TouchableOpacity>

        {/* REGISTER */}

        <View
          style={styles.registerRow}
        >
          <Text
            style={
              styles.registerText
            }
          >
            {loginType ===
            'merchant'
              ? 'Want to sell products?'
              : loginType ===
                'delivery'
              ? 'Want to deliver orders?'
              : "Don't have an account?"}
          </Text>

          <TouchableOpacity
            onPress={() => {
              if (
                loginType ===
                'merchant'
              ) {
                router.push(
                  '/merchant/register'
                );
              } else if (
                loginType ===
                'delivery'
              ) {
                router.push(
                  '/delivery/register'
                );
              } else {
                router.push(
                  '/register'
                );
              }
            }}
          >
            <Text
              style={
                styles.registerLink
              }
            >
              {loginType ===
              'merchant'
                ? ' Register as Merchant'
                : loginType ===
                  'delivery'
                ? ' Register as Delivery Partner'
                : ' Create Account'}
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
    paddingTop: 50,
    paddingBottom: 60,
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
    flexWrap: 'wrap',
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

  loginTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#eeeeee',
    borderRadius: 12,
    padding: 4,
    marginBottom: 25,
  },

  loginTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: 'center',
  },

  activeLoginType: {
    backgroundColor: '#7c3aed',
  },

  loginTypeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },

  activeLoginTypeText: {
    color: '#ffffff',
  },

  merchantButton: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },

  merchantButtonText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '800',
  },

  merchantRegisterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
});