import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../config/api';

// =====================================================
// PRODUCT TYPE
// =====================================================

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
};

// =====================================================
// CART ITEM
// =====================================================

type CartItem = Product & {
  quantity: number;
};

// =====================================================
// LOGGED-IN USER
// =====================================================

type LoggedInUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
};

// =====================================================
// CONTEXT TYPE
// =====================================================

type CartContextType = {
  cartItems: CartItem[];

  addToCart: (
    product: Product
  ) => Promise<void>;

  removeFromCart: (
    productId: string
  ) => Promise<void>;

  increaseQuantity: (
    productId: string
  ) => Promise<void>;

  decreaseQuantity: (
    productId: string
  ) => Promise<void>;

  cartCount: number;

  cartTotal: number;

  // Deletes user's cart from DATABASE.
  // Use after successful order.
  clearCart: () => Promise<void>;

  // Clears ONLY local React state.
  // Use during logout.
  clearLocalCart: () => void;

  // Load current user's cart from backend.
  loadCart: () => Promise<void>;

  loading: boolean;
};

// =====================================================
// CONTEXT
// =====================================================

const CartContext =
  createContext<CartContextType | undefined>(
    undefined
  );

// =====================================================
// PROVIDER
// =====================================================

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    cartItems,
    setCartItems,
  ] = useState<CartItem[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  // ===================================================
  // GET LOGGED-IN USER
  // ===================================================

  const getLoggedInUser =
    async (): Promise<
      LoggedInUser | null
    > => {
      try {
        const savedUser =
          await AsyncStorage.getItem(
            'loggedInUser'
          );

        if (!savedUser) {
          return null;
        }

        const user =
          JSON.parse(savedUser);

        if (!user?.id) {
          return null;
        }

        return {
          id: Number(user.id),
          name: String(
            user.name || ''
          ),
          email: String(
            user.email || ''
          ),
          phone:
            user.phone || null,
        };
      } catch (error) {
        console.error(
          'Get logged-in user error:',
          error
        );

        return null;
      }
    };

  // ===================================================
  // LOAD CART FROM MYSQL
  // ===================================================

  const loadCart =
    async (): Promise<void> => {
      try {
        setLoading(true);

        const user =
          await getLoggedInUser();

        // No user
        if (!user?.id) {
          setCartItems([]);
          return;
        }

        console.log(
          'Loading cart for user:',
          user.id
        );

        const url =
          `${API_BASE_URL}/api/cart/${user.id}`;

        console.log(
          'Cart GET URL:',
          url
        );

        const response =
          await fetch(url);

        const data =
          await response.json();

        console.log(
          'Cart response:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              'Failed to load cart'
          );
        }

        const backendCart =
          Array.isArray(data?.cart)
            ? data.cart
            : [];

        const formattedCart =
          backendCart.map(
            (item: any) => ({
              id: String(
                item.product_id
              ),

              name: String(
                item.name || ''
              ),

              category: String(
                item.category || ''
              ),

              price: Number(
                item.price || 0
              ),

              image: String(
                item.image || ''
              ),

              quantity: Math.max(
                1,
                Number(
                  item.quantity || 1
                )
              ),
            })
          );

        setCartItems(
          formattedCart
        );

        console.log(
          'Cart loaded:',
          formattedCart
        );
      } catch (error) {
        console.error(
          'Load cart error:',
          error
        );

        // Never show previous user's data
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

  // ===================================================
  // LOAD CART WHEN APP STARTS
  // ===================================================

  useEffect(() => {
    loadCart();
  }, []);

  // ===================================================
  // ADD TO CART
  // ===================================================

  const addToCart =
    async (
      product: Product
    ): Promise<void> => {
      try {
        const user =
          await getLoggedInUser();

        if (!user?.id) {
          console.log(
            'Add to cart: No logged-in user'
          );

          return;
        }

        console.log(
          'Adding product:',
          product.id,
          'User:',
          user.id
        );

        const url =
          `${API_BASE_URL}/api/cart`;

        console.log(
          'Cart POST URL:',
          url
        );

        const response =
          await fetch(url, {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              user_id:
                user.id,

              product_id:
                Number(product.id),

              quantity: 1,
            }),
          });

        const data =
          await response.json();

        console.log(
          'Add cart response:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              'Failed to add product to cart'
          );
        }

        // Get latest cart from database
        await loadCart();
      } catch (error) {
        console.error(
          'Add to cart error:',
          error
        );
      }
    };

  // ===================================================
  // REMOVE FROM CART
  // ===================================================

  const removeFromCart =
    async (
      productId: string
    ): Promise<void> => {
      try {
        const user =
          await getLoggedInUser();

        if (!user?.id) {
          return;
        }

        const url =
          `${API_BASE_URL}/api/cart/${productId}`;

        const response =
          await fetch(url, {
            method: 'DELETE',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              user_id:
                user.id,
            }),
          });

        const data =
          await response.json();

        console.log(
          'Remove cart response:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              'Failed to remove product'
          );
        }

        await loadCart();
      } catch (error) {
        console.error(
          'Remove cart error:',
          error
        );
      }
    };

  // ===================================================
  // INCREASE QUANTITY
  // ===================================================

  const increaseQuantity =
    async (
      productId: string
    ): Promise<void> => {
      try {
        const user =
          await getLoggedInUser();

        if (!user?.id) {
          return;
        }

        const currentItem =
          cartItems.find(
            (item) =>
              String(item.id) ===
              String(productId)
          );

        if (!currentItem) {
          return;
        }

        const newQuantity =
          currentItem.quantity + 1;

        const response =
          await fetch(
            `${API_BASE_URL}/api/cart/${productId}`,
            {
              method: 'PUT',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                user_id:
                  user.id,

                quantity:
                  newQuantity,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              'Failed to update quantity'
          );
        }

        await loadCart();
      } catch (error) {
        console.error(
          'Increase quantity error:',
          error
        );
      }
    };

  // ===================================================
  // DECREASE QUANTITY
  // ===================================================

  const decreaseQuantity =
    async (
      productId: string
    ): Promise<void> => {
      try {
        const user =
          await getLoggedInUser();

        if (!user?.id) {
          return;
        }

        const currentItem =
          cartItems.find(
            (item) =>
              String(item.id) ===
              String(productId)
          );

        if (!currentItem) {
          return;
        }

        const newQuantity =
          currentItem.quantity - 1;

        const response =
          await fetch(
            `${API_BASE_URL}/api/cart/${productId}`,
            {
              method: 'PUT',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                user_id:
                  user.id,

                quantity:
                  newQuantity,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              'Failed to update quantity'
          );
        }

        await loadCart();
      } catch (error) {
        console.error(
          'Decrease quantity error:',
          error
        );
      }
    };

  // ===================================================
  // CLEAR CART FROM DATABASE
  // ===================================================
  //
  // Use this after ORDER SUCCESS.
  //
  // This removes current user's cart from MySQL.
  // ===================================================

  const clearCart =
    async (): Promise<void> => {
      try {
        const user =
          await getLoggedInUser();

        if (!user?.id) {
          setCartItems([]);
          return;
        }

        const currentItems =
          [...cartItems];

        for (
          const item of currentItems
        ) {
          try {
            await fetch(
              `${API_BASE_URL}/api/cart/${item.id}`,
              {
                method: 'DELETE',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                body: JSON.stringify({
                  user_id:
                    user.id,
                }),
              }
            );
          } catch (itemError) {
            console.error(
              'Delete cart item error:',
              itemError
            );
          }
        }

        setCartItems([]);
      } catch (error) {
        console.error(
          'Clear cart error:',
          error
        );
      }
    };

  // ===================================================
  // CLEAR LOCAL CART ONLY
  // ===================================================
  //
  // IMPORTANT:
  // DO NOT DELETE DATABASE DATA.
  //
  // Use during LOGOUT.
  //
  // When user logs in again,
  // loadCart() gets their cart from MySQL.
  // ===================================================

  const clearLocalCart =
    (): void => {
      console.log(
        'Clearing local cart only'
      );

      setCartItems([]);
    };

  // ===================================================
  // CART COUNT
  // ===================================================

  const cartCount =
    cartItems.reduce(
      (
        total,
        item
      ) =>
        total +
        item.quantity,
      0
    );

  // ===================================================
  // CART TOTAL
  // ===================================================

  const cartTotal =
    cartItems.reduce(
      (
        total,
        item
      ) =>
        total +
        item.price *
          item.quantity,
      0
    );

  // ===================================================
  // PROVIDER
  // ===================================================

  return (
    <CartContext.Provider
      value={{
        cartItems,

        addToCart,

        removeFromCart,

        increaseQuantity,

        decreaseQuantity,

        cartCount,

        cartTotal,

        clearCart,

        clearLocalCart,

        loadCart,

        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// =====================================================
// USE CART
// =====================================================

export function useCart() {
  const context =
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      'useCart must be used inside CartProvider'
    );
  }

  return context;
}