
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ReturnsRefundsScreen() {
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
          Returns & Refunds
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
            <Text style={styles.mainIcon}>↩️</Text>
          </View>

          <Text style={styles.title}>
            Returns & Refunds
          </Text>

          <Text style={styles.description}>
            Learn about our return process, refund
            policy, and what to do if you have an
            issue with your order.
          </Text>
        </View>

        {/* RETURN POLICY */}
        <Text style={styles.sectionTitle}>
          Return Policy
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>
            When can I return an item?
          </Text>

          <Text style={styles.cardText}>
            Items can be returned according to the
            return eligibility shown on the product
            and order details.
          </Text>

          <Text style={styles.cardTitle}>
            Item condition
          </Text>

          <Text style={styles.cardText}>
            Please make sure the item is unused and
            returned with its original packaging,
            accessories, and other included items.
          </Text>

          <Text style={styles.cardTitle}>
            Return request
          </Text>

          <Text style={styles.cardText}>
            To request a return, open your order
            details and follow the available return
            instructions.
          </Text>
        </View>

        {/* REFUNDS */}
        <Text style={styles.sectionTitle}>
          Refunds
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>
            How will I receive my refund?
          </Text>

          <Text style={styles.cardText}>
            Once the returned item is received and
            approved, the refund will be processed
            according to the payment method and
            applicable refund rules.
          </Text>

          <Text style={styles.cardTitle}>
            How long does a refund take?
          </Text>

          <Text style={styles.cardText}>
            Refund processing time can vary depending
            on the payment method and your bank or
            payment provider.
          </Text>
        </View>

        {/* IMPORTANT */}
        <Text style={styles.sectionTitle}>
          Important
        </Text>

        <View style={styles.noteCard}>
          <Text style={styles.noteIcon}>
            ℹ️
          </Text>

          <Text style={styles.noteText}>
            Return and refund eligibility may vary
            depending on the product, seller, order
            status, and applicable policies.
          </Text>
        </View>

        {/* SUPPORT */}
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>
            Still need help?
          </Text>

          <Text style={styles.supportText}>
            If you have a question about a return or
            refund, contact our support team.
          </Text>

          <TouchableOpacity
            style={styles.supportButton}
            onPress={() =>
              router.push('/contact-us' as any)
            }
          >
            <Text style={styles.supportButtonText}>
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

  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 18,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
    marginBottom: 5,
  },

  cardText: {
    fontSize: 13,
    color: '#777',
    lineHeight: 20,
    marginBottom: 17,
  },

  noteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  noteIcon: {
    fontSize: 19,
    marginRight: 10,
  },

  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#777',
    lineHeight: 20,
  },

  supportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 18,
    marginTop: 22,
  },

  supportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
  },

  supportText: {
    fontSize: 13,
    color: '#777',
    lineHeight: 20,
    marginTop: 6,
  },

  supportButton: {
    height: 48,
    borderRadius: 11,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },

  supportButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
