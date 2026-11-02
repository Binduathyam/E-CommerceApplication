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
  // product id
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;

  gst_rate?: number;
  original_price?: number;
  discount?: number;
  selected_size?: string | null;
  variant_id?: number | null;
  stock?: number;
  quantity?: number;

  // optional: lets addToCart pick the cheapest variant when the
  // price is 0 (same fallback as the web App.jsx)
  product_variants?: any[];
};

// =====================================================
// CART ITEM
// =====================================================

export type CartItem = Product & {
  quantity: number;

  // product id as a number
  product_id: number;

  // ID of the row in the cart table.
  // The backend DELETE / PUT routes use THIS id (same as the web).
  cartItemId: number;
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

  // returns true when the product was added, false when it failed
  addToCart: (product: Product) => Promise<boolean>;

  // pass cartItemId when you have it (needed when the same product is in
  // the cart with different sizes). Without it, the first cart row of that
  // product is used.
  removeFromCart: (productId: string, cartItemId?: number) => Promise<void>;
  increaseQuantity: (productId: string, cartItemId?: number) => Promise<void>;
  decreaseQuantity: (productId: string, cartItemId?: number) => Promise<void>;

  cartCount: number;
  cartTotal: number;

  // Deletes user's cart rows from the DATABASE. Use after a successful order.
  clearCart: () => Promise<void>;

  // Clears ONLY local React state. Use during logout.
  clearLocalCart: () => void;

  // Load current user's cart from backend. Call it after login.
  loadCart: () => Promise<void>;

  // BUY NOW (same as web): checkout uses only this item and the
  // saved cart is not touched.
  buyNowItem: Product | null;
  setBuyNowItem: (product: Product | null) => void;
  clearBuyNow: () => void;

  loading: boolean;
};

// =====================================================
// CONTEXT
// =====================================================

const CartContext = createContext<CartContextType | undefined>(undefined);

const parseAttributes = (attributes: any): Record<string, any> => {
  if (!attributes) return {};
  if (typeof attributes === 'object') return attributes;

  try {
    return JSON.parse(attributes);
  } catch {
    return {};
  }
};

