import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type TourTarget = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TourStep = {
  title: string;
  text: string;
  target: string | null;
};

type TourRefs = {
  [key: string]: React.RefObject<View | null>;
};

type LiveTourProps = {
  role?: 'customer' | 'merchant' | 'delivery' | 'delivery_partner';
  targets?: TourRefs;
  onFinish?: () => void;
};

const screen = Dimensions.get('window');
const SCREEN_WIDTH = screen.width;
const SCREEN_HEIGHT = screen.height;

export default function LiveTour({
  role = 'customer',
  targets = {},
  onFinish,
}: LiveTourProps) {
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState<TourTarget | null>(null);

  // =========================================
  // CUSTOMER TOUR
  // =========================================

  const customerSteps: TourStep[] = [
    {
      title: '👋 Welcome to ShopEase!',
      text:
        'Welcome to ShopEase. Let us quickly show you the main features of the app.',
      target: null,
    },
    {
      title: '🔍 Search Products',
      text:
        'Use this search bar to quickly find the products you are looking for.',
      target: 'tour-search',
    },
    {
      title: '👤 Profile',
      text:
        'Tap here to view and manage your profile, orders and account settings.',
      target: 'tour-profile',
    },
    {
      title: '♡ Wishlist',
      text:
        'Save your favourite products here so you can easily find them later.',
      target: 'tour-wishlist',
    },
    {
      title: '🛒 Cart',
      text:
        'Products you add to your cart will appear here. Review your products and continue to checkout.',
      target: 'tour-cart',
    },
    {
      title: "🎉 You're Ready!",
      text:
        "That's all! You now know the main features of ShopEase. Happy shopping!",
      target: null,
    },
  ];

  // =========================================
  // MERCHANT TOUR
  // =========================================

  const merchantSteps: TourStep[] = [
    {
      title: '👋 Welcome Merchant!',
      text:
        'Welcome to the ShopEase Merchant Dashboard. Let us quickly show you the important sections.',
      target: null,
    },
    {
      title: '📦 My Products',
      text:
        'Use My Products to add, edit and manage the products you sell on ShopEase.',
      target: 'tour-merchant-products',
    },
    {
      title: '🛍️ Orders',
      text:
        'Check customer orders here and manage the order processing status.',
      target: 'tour-merchant-orders',
    },
    {
      title: '📊 Inventory',
      text:
        'Manage your product stock and keep track of available inventory here.',
      target: 'tour-merchant-inventory',
    },
    {
      title: '💰 Sales',
      text:
        'View your sales information and monitor your business performance here.',
      target: 'tour-merchant-sales',
    },
    {
      title: '👤 Profile',
      text:
        'Manage your merchant profile and account information from here.',
      target: 'tour-merchant-profile',
    },
    {
      title: '➕ Add Product',
      text:
        'Use this option to quickly add a new product to your ShopEase store.',
      target: 'tour-merchant-add-product',
    },
    {
      title: "🎉 You're Ready!",
      text:
        'You now know the main sections of the Merchant Dashboard. Start managing your store!',
      target: null,
    },
  ];

  // =========================================
  // DELIVERY TOUR
  // =========================================

  const deliverySteps: TourStep[] = [
    {
      title: '👋 Welcome Delivery Partner!',
      text:
        'Welcome to the ShopEase Delivery Dashboard. Let us quickly show you the important sections.',
      target: null,
    },
    {
      title: '🚚 My Deliveries',
      text:
        'View and manage the deliveries assigned to you from this section.',
      target: 'tour-delivery-my-deliveries',
    },
    {
      title: '📦 Assigned Orders',
      text:
        'Check orders that have been assigned to you and accept them for delivery.',
      target: 'tour-delivery-assigned-orders',
    },
    {
      title: '↩️ Returns',
      text:
        'Manage customer return requests and update the return status from here.',
      target: 'tour-delivery-returns',
    },
    {
      title: '🕘 Delivery History',
      text:
        'View your previously completed deliveries and delivery history here.',
      target: 'tour-delivery-history',
    },
    {
      title: '💰 Earnings',
      text:
        'Check your delivery earnings and payment information from this section.',
      target: 'tour-delivery-earnings',
    },
    {
      title: '👤 Profile',
      text:
        'Manage your delivery partner profile and account information here.',
      target: 'tour-delivery-profile',
    },
    {
      title: "🎉 You're Ready!",
      text:
        'You now know the main sections of the Delivery Dashboard. Happy delivering!',
      target: null,
    },
  ];

  // =========================================
  // SELECT TOUR
  // =========================================

  let steps = customerSteps;

  if (role === 'merchant') {
    steps = merchantSteps;
  }

  if (
    role === 'delivery' ||
    role === 'delivery_partner'
  ) {
    steps = deliverySteps;
  }

  const currentStep = steps[step];

  // =========================================
  // MEASURE TARGET
  // =========================================

  const updatePosition = () => {
    const targetName = currentStep?.target;

    if (!targetName) {
      setPosition(null);
      return;
    }

    const targetRef = targets[targetName];

    if (!targetRef?.current) {
      setPosition(null);
      return;
    }

    targetRef.current.measureInWindow(
      (x, y, width, height) => {
        setPosition({
          top: y,
          left: x,
          width,
          height,
        });
      }
    );
  };

  // =========================================
  // UPDATE POSITION
  // =========================================

  useEffect(() => {
    const timer1 = setTimeout(() => {
      updatePosition();
    }, 100);

    const timer2 = setTimeout(() => {
      updatePosition();
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [step, role]);

  // =========================================
  // NEXT
  // =========================================

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep((previousStep) => previousStep + 1);
    } else {
      finishTour();
    }
  };

  // =========================================
  // BACK
  // =========================================

  const previousStep = () => {
    if (step > 0) {
      setStep((previousStep) => previousStep - 1);
    }
  };

  // =========================================
  // FINISH
  // =========================================

  const finishTour = () => {
    setPosition(null);

    if (onFinish) {
      onFinish();
    }
  };

  // =========================================
  // CENTER BOX
  // =========================================

  const renderCenterBox = () => {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.stepText}>
          Step {step + 1} of {steps.length}
        </Text>

        <Text style={styles.title}>
          {currentStep?.title}
        </Text>

        <Text style={styles.description}>
          {currentStep?.text}
        </Text>

        <View style={styles.buttonsRow}>
          {step > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={previousStep}
            >
              <Text style={styles.backButtonText}>
                ← Back
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.skipButton}
            onPress={finishTour}
          >
            <Text style={styles.skipButtonText}>
              {step === steps.length - 1
                ? 'Close'
                : 'Skip Tour'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextStep}
          >
            <Text style={styles.nextButtonText}>
              {step === steps.length - 1
                ? 'Finish ✓'
                : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // =========================================
  // TARGET TOOLTIP
  // =========================================

  const renderTargetTooltip = () => {
    if (!position) {
      return renderCenterBox();
    }

    const tooltipWidth = Math.min(
      SCREEN_WIDTH - 30,
      350
    );

    const spaceBelow =
      SCREEN_HEIGHT -
      (position.top + position.height);

    let tooltipTop: number;

    if (spaceBelow >= 230) {
      tooltipTop =
        position.top +
        position.height +
        18;
    } else {
      tooltipTop =
        position.top - 225;
    }

    if (tooltipTop < 20) {
      tooltipTop = 20;
    }

    let tooltipLeft = position.left;

    if (
      tooltipLeft + tooltipWidth >
      SCREEN_WIDTH - 15
    ) {
      tooltipLeft =
        SCREEN_WIDTH -
        tooltipWidth -
        15;
    }

    if (tooltipLeft < 15) {
      tooltipLeft = 15;
    }

    return (
      <View
        style={[
          styles.targetTooltip,
          {
            top: tooltipTop,
            left: tooltipLeft,
            width: tooltipWidth,
          },
        ]}
      >
        <Text style={styles.stepText}>
          Step {step + 1} of {steps.length}
        </Text>

        <Text style={styles.title}>
          {currentStep?.title}
        </Text>

        <Text style={styles.description}>
          {currentStep?.text}
        </Text>

        <View style={styles.buttonsRow}>
          {step > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={previousStep}
            >
              <Text style={styles.backButtonText}>
                ← Back
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.skipButton}
            onPress={finishTour}
          >
            <Text style={styles.skipButtonText}>
              Skip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextStep}
          >
            <Text style={styles.nextButtonText}>
              {step === steps.length - 1
                ? 'Finish ✓'
                : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={finishTour}
    >
      <View style={styles.container}>

        {/* DARK OVERLAY */}

        <View style={styles.overlay} />

        {/* HIGHLIGHT */}

        {position && (
          <View
            pointerEvents="none"
            style={[
              styles.highlight,
              {
                top: position.top - 7,
                left: position.left - 7,
                width: position.width + 14,
                height: position.height + 14,
              },
            ]}
          />
        )}

        {/* CONTENT */}

        {!currentStep?.target
          ? renderCenterBox()
          : renderTargetTooltip()}
      </View>
    </Modal>
  );
}

// =========================================
// STYLES
// =========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },

  highlight: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#a855f7',
    borderRadius: 14,
    backgroundColor: 'rgba(168,85,247,0.12)',
    shadowColor: '#a855f7',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 12,
  },

  centerBox: {
    position: 'absolute',
    width: SCREEN_WIDTH - 30,
    left: 15,
    top: SCREEN_HEIGHT / 2 - 130,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    elevation: 15,
  },

  targetTooltip: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    elevation: 15,
  },

  stepText: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },

  title: {
    color: '#171717',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 9,
  },

  description: {
    color: '#555',
    fontSize: 14,
    lineHeight: 21,
  },

  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 18,
    gap: 8,
    flexWrap: 'wrap',
  },

  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: '#f1f1f1',
  },

  backButtonText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '700',
  },

  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: '#f1f1f1',
  },

  skipButtonText: {
    color: '#555',
    fontSize: 13,
    fontWeight: '700',
  },

  nextButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: '#7c3aed',
  },

  nextButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});