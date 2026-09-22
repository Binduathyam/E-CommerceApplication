import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

import { CartProvider } from '../context/CartContext';
import { OrderProvider } from '../context/OrderContext';
import { WishlistProvider } from '../context/WishlistContext';

export const unstable_settings = {
  anchor: 'login/index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={
        colorScheme === 'dark'
          ? DarkTheme
          : DefaultTheme
      }
    >
      <WishlistProvider>
        <OrderProvider>
          <CartProvider>

            <Stack
              initialRouteName="login/index"
              screenOptions={{
                headerShown: false,
              }}
            >

              {/* ==============================
                  LOGIN PAGE
                  FIRST SCREEN
              =============================== */}

              <Stack.Screen
                name="login/index"
                options={{
                  headerShown: false,
                }}
              />

              {/* ==============================
                  REGISTER PAGE
              =============================== */}

              <Stack.Screen
                name="register/index"
                options={{
                  headerShown: false,
                }}
              />

              {/* ==============================
                  CUSTOMER HOME
              =============================== */}

              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />

              {/* ==============================
                  MERCHANT
              =============================== */}

              <Stack.Screen
                name="merchant"
                options={{
                  headerShown: false,
                }}
              />

              {/* ==============================
                  DELIVERY
              =============================== */}

              <Stack.Screen
                name="delivery"
                options={{
                  headerShown: false,
                }}
              />

              {/* ==============================
                  MODAL
              =============================== */}

              <Stack.Screen
                name="modal"
                options={{
                  presentation: 'modal',
                  title: 'Modal',
                }}
              />

            </Stack>

            <StatusBar style="auto" />

          </CartProvider>
        </OrderProvider>
      </WishlistProvider>
    </ThemeProvider>
  );
}