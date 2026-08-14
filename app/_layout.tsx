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
  anchor: '(tabs)',
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
              screenOptions={{
                headerShown: false,
              }}
            >
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />

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