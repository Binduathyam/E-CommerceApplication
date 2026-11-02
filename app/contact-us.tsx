
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ContactUsScreen() {
  const router = useRouter();

  // =====================================================
  // CONTACT DETAILS
  // =====================================================

  const SUPPORT_EMAIL = 'support@shopease.com';
  const SUPPORT_PHONE = '+911234567890';

  // =====================================================
  // OPEN EMAIL
  // =====================================================

  const handleEmail = async () => {
    try {
      const emailUrl = `mailto:${SUPPORT_EMAIL}`;

      const supported =
        await Linking.canOpenURL(emailUrl);

      if (!supported) {
        Alert.alert(
          'Unable to Open Email',
          'No email application is available on this device.'
        );
        return;
      }

      await Linking.openURL(emailUrl);
    } catch (error) {
      console.error(
        'Email opening error:',
        error
      );

      Alert.alert(
        'Unable to Open Email',
        'Something went wrong while opening your email application.'
      );
    }
  };

  // =====================================================
  // OPEN PHONE
  // =====================================================

  const handlePhone = async () => {
    try {
      const phoneUrl = `tel:${SUPPORT_PHONE}`;

      const supported =
        await Linking.canOpenURL(phoneUrl);

      if (!supported) {
        Alert.alert(
          'Unable to Make Call',
          'Unable to open the phone application on this device.'
        );
        return;
      }

      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error(
        'Phone opening error:',
        error
      );

      Alert.alert(
        'Unable to Make Call',
        'Something went wrong while opening the phone application.'
      );
    }
  };

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
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Contact Us
        </Text>

        {/* RIGHT SIDE SPACER */}
        <View style={styles.headerSpacer} />

      </View>

      {/* =================================================
          CONTENT
          ================================================= */}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* =================================================
            INTRO CARD
            ================================================= */}

        <View style={styles.introCard}>

          <View style={styles.mainIconBox}>
            <Text style={styles.mainIcon}>
              📞
            </Text>
          </View>

          <Text style={styles.title}>
            We're here to help
          </Text>

          <Text style={styles.description}>
            Have a question or need assistance?
            Get in touch with our support team.
          </Text>

        </View>

        {/* =================================================
            CONTACT OPTIONS
            ================================================= */}

        <Text style={styles.sectionTitle}>
          Contact Options
        </Text>

        <View style={styles.menuCard}>

          {/* =================================================
              EMAIL
              ================================================= */}

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={handleEmail}
          >

            <View style={styles.iconBox}>
              <Text style={styles.icon}>
                ✉️
              </Text>
            </View>

            <View style={styles.menuInfo}>

              <Text style={styles.menuTitle}>
                Email Us
              </Text>

              <Text style={styles.menuSubtitle}>
                {SUPPORT_EMAIL}
              </Text>

            </View>

            <Text style={styles.arrow}>
              ›
            </Text>

          </TouchableOpacity>

          <View style={styles.divider} />

          {/* =================================================
              PHONE
              ================================================= */}

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={handlePhone}
          >

            <View style={styles.iconBox}>
              <Text style={styles.icon}>
                📱
              </Text>
            </View>

            <View style={styles.menuInfo}>

              <Text style={styles.menuTitle}>
                Call Us
              </Text>

              <Text style={styles.menuSubtitle}>
                +91 12345 67890
              </Text>

            </View>

            <Text style={styles.arrow}>
              ›
            </Text>

          </TouchableOpacity>

        </View>

        {/* =================================================
            SUPPORT HOURS
            ================================================= */}

        <Text style={styles.sectionTitle}>
          Support Hours
        </Text>

        <View style={styles.infoCard}>

          {/* MONDAY - SATURDAY */}

          <View style={styles.infoRow}>

            <Text style={styles.infoLabel}>
              Monday - Saturday
            </Text>

            <Text style={styles.infoValue}>
              9:00 AM - 6:00 PM
            </Text>

          </View>

          <View style={styles.divider} />

          {/* SUNDAY */}

          <View style={styles.infoRow}>

            <Text style={styles.infoLabel}>
              Sunday
            </Text>

            <Text style={styles.infoValue}>
              10:00 AM - 4:00 PM
            </Text>

          </View>

        </View>

        {/* =================================================
            QUICK HELP
            ================================================= */}

        <Text style={styles.sectionTitle}>
          Quick Help
        </Text>

        <View style={styles.helpCard}>

          <Text style={styles.helpTitle}>
            Looking for something else?
          </Text>

          <Text style={styles.helpText}>
            You can also check our Help & Support
            and Returns & Refunds sections for
            frequently asked questions.
          </Text>

          <TouchableOpacity
            style={styles.helpButton}
            activeOpacity={0.8}
            onPress={() =>
              router.push(
                '/help-support' as any
              )
            }
          >

            <Text style={styles.helpButtonText}>
              Help & Support
            </Text>

          </TouchableOpacity>

        </View>

        {/* =================================================
            VERSION
            ================================================= */}

        <Text style={styles.version}>
          ShopEase v1.0.0
        </Text>

      </ScrollView>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  // =====================================================
  // MAIN CONTAINER
  // =====================================================

  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },

  // =====================================================
  // HEADER
  // =====================================================

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

  headerSpacer: {
    width: 42,
  },

  // =====================================================
  // CONTENT
  // =====================================================

  content: {
    padding: 14,
    paddingBottom: 40,
  },

  // =====================================================
  // INTRO CARD
  // =====================================================

  introCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },

  mainIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  mainIcon: {
    fontSize: 30,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#181818',
    textAlign: 'center',
  },

  description: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
  },

  // =====================================================
  // SECTION TITLE
  // =====================================================

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginTop: 22,
    marginBottom: 9,
    marginLeft: 3,
  },

  // =====================================================
  // MENU CARD
  // =====================================================

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

  // =====================================================
  // SUPPORT HOURS
  // =====================================================

  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    paddingHorizontal: 18,
  },

  infoRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  infoLabel: {
    fontSize: 13,
    color: '#666',
  },

  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },

  // =====================================================
  // QUICK HELP
  // =====================================================

  helpCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 18,
  },

  helpTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
  },

  helpText: {
    fontSize: 13,
    color: '#777',
    lineHeight: 20,
    marginTop: 6,
  },

  helpButton: {
    height: 48,
    borderRadius: 11,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },

  helpButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  // =====================================================
  // VERSION
  // =====================================================

  version: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 12,
    marginTop: 22,
  },

});
