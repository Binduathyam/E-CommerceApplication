
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AboutUsScreen() {
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
          About Us
        </Text>

        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* INTRO */}
        <View style={styles.introCard}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>
              S
            </Text>
          </View>

          <Text style={styles.title}>
            Welcome to ShopEase
          </Text>

          <Text style={styles.description}>
            Your simple and convenient destination
            for shopping online.
          </Text>
        </View>

        {/* WHO WE ARE */}
        <Text style={styles.sectionTitle}>
          Who We Are
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardText}>
            ShopEase is an online shopping platform
            designed to make everyday shopping simple,
            convenient, and accessible.
          </Text>

          <Text style={styles.cardText}>
            We bring products from different categories
            together in one place, allowing customers
            to discover products, place orders, and
            manage their shopping experience with ease.
          </Text>
        </View>

        {/* OUR MISSION */}
        <Text style={styles.sectionTitle}>
          Our Mission
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.featureRow}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>
                🛍️
              </Text>
            </View>

            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>
                Easy Shopping
              </Text>

              <Text style={styles.featureText}>
                Make finding and purchasing products
                simple and convenient.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featureRow}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>
                ⭐
              </Text>
            </View>

            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>
                Quality Experience
              </Text>

              <Text style={styles.featureText}>
                Provide a smooth and reliable shopping
                experience for our customers.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featureRow}>
            <View style={styles.iconBox}>
              <Text style={styles.icon}>
                🤝
              </Text>
            </View>

            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>
                Customer First
              </Text>

              <Text style={styles.featureText}>
                Build our services around the needs of
                our customers.
              </Text>
            </View>
          </View>
        </View>

        {/* OUR PROMISE */}
        <Text style={styles.sectionTitle}>
          Our Promise
        </Text>

        <View style={styles.promiseCard}>
          <Text style={styles.promiseText}>
            We continuously work to improve ShopEase
            and provide a better experience every time
            you shop with us.
          </Text>
        </View>

        {/* VERSION */}
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
    padding: 24,
    alignItems: 'center',
  },

  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
  },

  logoText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '900',
  },

  title: {
    fontSize: 21,
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

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
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

  featureInfo: {
    flex: 1,
    marginLeft: 13,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  },

  featureText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
  },

  promiseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 18,
  },

  promiseText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 21,
  },

  version: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 12,
    marginTop: 22,
  },
});
