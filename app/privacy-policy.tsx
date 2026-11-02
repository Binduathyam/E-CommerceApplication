
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>

      {/* HEADER */}

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
          Privacy Policy
        </Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* INTRO */}

        <View style={styles.introCard}>
          <View style={styles.mainIconBox}>
            <Text style={styles.mainIcon}>
              🔒
            </Text>
          </View>

          <Text style={styles.title}>
            Privacy Policy
          </Text>

          <Text style={styles.description}>
            Your privacy is important to us. This
            policy explains how ShopEase handles
            information when you use our app.
          </Text>
        </View>

        {/* INFORMATION WE COLLECT */}

        <Text style={styles.sectionTitle}>
          Information We Collect
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            When you use ShopEase, we may collect
            information that you provide while creating
            an account, placing an order, managing your
            profile, or contacting our support team.
          </Text>

          <Text style={styles.cardText}>
            This may include information such as your
            name, email address, phone number, delivery
            address, and order-related information.
          </Text>
        </View>

        {/* HOW WE USE INFORMATION */}

        <Text style={styles.sectionTitle}>
          How We Use Your Information
        </Text>

        <View style={styles.menuCard}>

          <View style={styles.policyItem}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>
                🛒
              </Text>
            </View>

            <View style={styles.policyInfo}>
              <Text style={styles.policyTitle}>
                Process Orders
              </Text>

              <Text style={styles.policyText}>
                To process, manage, and deliver your
                orders.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.policyItem}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>
                👤
              </Text>
            </View>

            <View style={styles.policyInfo}>
              <Text style={styles.policyTitle}>
                Manage Your Account
              </Text>

              <Text style={styles.policyText}>
                To maintain your account and provide
                app features.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.policyItem}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>
                💬
              </Text>
            </View>

            <View style={styles.policyInfo}>
              <Text style={styles.policyTitle}>
                Customer Support
              </Text>

              <Text style={styles.policyText}>
                To respond to questions, requests, and
                support issues.
              </Text>
            </View>
          </View>

        </View>

        {/* DATA SECURITY */}

        <Text style={styles.sectionTitle}>
          Data Security
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            We take reasonable measures to protect
            information associated with your account
            and use of the ShopEase app.
          </Text>

          <Text style={styles.cardText}>
            However, no method of storing or
            transmitting information over the internet
            can be guaranteed to be completely secure.
          </Text>
        </View>

        {/* INFORMATION SHARING */}

        <Text style={styles.sectionTitle}>
          Information Sharing
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            We do not sell your personal information.
            Information may be shared with service
            providers when necessary to provide
            services such as order processing,
            delivery, payments, or customer support.
          </Text>
        </View>

        {/* YOUR CHOICES */}

        <Text style={styles.sectionTitle}>
          Your Choices
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            You can review and update certain account
            information through the app. You may also
            contact our support team if you have
            questions about your personal information.
          </Text>
        </View>

        {/* POLICY UPDATES */}

        <Text style={styles.sectionTitle}>
          Updates to This Policy
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            We may update this Privacy Policy from time
            to time. Any updated version will be made
            available through the app.
          </Text>
        </View>

        {/* CONTACT */}

        <Text style={styles.sectionTitle}>
          Questions About Privacy?
        </Text>

        <View style={styles.contactCard}>
          <Text style={styles.contactText}>
            If you have questions or concerns about
            this Privacy Policy, please contact our
            support team.
          </Text>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() =>
              router.push('/contact-us' as any)
            }
          >
            <Text style={styles.contactButtonText}>
              Contact Us
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>
          ShopEase v1.0.0
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginTop: 22,
    marginBottom: 9,
    marginLeft: 3,
  },

  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 18,
  },

  cardText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 21,
    marginBottom: 14,
  },

  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    paddingHorizontal: 14,
  },

  policyItem: {
    minHeight: 75,
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

  policyInfo: {
    flex: 1,
    marginLeft: 13,
  },

  policyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },

  policyText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
  },

  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 18,
  },

  contactText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 21,
  },

  contactButton: {
    height: 48,
    borderRadius: 11,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },

  contactButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },

  version: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 12,
    marginTop: 22,
  },
});
