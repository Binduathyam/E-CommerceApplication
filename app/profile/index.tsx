
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useCart } from '../../context/CartContext';

type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
};

export default function ProfileScreen() {
  const router = useRouter();

  // =====================================================
  // CART
  // =====================================================

  const { clearLocalCart } = useCart();

  // =====================================================
  // USER STATE
  // =====================================================

  const [user, setUser] =
    React.useState<User | null>(null);

  const [loading, setLoading] =
    React.useState(true);

  // =====================================================
  // LOAD USER
  // =====================================================

  const loadUser = async () => {
    try {
      const savedUser =
        await AsyncStorage.getItem(
          'loggedInUser'
        );

      if (savedUser) {
        const parsedUser =
          JSON.parse(savedUser);

        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error(
        'Profile load error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD USER WHEN SCREEN OPENS
  // =====================================================

  React.useEffect(() => {
    loadUser();
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Logout',
          style: 'destructive',

          onPress: async () => {
            try {
              // -----------------------------------------
              // CLEAR LOCAL CART ONLY
              // -----------------------------------------

              clearLocalCart();

              // -----------------------------------------
              // REMOVE CURRENT LOGIN
              // -----------------------------------------

              await AsyncStorage.removeItem(
                'loggedInUser'
              );

              // -----------------------------------------
              // GO TO LOGIN
              // -----------------------------------------

              router.replace(
                '/login' as any
              );
            } catch (error) {
              console.error(
                'Logout error:',
                error
              );

              Alert.alert(
                'Logout Error',
                'Unable to logout. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  // =====================================================
  // DISPLAY DATA
  // =====================================================

  const displayName =
    user?.name || 'User';

  const displayEmail =
    user?.email || '';

  const displayPhone =
    user?.phone
      ? `+91 ${user.phone}`
      : 'Phone number not available';

  const avatarLetter =
    displayName
      .charAt(0)
      .toUpperCase();

  // =====================================================
  // UI
  // =====================================================

  return (
    <View style={styles.container}>

      {/* =================================================
          HEADER
          ================================================= */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.back()
          }
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.headerTitle}
        >
          My Profile
        </Text>

        <View
          style={{
            width: 42,
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* =================================================
            PROFILE
            ================================================= */}

        <View
          style={styles.profileCard}
        >
          <View style={styles.avatar}>
            <Text
              style={
                styles.avatarText
              }
            >
              {loading
                ? '...'
                : avatarLetter}
            </Text>
          </View>

          <View
            style={styles.profileInfo}
          >
            <Text
              style={styles.name}
            >
              {loading
                ? 'Loading...'
                : displayName}
            </Text>

            <Text
              style={styles.email}
            >
              {loading
                ? ''
                : displayEmail}
            </Text>

            <Text
              style={styles.phone}
            >
              {loading
                ? ''
                : displayPhone}
            </Text>
          </View>
        </View>

        {/* =================================================
            ACCOUNT
            ================================================= */}

        <Text
          style={styles.sectionTitle}
        >
          Account
        </Text>

        <View style={styles.menuCard}>

          {/* MY ORDERS */}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push(
                '/order-history' as any
              )
            }
          >
            <View
              style={styles.iconBox}
            >
              <Text style={styles.icon}>
                📦
              </Text>
            </View>

            <View
              style={styles.menuInfo}
            >
              <Text
                style={styles.menuTitle}
              >
                My Orders
              </Text>

              <Text
                style={
                  styles.menuSubtitle
                }
              >
                View your orders and status
              </Text>
            </View>

            <Text
              style={styles.arrow}
            >
              ›
            </Text>
          </TouchableOpacity>

          <View
            style={styles.divider}
          />

          {/* WISHLIST */}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push(
                '/wishlist' as any
              )
            }
          >
            <View
              style={styles.iconBox}
            >
              <Text style={styles.icon}>
                ❤️
              </Text>
            </View>

            <View
              style={styles.menuInfo}
            >
              <Text
                style={styles.menuTitle}
              >
                Wishlist
              </Text>

              <Text
                style={
                  styles.menuSubtitle
                }
              >
                View your saved products
              </Text>
            </View>

            <Text
              style={styles.arrow}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================================
            DELIVERY
            ================================================= */}

        <Text
          style={styles.sectionTitle}
        >
          Delivery
        </Text>

        <View style={styles.menuCard}>

          {/* MY ADDRESSES */}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push(
                '/address' as any
              )
            }
          >
            <View
              style={styles.iconBox}
            >
              <Text style={styles.icon}>
                📍
              </Text>
            </View>

            <View
              style={styles.menuInfo}
            >
              <Text
                style={styles.menuTitle}
              >
                My Addresses
              </Text>

              <Text
                style={
                  styles.menuSubtitle
                }
              >
                View addresses used in your orders
              </Text>
            </View>

            <Text
              style={styles.arrow}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================================
            SETTINGS
            ================================================= */}

        <Text
          style={styles.sectionTitle}
        >
          Settings
        </Text>

        <View style={styles.menuCard}>

          {/* SETTINGS */}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push(
                '/account-settings' as any
              )
            }
          >
            <View
              style={styles.iconBox}
            >
              <Text style={styles.icon}>
                ⚙️
              </Text>
            </View>

            <View
              style={styles.menuInfo}
            >
              <Text
                style={styles.menuTitle}
              >
                Settings
              </Text>

              <Text
                style={
                  styles.menuSubtitle
                }
              >
                App preferences and settings
              </Text>
            </View>

            <Text
              style={styles.arrow}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================================
            HELP & SUPPORT
            ================================================= */}

        <Text
          style={styles.sectionTitle}
        >
          Help & Support
        </Text>

        <View style={styles.menuCard}>

          {/* HELP & SUPPORT */}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push(
                '/help-support' as any
              )
            }
          >
            <View
              style={styles.iconBox}
            >
              <Text style={styles.icon}>
                🆘
              </Text>
            </View>

            <View
              style={styles.menuInfo}
            >
              <Text
                style={styles.menuTitle}
              >
                Help & Support
              </Text>

              <Text
                style={
                  styles.menuSubtitle
                }
              >
                Get help with your account and orders
              </Text>
            </View>

            <Text
              style={styles.arrow}
            >
              ›
            </Text>
          </TouchableOpacity>

          <View
            style={styles.divider}
          />

          {/* RETURNS & REFUNDS */}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push(
                '/returns-refunds' as any
              )
            }
          >
            <View
              style={styles.iconBox}
            >
              <Text style={styles.icon}>
                ↩️
              </Text>
            </View>

            <View
              style={styles.menuInfo}
            >
              <Text
                style={styles.menuTitle}
              >
                Returns & Refunds
              </Text>

              <Text
                style={
                  styles.menuSubtitle
                }
              >
                Learn about returns and refunds
              </Text>
            </View>

            <Text
              style={styles.arrow}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================================
            COMPANY
            ================================================= */}

        <Text
          style={styles.sectionTitle}
        >
          Company
        </Text>

        <View style={styles.menuCard}>

          {/* ABOUT US */}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push(
                '/about-us' as any
              )
            }
          >
            <View
              style={styles.iconBox}
            >
              <Text style={styles.icon}>
                ℹ️
              </Text>
            </View>

            <View
              style={styles.menuInfo}
            >
              <Text
                style={styles.menuTitle}
              >
                About Us
              </Text>

              <Text
                style={
                  styles.menuSubtitle
                }
              >
                Learn more about ShopEase
              </Text>
            </View>

            <Text
              style={styles.arrow}
            >
              ›
            </Text>
          </TouchableOpacity>

          <View
            style={styles.divider}
          />

          {/* CONTACT US */}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push(
                '/contact-us' as any
              )
            }
          >
            <View
              style={styles.iconBox}
            >
              <Text style={styles.icon}>
                📞
              </Text>
            </View>

            <View
              style={styles.menuInfo}
            >
              <Text
                style={styles.menuTitle}
              >
                Contact Us
              </Text>

              <Text
                style={
                  styles.menuSubtitle
                }
              >
                Get in touch with us
              </Text>
            </View>

            <Text
              style={styles.arrow}
            >
              ›
            </Text>
          </TouchableOpacity>

          <View
            style={styles.divider}
          />

          {/* PRIVACY POLICY */}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push(
                '/privacy-policy' as any
              )
            }
          >
            <View
              style={styles.iconBox}
            >
              <Text style={styles.icon}>
                🔒
              </Text>
            </View>

            <View
              style={styles.menuInfo}
            >
              <Text
                style={styles.menuTitle}
              >
                Privacy Policy
              </Text>

              <Text
                style={
                  styles.menuSubtitle
                }
              >
                Learn how we protect your data
              </Text>
            </View>

            <Text
              style={styles.arrow}
            >
              ›
            </Text>
          </TouchableOpacity>

          <View
            style={styles.divider}
          />

          {/* TERMS & CONDITIONS */}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              router.push(
                '/terms-conditions' as any
              )
            }
          >
            <View
              style={styles.iconBox}
            >
              <Text style={styles.icon}>
                📄
              </Text>
            </View>

            <View
              style={styles.menuInfo}
            >
              <Text
                style={styles.menuTitle}
              >
                Terms & Conditions
              </Text>

              <Text
                style={
                  styles.menuSubtitle
                }
              >
                Read our terms and conditions
              </Text>
            </View>

            <Text
              style={styles.arrow}
            >
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================================
            LOGOUT
            ================================================= */}

        <TouchableOpacity
          style={
            styles.logoutButton
          }
          onPress={handleLogout}
        >
          <Text
            style={styles.logoutText}
          >
            Logout
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.version}
        >
          ShopEase v1.0.0
        </Text>

      </ScrollView>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f8f8f8',
    },

    header: {
      paddingTop: 50,
      paddingHorizontal: 16,
      paddingBottom: 15,
      backgroundColor: '#ffffff',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: '#f2f2f2',
      alignItems: 'center',
      justifyContent: 'center',
    },

    backText: {
      fontSize: 32,
      color: '#222',
      marginTop: -4,
    },

    headerTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: '#181818',
    },

    content: {
      padding: 14,
      paddingBottom: 40,
    },

    profileCard: {
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
    },

    avatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#7c3aed',
      justifyContent: 'center',
      alignItems: 'center',
    },

    avatarText: {
      color: '#ffffff',
      fontSize: 28,
      fontWeight: '900',
    },

    profileInfo: {
      marginLeft: 15,
      flex: 1,
    },

    name: {
      fontSize: 20,
      fontWeight: '800',
      color: '#181818',
    },

    email: {
      marginTop: 5,
      fontSize: 13,
      color: '#666',
    },

    phone: {
      marginTop: 3,
      fontSize: 13,
      color: '#777',
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: '#333',
      marginTop: 22,
      marginBottom: 9,
      marginLeft: 3,
    },

    menuCard: {
      backgroundColor: '#ffffff',
      borderRadius: 15,
      paddingHorizontal: 14,
    },

    menuItem: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
    },

    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 11,
      backgroundColor: '#f3f0ff',
      justifyContent: 'center',
      alignItems: 'center',
    },

    icon: {
      fontSize: 20,
    },

    menuInfo: {
      flex: 1,
      marginLeft: 13,
    },

    menuTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: '#222',
    },

    menuSubtitle: {
      fontSize: 12,
      color: '#888',
      marginTop: 3,
    },

    arrow: {
      fontSize: 27,
      color: '#aaa',
      marginLeft: 8,
    },

    divider: {
      height: 1,
      backgroundColor: '#eeeeee',
    },

    logoutButton: {
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#ef4444',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 25,
    },

    logoutText: {
      color: '#ef4444',
      fontSize: 15,
      fontWeight: '800',
    },

    version: {
      textAlign: 'center',
      color: '#aaa',
      fontSize: 12,
      marginTop: 18,
    },
  });
