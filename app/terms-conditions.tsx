
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TermsConditionsScreen() {
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
          Terms & Conditions
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
              📄
            </Text>
          </View>

          <Text style={styles.title}>
            Terms & Conditions
          </Text>

          <Text style={styles.description}>
            Please read these terms carefully before
            using the ShopEase application.
          </Text>
        </View>

        {/* ACCEPTANCE */}

        <Text style={styles.sectionTitle}>
          1. Acceptance of Terms
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            By accessing or using the ShopEase app,
            you agree to comply with these Terms &
            Conditions. If you do not agree with these
            terms, please do not use the application.
          </Text>
        </View>

        {/* ACCOUNT */}

        <Text style={styles.sectionTitle}>
          2. User Account
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            You may need to create an account to use
            certain features of ShopEase. You are
            responsible for providing accurate
            information and keeping your account
            information secure.
          </Text>

          <Text style={styles.cardText}>
            You are responsible for activity performed
            through your account.
          </Text>
        </View>

        {/* PRODUCTS */}

        <Text style={styles.sectionTitle}>
          3. Products & Orders
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            Product information, prices, availability,
            and images may change from time to time.
          </Text>

          <Text style={styles.cardText}>
            Placing an order does not necessarily mean
            that the order has been accepted. Orders
            may be cancelled or modified when required
            due to availability, pricing, payment, or
            other applicable reasons.
          </Text>
        </View>

        {/* PAYMENTS */}

        <Text style={styles.sectionTitle}>
          4. Payments
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            Payments must be completed using the
            payment methods made available through
            the application.
          </Text>

          <Text style={styles.cardText}>
            You agree to provide valid and accurate
            payment information when required.
          </Text>
        </View>

        {/* DELIVERY */}

        <Text style={styles.sectionTitle}>
          5. Delivery
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            Delivery times may vary depending on the
            delivery location, product availability,
            seller, courier, and other circumstances.
          </Text>

          <Text style={styles.cardText}>
            ShopEase cannot guarantee delivery at an
            exact time unless a specific delivery slot
            has been confirmed.
          </Text>
        </View>

        {/* RETURNS */}

        <Text style={styles.sectionTitle}>
          6. Returns & Refunds
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            Returns and refunds are subject to the
            applicable return policy, product
            eligibility, order status, and other
            conditions.
          </Text>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              router.push(
                '/returns-refunds' as any
              )
            }
          >
            <Text style={styles.linkButtonText}>
              View Returns & Refunds
            </Text>

            <Text style={styles.linkArrow}>
              ›
            </Text>
          </TouchableOpacity>
        </View>

        {/* PROHIBITED USE */}

        <Text style={styles.sectionTitle}>
          7. Prohibited Use
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            You must not use ShopEase for unlawful
            activities, attempt to interfere with the
            application's operation, or misuse the
            services provided through the platform.
          </Text>
        </View>

        {/* INTELLECTUAL PROPERTY */}

        <Text style={styles.sectionTitle}>
          8. Intellectual Property
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            The ShopEase application, its design,
            content, branding, graphics, and other
            materials may be protected by applicable
            intellectual property laws.
          </Text>
        </View>

        {/* LIMITATION */}

        <Text style={styles.sectionTitle}>
          9. Service Availability
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            We may update, modify, suspend, or
            discontinue parts of the application or
            services when necessary.
          </Text>

          <Text style={styles.cardText}>
            We aim to keep the service reliable but
            cannot guarantee that the application will
            always be available without interruptions.
          </Text>
        </View>

        {/* CHANGES */}

        <Text style={styles.sectionTitle}>
          10. Changes to These Terms
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            We may update these Terms & Conditions
            from time to time. Updated terms will be
            made available through the application.
          </Text>
        </View>

        {/* CONTACT */}

        <Text style={styles.sectionTitle}>
          Questions?
        </Text>

        <View style={styles.contactCard}>
          <Text style={styles.contactText}>
            If you have questions about these Terms &
            Conditions, please contact our support team.
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

  linkButton: {
    minHeight: 48,
    borderRadius: 11,
    backgroundColor: '#f3f0ff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  linkButtonText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '800',
  },

  linkArrow: {
    color: '#7c3aed',
    fontSize: 25,
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