// =====================================================
// PROVIDER
// =====================================================

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [buyNowItem, setBuyNowItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  const clearBuyNow = () => setBuyNowItem(null);

  // ===================================================
  // GET LOGGED-IN USER
  // ===================================================

  const getLoggedInUser = async (): Promise<LoggedInUser | null> => {
    try {
      const savedUser = await AsyncStorage.getItem('loggedInUser');

      if (!savedUser) {
        return null;
      }

      const user = JSON.parse(savedUser);

      if (!user?.id) {
        return null;
      }

      return {
        id: Number(user.id),
        name: String(user.name || ''),
        email: String(user.email || ''),
        phone: user.phone || null,
      };
    } catch (error) {
      console.error('Get logged-in user error:', error);
      return null;
    }
  };

  // ===================================================
  // LOAD CART (same mapping as the web App.jsx)
  // ===================================================

  const loadCart = async (): Promise<void> => {
    try {
      setLoading(true);

      const user = await getLoggedInUser();

      if (!user?.id) {
        setCartItems([]);
        return;
      }

      const url = `${API_BASE_URL}/api/cart/${user.id}`;

      console.log('Cart GET URL:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('Cart response:', data);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to load cart');
      }

      const backendCart = Array.isArray(data?.cart) ? data.cart : [];

      const formattedCart: CartItem[] = backendCart.map((item: any) => {
        const variantId = item.variant_id ?? item.variantId ?? null;

        return {
          id: String(item.product_id),
          product_id: Number(item.product_id),

          // actual cart table row id
          cartItemId: Number(item.id),

          name: String(item.name || ''),
          category: String(item.category || ''),
          image: String(item.image || ''),

          price: Number(item.price) || 0,
          original_price: Number(item.original_price) || 0,
          discount: Number(item.discount) || 0,
          gst_rate: Number(item.gst_rate) || 0,

          quantity: Math.max(1, Number(item.quantity) || 1),

          // selected variant + size
          variant_id:
            variantId !== null && variantId !== undefined && variantId !== ''
              ? Number(variantId)
              : null,
          selected_size: item.selected_size ?? item.selectedSize ?? null,
        };
      });

      setCartItems(formattedCart);
    } catch (error) {
      console.error('Load cart error:', error);

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
  // ADD TO CART (same request as the web App.jsx)
  // ===================================================

  const addToCart = async (product: Product): Promise<boolean> => {
    try {
      const user = await getLoggedInUser();

      if (!user?.id) {
        console.log('Add to cart: No logged-in user');
        return false;
      }

      // ---------- price / variant ----------

      let finalPrice = Number(product.price) || 0;
      let variantId = product.variant_id ?? null;
      let selectedSize = product.selected_size ?? null;

      const variants: any[] = Array.isArray(product.product_variants)
        ? product.product_variants
        : [];

      // no variant chosen -> use the cheapest available one
      if (variants.length > 0 && !variantId) {
        const available = variants.filter(
          (variant) =>
            Number(variant.stock || 0) > 0 && variant.available !== false
        );

        const candidates = available.length > 0 ? available : variants;

        const cheapest = candidates.reduce((best, current) => {
          const bestPrice =
            Number(best.discount_price) || Number(best.price) || 0;
          const currentPrice =
            Number(current.discount_price) || Number(current.price) || 0;

          return currentPrice > 0 && (bestPrice === 0 || currentPrice < bestPrice)
            ? current
            : best;
        });

        variantId = cheapest.id ?? null;

        finalPrice =
          Number(cheapest.discount_price) ||
          Number(cheapest.price) ||
          finalPrice;

        const attributes = parseAttributes(cheapest.attributes);

        if (!selectedSize && attributes.size) {
          selectedSize = String(attributes.size);
        }
      }

      // never add a ₹0 item
      if (finalPrice <= 0) {
        console.log('Add to cart: product has no valid price');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          user_id: user.id,
          product_id: Number(product.id),
          quantity: Math.max(1, Number(product.quantity) || 1),
          price: finalPrice,
          gst_rate: Number(product.gst_rate ?? 0),
          selected_size: selectedSize,
          variant_id: variantId,
        }),
      });

      const data = await response.json();

      console.log('Add cart response:', data);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to add product to cart');
      }

      // Get latest cart from database
      await loadCart();

      return true;
    } catch (error) {
      console.error('Add to cart error:', error);
      return false;
    }
  };

  // ===================================================
  // FIND THE CART ROW
  // ===================================================

  const findCartItem = (productId: string, cartItemId?: number) => {
    if (cartItemId !== undefined && cartItemId !== null) {
      return cartItems.find((item) => item.cartItemId === Number(cartItemId));
    }

    return cartItems.find((item) => String(item.id) === String(productId));
  };

  // ===================================================
  // REMOVE FROM CART  (DELETE /api/cart/:cartItemId)
  // ===================================================

  const removeFromCart = async (
    productId: string,
    cartItemId?: number
  ): Promise<void> => {
    try {
      const user = await getLoggedInUser();

      if (!user?.id) {
        return;
      }

      const item = findCartItem(productId, cartItemId);

      if (!item) {
        console.error('Remove cart: item not found', productId, cartItemId);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/cart/${item.cartItemId}`,
        {
          method: 'DELETE',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            user_id: user.id,
          }),
        }
      );

      const data = await response.json();

      console.log('Remove cart response:', data);

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to remove product');
      }

      await loadCart();
    } catch (error) {
      console.error('Remove cart error:', error);
    }
  };

  // ===================================================
  // UPDATE QUANTITY  (PUT /api/cart/:cartItemId)
  // ===================================================

  const updateQuantity = async (
    productId: string,
    change: 1 | -1,
    cartItemId?: number
  ): Promise<void> => {
    try {
      const user = await getLoggedInUser();

      if (!user?.id) {
        return;
      }

      const item = findCartItem(productId, cartItemId);

      if (!item) {
        console.error('Update cart: item not found', productId, cartItemId);
        return;
      }

      const newQuantity = Number(item.quantity) + change;

      // same as web: going to 0 removes the item
      if (newQuantity <= 0) {
        await removeFromCart(productId, item.cartItemId);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/cart/${item.cartItemId}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            user_id: user.id,
            quantity: newQuantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to update cart');
      }

      await loadCart();
    } catch (error) {
      console.error('Update quantity error:', error);
    }
  };

  const increaseQuantity = (
    productId: string,
    cartItemId?: number
  ): Promise<void> => updateQuantity(productId, 1, cartItemId);

  const decreaseQuantity = (
    productId: string,
    cartItemId?: number
  ): Promise<void> => updateQuantity(productId, -1, cartItemId);

  // ===================================================
  // CLEAR CART FROM DATABASE
  // Use this after ORDER SUCCESS.
  // ===================================================

  const clearCart = async (): Promise<void> => {
    try {
      const user = await getLoggedInUser();

      if (!user?.id) {
        setCartItems([]);
        return;
      }

      const currentItems = [...cartItems];

      for (const item of currentItems) {
        try {
          await fetch(`${API_BASE_URL}/api/cart/${item.cartItemId}`, {
            method: 'DELETE',

            headers: {
              'Content-Type': 'application/json',
            },

            body: JSON.stringify({
              user_id: user.id,
            }),
          });
        } catch (itemError) {
          console.error('Delete cart item error:', itemError);
        }
      }

      setCartItems([]);
    } catch (error) {
      console.error('Clear cart error:', error);
    }
  };

  // ===================================================
  // CLEAR LOCAL CART ONLY
  // Use during LOGOUT. Does NOT delete database data.
  // ===================================================

  const clearLocalCart = (): void => {
    console.log('Clearing local cart only');
    setCartItems([]);
    setBuyNowItem(null);
  };

  // ===================================================
  // CART COUNT + TOTAL
  // ===================================================

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
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
        buyNowItem,
        setBuyNowItem,
        clearBuyNow,
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
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
}
