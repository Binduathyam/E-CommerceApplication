
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function HelpSupportScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Help & Support
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
            <Text style={styles.mainIcon}>🆘</Text>
          </View>

          <Text style={styles.title}>
            How can we help you?
          </Text>

          <Text style={styles.description}>
            Find answers to common questions or get
            in touch with our support team.
          </Text>
        </View>

        {/* COMMON HELP */}
        <Text style={styles.sectionTitle}>
          Common Help
        </Text>

        <View style={styles.menuCard}>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>📦</Text>
            </View>

            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>
                Order Issues
              </Text>

              <Text style={styles.menuSubtitle}>
                Problems with your order or delivery
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>💳</Text>
            </View>

            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>
                Payment Issues
              </Text>

              <Text style={styles.menuSubtitle}>
                Problems with payments or transactions
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>👤</Text>
            </View>

            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>
                Account Issues
              </Text>

              <Text style={styles.menuSubtitle}>
                Help with your account
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

        </View>

        {/* CONTACT */}
        <Text style={styles.sectionTitle}>
          Need More Help?
        </Text>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>
            Contact our support team
          </Text>

          <Text style={styles.contactText}>
            If you couldn't find an answer, our support
            team will be happy to help you.
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

  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 18,
  },

  contactTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
  },

  contactText: {
    fontSize: 13,
    color: '#777',
    lineHeight: 20,
    marginTop: 6,
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
});
