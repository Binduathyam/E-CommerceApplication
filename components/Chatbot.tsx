import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// CHANGE THIS path if your Chatbot file is in a different folder
import { API_BASE_URL } from '../config/api';

// =====================================================
// TYPES
// =====================================================

type Product = {
  id?: number | string;
  name?: string;
  brand?: string;
  category?: string;
  price?: number | string;
  discount?: number | string | null;
  description?: string;
  image?: string;
};

type Video = {
  title?: string;
  url: string;
};

type Message = {
  sender: 'bot' | 'user';
  text: string;
  products?: Product[];
  videos?: Video[];
};

type QuickOption = {
  id: string;
  label: string;
  answer: string;
};

// =====================================================
// CONTENT (same as web)
// =====================================================

const WELCOME_MESSAGE: Message = {
  sender: 'bot',
  text: 'Hi! 👋 Welcome to ShopEase! Ask me about products, prices, discounts, comparisons, or recommendations.',
  products: [],
  videos: [],
};

const SUGGESTIONS = [
  'Show products',
  'Products under ₹30000',
  'Find product videos',
];

const QUICK_OPTIONS: QuickOption[] = [
  {
    id: 'order',
    label: '📦 Where is my order?',
    answer: 'You can track your order from Profile → Order History → Track Order.',
  },
  {
    id: 'cancel',
    label: '❌ How can I cancel my order?',
    answer:
      'Open Profile → Order History → View Details. If cancellation is available, you can cancel it there.',
  },
  {
    id: 'return',
    label: '↩️ How can I return a product?',
    answer: 'Open Order Tracking and select Return for an eligible delivered order.',
  },
  {
    id: 'delivery',
    label: '🚚 Delivery time',
    answer:
      'Delivery time depends on your location and order. Check Track Order for the latest status.',
  },
  {
    id: 'payment',
    label: '💰 Payment methods',
    answer:
      'Available payment methods are shown during checkout. Cash on Delivery may be available for eligible orders.',
  },
  {
    id: 'cart',
    label: '🛒 Cart / Wishlist help',
    answer:
      'Use the Cart icon to review your cart and the Wishlist icon to see saved products.',
  },
  {
    id: 'account',
    label: '👤 Account help',
    answer: 'Open your Profile to manage your account, addresses, and orders.',
  },
  {
    id: 'support',
    label: '📞 Contact support',
    answer:
      'Please visit the Contact section at the bottom of the ShopEase website.',
  },
];

// =====================================================
// HELPERS
// =====================================================

const baseUrl = () => String(API_BASE_URL).replace(/\/+$/, '');

