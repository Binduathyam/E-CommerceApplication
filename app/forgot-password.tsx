import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
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

import { API_BASE_URL } from '../config/api';

type Role = 'customer' | 'merchant' | 'delivery';

const QUESTIONS = [
  'What was the name of your first school?',
  'What was the name of your first pet?',
  'What is your childhood nickname?',
  'What is your favourite food?',
];

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    role?: string;
  }>();

  const role: Role =
    params.role === 'merchant'
      ? 'merchant'
      : params.role === 'delivery'
      ? 'delivery'
      : 'customer';

  const [step, setStep] = React.useState(1);

  const [email, setEmail] = React.useState('');
  const [question, setQuestion] =
    React.useState('');
  const [answer, setAnswer] =
    React.useState('');

  const [newPassword, setNewPassword] =
    React.useState('');
  const [confirmPassword, setConfirmPassword] =
    React.useState('');

  const [userId, setUserId] =
    React.useState<number | null>(null);

  const [userType, setUserType] =
    React.useState('');

  const [loading, setLoading] =
    React.useState(false);

  const [showQuestionList, setShowQuestionList] =
    React.useState(false);

  const getRoleTitle = () => {
    if (role === 'merchant') {
      return 'Merchant';
    }

    if (role === 'delivery') {
      return 'Delivery Partner';
    }

    return 'Customer';
  };

  const handleVerify = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Missing Email',
        'Please enter your email address.'
      );
      return;
    }

    if (!email.includes('@')) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.'
      );
      return;
    }

    if (!question) {
      Alert.alert(
        'Security Question',
        'Please select your security question.'
      );
      return;
    }

    if (!answer.trim()) {
      Alert.alert(
        'Security Answer',
        'Please enter your security answer.'
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/forgot-password/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            question,
            answer: answer.trim(),
            role,
          }),
        }
      );

      const data = await response.json();

      console.log(
        'Forgot password verify:',
        data
      );

      if (!response.ok || !data.success) {
        Alert.alert(
          'Verification Failed',
          data.message ||
            'Security verification failed.'
        );
        return;
      }

      setUserId(data.user_id);
      setUserType(data.user_type);

      setStep(2);
    } catch (error) {
      console.error(
        'Forgot password verification error:',
        error
      );

      Alert.alert(
        'Connection Error',
        'Unable to connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      Alert.alert(
        'Missing Password',
        'Please enter a new password.'
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        'Invalid Password',
        'Password must contain at least 6 characters.'
      );
      return;
    }

    if (!confirmPassword) {
      Alert.alert(
        'Confirm Password',
        'Please confirm your new password.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Password Mismatch',
        'New password and confirm password must match.'
      );
      return;
    }

    if (!userId || !userType) {
      Alert.alert(
        'Error',
        'User verification information is missing.'
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/forgot-password/reset`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            user_type: userType,
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      console.log(
        'Password reset response:',
        data
      );

      if (!response.ok || !data.success) {
        Alert.alert(
          'Reset Failed',
          data.message ||
            'Unable to reset password.'
        );
        return;
      }

      Alert.alert(
        'Password Reset Successful',
        'Your password has been changed successfully. Please login with your new password.',
        [
          {
            text: 'Go to Login',
            onPress: () => {
              router.replace('/login');
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        'Password reset error:',
        error
      );

      Alert.alert(
        'Connection Error',
        'Unable to connect to the server.'
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
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* BACK */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ← Back to Login
          </Text>
        </TouchableOpacity>

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

        {/* CARD */}

        <View style={styles.card}>

          <Text style={styles.title}>
            Forgot Password?
          </Text>

          <Text style={styles.subtitle}>
            Reset your {getRoleTitle().toLowerCase()}{' '}
            account password securely.
          </Text>

          {/* STEP INDICATOR */}

          <View style={styles.stepsContainer}>

            <View
              style={[
                styles.stepCircle,
                styles.activeStep,
              ]}
            >
              <Text
                style={styles.activeStepText}
              >
                1
              </Text>
            </View>

            <View
              style={[
                styles.stepLine,
                step === 2 &&
                  styles.activeLine,
              ]}
            />

            <View
              style={[
                styles.stepCircle,
                step === 2 &&
                  styles.activeStep,
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  step === 2 &&
                    styles.activeStepText,
                ]}
              >
                2
              </Text>
            </View>

          </View>

          {/* STEP 1 */}

          {step === 1 && (
            <View>

              <Text style={styles.stepTitle}>
                Verify Your Account
              </Text>

              <Text style={styles.stepDescription}>
                Enter your registered email and
                answer your security question.
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

              {/* QUESTION */}

              <Text style={styles.label}>
                Security Question
              </Text>

              <TouchableOpacity
                style={styles.select}
                onPress={() =>
                  setShowQuestionList(
                    value => !value
                  )
                }
              >
                <Text
                  style={
                    question
                      ? styles.selectText
                      : styles.placeholderText
                  }
                >
                  {question ||
                    'Select a security question'}
                </Text>

                <Text style={styles.arrow}>
                  {showQuestionList
                    ? '▲'
                    : '▼'}
                </Text>
              </TouchableOpacity>

              {showQuestionList && (
                <View style={styles.questionList}>
                  {QUESTIONS.map(
                    item => (
                      <TouchableOpacity
                        key={item}
                        style={
                          styles.questionItem
                        }
                        onPress={() => {
                          setQuestion(item);
                          setShowQuestionList(
                            false
                          );
                        }}
                      >
                        <Text
                          style={
                            styles.questionText
                          }
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              )}

              {/* ANSWER */}

              <Text style={styles.label}>
                Security Answer
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your answer"
                placeholderTextColor="#999"
                value={answer}
                onChangeText={setAnswer}
                autoCapitalize="none"
              />

              {/* VERIFY */}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  loading &&
                    styles.disabledButton,
                ]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator
                    color="#fff"
                  />
                ) : (
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Verify Account
                  </Text>
                )}
              </TouchableOpacity>

            </View>
          )}

          {/* STEP 2 */}

          {step === 2 && (
            <View>

              <Text style={styles.stepTitle}>
                Create New Password
              </Text>

              <Text style={styles.stepDescription}>
                Enter a new password for your
                account.
              </Text>

              {/* NEW PASSWORD */}

              <Text style={styles.label}>
                New Password
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              {/* CONFIRM PASSWORD */}

              <Text style={styles.label}>
                Confirm Password
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={
                  setConfirmPassword
                }
                secureTextEntry
              />

              {/* RESET */}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  loading &&
                    styles.disabledButton,
                ]}
                onPress={
                  handleResetPassword
                }
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator
                    color="#fff"
                  />
                ) : (
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Reset Password
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.changeButton}
                onPress={() =>
                  setStep(1)
                }
              >
                <Text
                  style={styles.changeText}
                >
                  ← Back to Verification
                </Text>
              </TouchableOpacity>

            </View>
          )}

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
    paddingTop: 45,
    paddingBottom: 50,
  },

  backButton: {
    marginBottom: 25,
  },

  backText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '700',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },

  logoCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoText: {
    color: '#fff',
    fontSize: 31,
    fontWeight: '900',
  },

  brandName: {
    marginTop: 7,
    fontSize: 20,
    fontWeight: '800',
    color: '#181818',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 22,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#181818',
  },

  subtitle: {
    marginTop: 7,
    color: '#777',
    fontSize: 14,
    lineHeight: 21,
  },

  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },

  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eeeeee',
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeStep: {
    backgroundColor: '#7c3aed',
  },

  stepText: {
    color: '#777',
    fontWeight: '800',
  },

  activeStepText: {
    color: '#fff',
    fontWeight: '800',
  },

  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#eeeeee',
    marginHorizontal: 8,
  },

  activeLine: {
    backgroundColor: '#7c3aed',
  },

  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
    marginBottom: 6,
  },

  stepDescription: {
    color: '#777',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
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
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#222',
  },

  select: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 11,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectText: {
    flex: 1,
    color: '#222',
    fontSize: 14,
  },

  placeholderText: {
    flex: 1,
    color: '#999',
    fontSize: 14,
  },

  arrow: {
    color: '#7c3aed',
    fontSize: 12,
    marginLeft: 10,
  },

  questionList: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 11,
    marginTop: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  questionItem: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },

  questionText: {
    color: '#333',
    fontSize: 13,
    lineHeight: 19,
  },

  primaryButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  changeButton: {
    alignItems: 'center',
    marginTop: 18,
  },

  changeText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '700',
  },
});