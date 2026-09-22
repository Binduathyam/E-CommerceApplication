import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type Message = {
  sender: "bot" | "user";
  text: string;
};

type QuickOption = {
  id: string;
  label: string;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Hi! 👋 Welcome to ShopEase. How can I help you?",
    },
  ]);

  const [showOptions, setShowOptions] = useState(true);
  const [inputText, setInputText] = useState("");

  const quickOptions: QuickOption[] = [
    {
      id: "order",
      label: "📦 Where is my order?",
    },
    {
      id: "cancel",
      label: "❌ How can I cancel my order?",
    },
    {
      id: "return",
      label: "↩️ How can I return a product?",
    },
    {
      id: "delivery",
      label: "🚚 How long will delivery take?",
    },
    {
      id: "payment",
      label: "💰 Payment methods",
    },
    {
      id: "cart",
      label: "🛒 Cart / Wishlist help",
    },
    {
      id: "account",
      label: "👤 Account help",
    },
    {
      id: "support",
      label: "📞 Contact support",
    },
  ];

  const addConversation = (
    userText: string,
    botText: string
  ) => {
    setMessages((previous) => [
      ...previous,
      {
        sender: "user",
        text: userText,
      },
      {
        sender: "bot",
        text: botText,
      },
    ]);

    setShowOptions(false);

    setTimeout(() => {
      setShowOptions(true);
    }, 300);
  };

  const handleOption = (option: string) => {
    switch (option) {
      case "order":
        addConversation(
          "📦 Where is my order?",
          "You can track your order from Profile → Order History → Track Order."
        );
        break;

      case "cancel":
        addConversation(
          "❌ How can I cancel my order?",
          "Open Profile → Order History → View Details. If cancellation is available for your order, you can cancel it from there."
        );
        break;

      case "return":
        addConversation(
          "↩️ How can I return a product?",
          "For a delivered order, open Order Tracking and select the Return option. Enter your return reason and submit the request."
        );
        break;

      case "delivery":
        addConversation(
          "🚚 How long will delivery take?",
          "Delivery time depends on your location and order. You can check the latest delivery status from Track Order."
        );
        break;

      case "payment":
        addConversation(
          "💰 What payment methods are available?",
          "ShopEase supports secure online payments and Cash on Delivery where available."
        );
        break;

      case "cart":
        addConversation(
          "🛒 Cart / Wishlist help",
          "Use the 🛒 Cart icon to review your products. Use the ♡ Wishlist icon to view your saved favourite products."
        );
        break;

      case "account":
        addConversation(
          "👤 Account help",
          "Open your Profile to manage your account, orders, addresses and account settings."
        );
        break;

      case "support":
        addConversation(
          "📞 Contact support",
          "You can contact ShopEase support from the Contact section."
        );
        break;

      default:
        break;
    }
  };

  const handleBackToOptions = () => {
    setShowOptions(true);
  };

  const clearChat = () => {
    setMessages([
      {
        sender: "bot",
        text: "Hi! 👋 Welcome to ShopEase. How can I help you?",
      },
    ]);

    setShowOptions(true);
    setInputText("");
  };

  const sendMessage = () => {
    const text = inputText.trim();

    if (!text) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        sender: "user",
        text,
      },
      {
        sender: "bot",
        text: "Please choose one of the options below so I can help you with your ShopEase request.",
      },
    ]);

    setInputText("");
    setShowOptions(true);
  };

  return (
    <>
      {/* FLOATING CHAT BUTTON */}
      {!isOpen && (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.floatingButton}
          onPress={() => setIsOpen(true)}
        >
          <Text style={styles.floatingIcon}>💬</Text>
        </TouchableOpacity>
      )}

      {/* CHAT MODAL */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.chatWindow}>

            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.headerInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>🤖</Text>
                </View>

                <View>
                  <Text style={styles.headerTitle}>
                    ShopEase Assistant
                  </Text>

                  <Text style={styles.onlineText}>
                    ● Online
                  </Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={clearChat}
                >
                  <Text style={styles.headerButtonText}>
                    ↻
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setIsOpen(false)}
                >
                  <Text style={styles.closeText}>
                    ×
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* MESSAGES */}
            <ScrollView
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message, index) => (
                <View
                  key={`${message.sender}-${index}`}
                  style={[
                    styles.messageBubble,
                    message.sender === "user"
                      ? styles.userMessage
                      : styles.botMessage,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.sender === "user"
                        ? styles.userMessageText
                        : styles.botMessageText,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              ))}

              {/* QUICK OPTIONS */}
              {showOptions && (
                <View style={styles.optionsContainer}>
                  <Text style={styles.chooseText}>
                    Choose an option:
                  </Text>

                  {quickOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      activeOpacity={0.75}
                      style={styles.optionButton}
                      onPress={() =>
                        handleOption(option.id)
                      }
                    >
                      <Text style={styles.optionText}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* BACK TO OPTIONS */}
              {!showOptions && (
                <TouchableOpacity
                  style={styles.backOptionsButton}
                  onPress={handleBackToOptions}
                >
                  <Text style={styles.backOptionsText}>
                    ← Show options
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* INPUT */}
            <View style={styles.inputArea}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your question..."
                placeholderTextColor="#888"
                style={styles.input}
                multiline
              />

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.sendButton}
                onPress={sendMessage}
              >
                <Text style={styles.sendButtonText}>
                  ➤
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    zIndex: 999,
  },

  floatingIcon: {
    fontSize: 28,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  chatWindow: {
    width: "100%",
    height: "82%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  header: {
    height: 72,
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  avatarText: {
    fontSize: 24,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  onlineText: {
    color: "#D1FAE5",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerButton: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },

  headerButtonText: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "600",
  },

  closeText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 32,
  },

  messagesContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  messagesContent: {
    padding: 14,
    paddingBottom: 20,
  },

  messageBubble: {
    maxWidth: "85%",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
  },

  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E2E8F0",
    borderBottomLeftRadius: 4,
  },

  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2563EB",
    borderBottomRightRadius: 4,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },

  botMessageText: {
    color: "#1E293B",
  },

  userMessageText: {
    color: "#FFFFFF",
  },

  optionsContainer: {
    marginTop: 6,
  },

  chooseText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },

  optionButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },

  optionText: {
    color: "#1E293B",
    fontSize: 14,
    lineHeight: 20,
  },

  backOptionsButton: {
    alignSelf: "center",
    marginTop: 5,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
  },

  backOptionsText: {
    color: "#1E3A8A",
    fontWeight: "700",
    fontSize: 14,
  },

  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },

  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 14,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
});