const getProductPrice = (product: Product) => {
  const price = Number(product.price);

  if (!Number.isFinite(price)) {
    return 'Price unavailable';
  }

  return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const getProductImage = (image?: string) => {
  if (!image || typeof image !== 'string') return '';

  if (/^https?:\/\//i.test(image)) return image;

  return `${baseUrl()}/${image.replace(/^\/+/, '')}`;
};

// hides the image if it fails to load (same as web onError)
function ProductImage({ image, name }: { image?: string; name?: string }) {
  const [failed, setFailed] = useState(false);
  const uri = getProductImage(image);

  if (!uri || failed) return null;

  return (
    <Image
      source={{ uri }}
      accessibilityLabel={name || 'Product'}
      style={styles.productImage}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

// =====================================================
// COMPONENT
// =====================================================

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);

  const scrollRef = useRef<ScrollView>(null);
  const lastQuestionRef = useRef('');

  const scrollToEnd = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  // ---------------------------------------------------
  // LOCAL QUICK ANSWERS (no backend call)
  // ---------------------------------------------------

  const addLocalConversation = (option: QuickOption) => {
    setMessages((previous) => [
      ...previous,
      { sender: 'user', text: option.label },
      { sender: 'bot', text: option.answer, products: [], videos: [] },
    ]);

    setError('');
    scrollToEnd();
  };

  // ---------------------------------------------------
  // SEND MESSAGE TO BACKEND
  // ---------------------------------------------------

  const sendMessage = async (text: string = input, isRetry = false) => {
    const question = text.trim();

    if (!question || loading) return;

    lastQuestionRef.current = question;

    setInput('');
    setError('');
    setLoading(true);

    // on retry the user's message is already in the chat
    if (!isRetry) {
      setMessages((previous) => [
        ...previous,
        { sender: 'user', text: question },
      ]);
    }

    scrollToEnd();

    try {
      const response = await fetch(`${baseUrl()}/api/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to get an answer.');
      }

      setMessages((previous) => [
        ...previous,
        {
          sender: 'bot',
          text: data.answer || "I couldn't find an answer.",
          products: Array.isArray(data.products) ? data.products : [],
          videos: Array.isArray(data.videos) ? data.videos : [],
        },
      ]);
    } catch (err) {
      console.error('ShopEase chatbot error:', err);
      setError("Couldn't connect to the assistant. Please try again.");
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  };

  const clearChat = () => {
    if (loading) return;

    setMessages([WELCOME_MESSAGE]);
    setInput('');
    setError('');
  };

  const openVideo = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Unable to open video link:', err)
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      {/* FLOATING BUTTON */}
      {!isOpen && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.floatingButton}
          onPress={() => setIsOpen(true)}
          accessibilityLabel="Open ShopEase Assistant"
        >
          <Text style={styles.floatingIcon}>💬</Text>
        </TouchableOpacity>
      )}

      {/* CHAT WINDOW */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalBackground}>
            <View style={styles.chatWindow}>
              {/* ============ HEADER ============ */}

              <View style={styles.header}>
                <View style={styles.headerInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>🤖</Text>
                  </View>

                  <View>
                    <Text style={styles.headerTitle}>ShopEase Assistant</Text>
                    <Text style={styles.onlineText}>● Shopping help</Text>
                  </View>
                </View>

                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={clearChat}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.headerButtonText,
                        loading && styles.dimmed,
                      ]}
                    >
                      ↻
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setIsOpen(false)}
                  >
                    <Text style={styles.closeText}>×</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ============ MESSAGES ============ */}

              <ScrollView
                ref={scrollRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={scrollToEnd}
              >
                <Text style={styles.dateLabel}>Your ShopEase assistant</Text>

                {messages.map((message, index) => {
                  const isUser = message.sender === 'user';

                  return (
                    <View
                      key={`${index}-${message.sender}`}
                      style={isUser ? styles.userGroup : styles.botGroup}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          isUser ? styles.userMessage : styles.botMessage,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            isUser
                              ? styles.userMessageText
                              : styles.botMessageText,
                          ]}
                        >
                          {message.text}
                        </Text>
                      </View>

                      {/* PRODUCTS */}
                      {!isUser &&
                        !!message.products &&
                        message.products.length > 0 && (
                          <View style={styles.resultsBox}>
                            <Text style={styles.sectionTitle}>
                              Products for you
                            </Text>

                            {message.products.map((product, productIndex) => (
                              <View
                                key={String(product.id ?? productIndex)}
                                style={styles.productCard}
                              >
                                <ProductImage
                                  image={product.image}
                                  name={product.name}
                                />

                                <View style={styles.productInfo}>
                                  <Text style={styles.productName}>
                                    {product.name}
                                  </Text>

                                  {!!product.brand && (
                                    <Text style={styles.productMeta}>
                                      Brand: {product.brand}
                                    </Text>
                                  )}

                                  {!!product.category && (
                                    <Text style={styles.productMeta}>
                                      Category: {product.category}
                                    </Text>
                                  )}

                                  <Text style={styles.productPrice}>
                                    {getProductPrice(product)}
                                  </Text>

                                  {product.discount != null &&
                                    Number(product.discount) > 0 && (
                                      <Text style={styles.discountText}>
                                        {product.discount}% discount
                                      </Text>
                                    )}

                                  {!!product.description && (
                                    <Text style={styles.productDescription}>
                                      {product.description.length > 140
                                        ? `${product.description.slice(0, 140)}...`
                                        : product.description}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>
                        )}

                      {/* VIDEOS */}
                      {!isUser &&
                        !!message.videos &&
                        message.videos.length > 0 && (
                          <View style={styles.resultsBox}>
                            <Text style={styles.sectionTitle}>
                              ▶ Related YouTube videos
                            </Text>

                            {message.videos.map((video, videoIndex) => (
                              <TouchableOpacity
                                key={`${videoIndex}-${video.url}`}
                                style={styles.videoLink}
                                activeOpacity={0.8}
                                onPress={() => openVideo(video.url)}
                              >
                                <Text style={styles.videoIcon}>▶</Text>
                                <Text style={styles.videoTitle} numberOfLines={2}>
                                  {video.title}
                                </Text>
                                <Text style={styles.videoArrow}>↗</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                    </View>
                  );
                })}

                {/* ============ SUGGESTIONS + QUICK OPTIONS ============ */}

                {messages.length === 1 && (
                  <View style={styles.optionsContainer}>
                    <Text style={styles.chooseText}>
                      How can I help you today?
                    </Text>

                    <View style={styles.suggestionsRow}>
                      {SUGGESTIONS.map((suggestion) => (
                        <TouchableOpacity
                          key={suggestion}
                          style={styles.suggestionChip}
                          activeOpacity={0.75}
                          onPress={() => sendMessage(suggestion)}
                          disabled={loading}
                        >
                          <Text style={styles.suggestionText}>
                            {suggestion}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.chooseText, styles.helpHeading]}>
                      Other help
                    </Text>

                    {QUICK_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        activeOpacity={0.75}
                        style={styles.optionButton}
                        onPress={() => addLocalConversation(option)}
                        disabled={loading}
                      >
                        <Text style={styles.optionText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* ============ TYPING ============ */}

                {loading && (
                  <View style={[styles.messageBubble, styles.botMessage, styles.typingRow]}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text style={styles.typingText}>Finding an answer...</Text>
                  </View>
                )}

                {/* ============ ERROR ============ */}

                {!!error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>

                    <TouchableOpacity
                      onPress={() => sendMessage(lastQuestionRef.current, true)}
                      disabled={loading}
                    >
                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              {/* ============ INPUT ============ */}

              <View style={styles.inputArea}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask about products, prices..."
                  placeholderTextColor="#888"
                  style={styles.input}
                  maxLength={1000}
                  editable={!loading}
                  returnKeyType="send"
                  onSubmitEditing={() => sendMessage()}
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.sendButton,
                    (loading || !input.trim()) && styles.sendDisabled,
                  ]}
                  onPress={() => sendMessage()}
                  disabled={loading || !input.trim()}
                >
                  <Text style={styles.sendButtonText}>{loading ? '…' : '➤'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.footerNote}>
                ShopEase Assistant · Check product details before purchase
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  dimmed: { opacity: 0.4 },

  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 999,
  },
  floatingIcon: { fontSize: 28 },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  chatWindow: {
    width: '100%',
    height: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  // header
  header: {
    height: 72,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 24 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  onlineText: {
    color: '#D1FAE5',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtonText: { color: '#FFFFFF', fontSize: 27, fontWeight: '600' },
  closeText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32,
  },

  // messages
  messagesContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  messagesContent: { padding: 14, paddingBottom: 20 },
  dateLabel: {
    alignSelf: 'center',
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  botGroup: { alignItems: 'flex-start', marginBottom: 4 },
  userGroup: { alignItems: 'flex-end', marginBottom: 4 },
  messageBubble: {
    maxWidth: '85%',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  botMessageText: { color: '#1E293B' },
  userMessageText: { color: '#FFFFFF' },

  // products
  resultsBox: { width: '100%', marginBottom: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  productImage: { width: '100%', height: 150, backgroundColor: '#EEE' },
  productInfo: { padding: 10 },
  productName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  productMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  productPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
    marginTop: 2,
  },
  productDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginTop: 6,
  },

  // videos
  videoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  videoIcon: { color: '#DC2626', fontSize: 14, marginRight: 8 },
  videoTitle: { flex: 1, fontSize: 13, color: '#1E293B' },
  videoArrow: { color: '#64748B', fontSize: 14, marginLeft: 8 },

  // options
  optionsContainer: { marginTop: 6 },
  chooseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  helpHeading: { marginTop: 10 },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  suggestionChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 13,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestionText: { color: '#1D4ED8', fontSize: 13, fontWeight: '600' },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  optionText: { color: '#1E293B', fontSize: 14, lineHeight: 20 },

  // typing + error
  typingRow: { flexDirection: 'row', alignItems: 'center' },
  typingText: { marginLeft: 8, fontSize: 12, color: '#475569' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  errorText: { flex: 1, color: '#B91C1C', fontSize: 12, marginRight: 8 },
  retryText: { color: '#2563EB', fontWeight: '800', fontSize: 13 },

  // input
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendDisabled: { opacity: 0.5 },
  sendButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  footerNote: {
    textAlign: 'center',
    fontSize: 10,
    color: '#94A3B8',
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
});
