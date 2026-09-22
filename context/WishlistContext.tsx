import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { API_BASE_URL } from '../config/api';

// =====================================================
// PRODUCT TYPE
// =====================================================

export type WishlistProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
};

// =====================================================
// CONTEXT TYPE
// =====================================================

type WishlistContextType = {
  wishlist: WishlistProduct[];

  toggleWishlist: (
    product: WishlistProduct
  ) => Promise<void>;

  isWishlisted: (
    id: string
  ) => boolean;

  removeFromWishlist: (
    id: string
  ) => Promise<void>;

  loadWishlist: () => Promise<void>;

  // Only clears local React state.
  // Does NOT delete database wishlist.
  clearWishlist: () => void;
};

// =====================================================
// CONTEXT
// =====================================================

const WishlistContext =
  createContext<WishlistContextType | undefined>(
    undefined
  );

// =====================================================
// PROVIDER
// =====================================================

export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [wishlist, setWishlist] =
    useState<WishlistProduct[]>([]);

  // ===================================================
  // GET CURRENT USER
  // ===================================================

  const getCurrentUserId =
    async (): Promise<number | null> => {
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

        const userId =
          Number(user?.id);

        if (!userId) {
          return null;
        }

        return userId;
      } catch (error) {
        console.error(
          'Get current user error:',
          error
        );

        return null;
      }
    };

  // ===================================================
  // LOAD USER WISHLIST FROM MYSQL
  // ===================================================

  const loadWishlist =
    async (): Promise<void> => {
      try {
        const userId =
          await getCurrentUserId();

        // No user logged in
        if (!userId) {
          setWishlist([]);
          return;
        }

        console.log(
          'Loading wishlist for user:',
          userId
        );

        const response =
          await fetch(
            `${API_BASE_URL}/api/wishlist/${userId}`
          );

        const data =
          await response.json();

        console.log(
          'Wishlist API response:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              'Failed to load wishlist'
          );
        }

        if (
          !data?.success ||
          !Array.isArray(data?.wishlist)
        ) {
          setWishlist([]);
          return;
        }

        const formattedWishlist =
          data.wishlist.map(
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
            })
          );

        setWishlist(
          formattedWishlist
        );

        console.log(
          'Wishlist loaded:',
          formattedWishlist
        );
      } catch (error) {
        console.error(
          'Load wishlist error:',
          error
        );

        // Never keep previous user's data
        setWishlist([]);
      }
    };

  // ===================================================
  // LOAD WHEN APP STARTS
  // ===================================================

  useEffect(() => {
    loadWishlist();
  }, []);

  // ===================================================
  // ADD / REMOVE WISHLIST
  // ===================================================

  const toggleWishlist =
    async (
      product: WishlistProduct
    ): Promise<void> => {
      try {
        const userId =
          await getCurrentUserId();

        if (!userId) {
          console.log(
            'No logged-in user'
          );
          return;
        }

        const alreadyExists =
          wishlist.some(
            (item) =>
              String(item.id) ===
              String(product.id)
          );

        // -----------------------------------------------
        // REMOVE
        // -----------------------------------------------

        if (alreadyExists) {
          const response =
            await fetch(
              `${API_BASE_URL}/api/wishlist/${product.id}`,
              {
                method: 'DELETE',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                body: JSON.stringify({
                  user_id: userId,
                }),
              }
            );

          const data =
            await response.json();

          console.log(
            'Remove wishlist response:',
            data
          );

          if (!response.ok) {
            throw new Error(
              data?.message ||
                'Failed to remove wishlist item'
            );
          }
        }

        // -----------------------------------------------
        // ADD
        // -----------------------------------------------

        else {
          const response =
            await fetch(
              `${API_BASE_URL}/api/wishlist`,
              {
                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                body: JSON.stringify({
                  user_id: userId,

                  product_id:
                    Number(
                      product.id
                    ),
                }),
              }
            );

          const data =
            await response.json();

          console.log(
            'Add wishlist response:',
            data
          );

          if (!response.ok) {
            throw new Error(
              data?.message ||
                'Failed to add wishlist item'
            );
          }
        }

        // Reload from MySQL
        await loadWishlist();
      } catch (error) {
        console.error(
          'Toggle wishlist error:',
          error
        );
      }
    };

  // ===================================================
  // CHECK WHETHER PRODUCT IS WISHLISTED
  // ===================================================

  const isWishlisted =
    (id: string): boolean => {
      return wishlist.some(
        (item) =>
          String(item.id) ===
          String(id)
      );
    };

  // ===================================================
  // REMOVE FROM WISHLIST PAGE
  // ===================================================

  const removeFromWishlist =
    async (
      id: string
    ): Promise<void> => {
      try {
        const userId =
          await getCurrentUserId();

        if (!userId) {
          return;
        }

        const response =
          await fetch(
            `${API_BASE_URL}/api/wishlist/${id}`,
            {
              method: 'DELETE',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                user_id: userId,
              }),
            }
          );

        const data =
          await response.json();

        console.log(
          'Remove wishlist response:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              'Failed to remove wishlist item'
          );
        }

        // Reload from database
        await loadWishlist();
      } catch (error) {
        console.error(
          'Remove wishlist error:',
          error
        );
      }
    };

  // ===================================================
  // CLEAR LOCAL WISHLIST
  // ===================================================
  //
  // IMPORTANT:
  // This does NOT delete wishlist_items
  // from MySQL.
  //
  // It only clears React memory during logout.
  // When the same user logs in again,
  // loadWishlist() gets their wishlist from MySQL.
  // ===================================================

  const clearWishlist =
    (): void => {
      console.log(
        'Clearing local wishlist'
      );

      setWishlist([]);
    };

  // ===================================================
  // PROVIDER
  // ===================================================

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isWishlisted,
        removeFromWishlist,
        loadWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useWishlist() {
  const context =
    useContext(
      WishlistContext
    );

  if (!context) {
    throw new Error(
      'useWishlist must be used inside WishlistProvider'
    );
  }

  return context;
}