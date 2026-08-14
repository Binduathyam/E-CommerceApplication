import React, {
    createContext,
    ReactNode,
    useContext,
    useState,
} from 'react';

export type WishlistProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
};

type WishlistContextType = {
  wishlist: WishlistProduct[];
  toggleWishlist: (product: WishlistProduct) => void;
  isWishlisted: (id: string) => boolean;
  removeFromWishlist: (id: string) => void;
};

const WishlistContext = createContext<
  WishlistContextType | undefined
>(undefined);

export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);

  const toggleWishlist = (product: WishlistProduct) => {
    setWishlist((current) => {
      const exists = current.some(
        (item) => item.id === product.id
      );

      if (exists) {
        return current.filter(
          (item) => item.id !== product.id
        );
      }

      return [...current, product];
    });
  };

  const isWishlisted = (id: string) => {
    return wishlist.some((item) => item.id === id);
  };

  const removeFromWishlist = (id: string) => {
    setWishlist((current) =>
      current.filter((item) => item.id !== id)
    );
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isWishlisted,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      'useWishlist must be used inside WishlistProvider'
    );
  }

  return context;
}