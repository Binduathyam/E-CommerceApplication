import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

const products = [
  {
    id: '1',
    name: 'Wireless Headphones',
    category: 'ELECTRONICS',
    price: 2499,
    description:
      'Enjoy clear sound and comfortable listening with these wireless headphones. Perfect for music, calls and everyday use.',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000',
  },
  {
    id: '2',
    name: 'Smart Watch',
    category: 'ELECTRONICS',
    price: 3299,
    description:
      'A stylish smart watch for everyday use with a modern design and comfortable strap.',
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000',
  },
  {
    id: '3',
    name: 'Running Shoes',
    category: 'FASHION',
    price: 2999,
    description:
      'Comfortable running shoes designed for daily workouts, walking and casual use.',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000',
  },
  {
    id: '4',
    name: 'Denim Jacket',
    category: 'FASHION',
    price: 1999,
    description:
      'Classic denim jacket with a comfortable fit that works well with casual outfits.',
    image:
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1000',
  },
];

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [quantity, setQuantity] = React.useState(1);

  const product = products.find(
    (item) => item.id === String(id)
  );

  if (!product) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>
          Product not found
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const productInWishlist = isWishlisted(product.id);

  const handleWishlist = () => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
    });
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
      });
    }

    alert('Product added to cart');
  };

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
      });
    }

    router.push('/checkout' as any);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Product Details
        </Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleWishlist}
        >
          <Text
            style={[
              styles.heart,
              productInWishlist && styles.heartActive,
            ]}
          >
            {productInWishlist ? '♥' : '♡'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* PRODUCT IMAGE */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.productImage}
        />
      </View>

      {/* PRODUCT INFORMATION */}
      <View style={styles.content}>
        <Text style={styles.category}>
          {product.category}
        </Text>

        <Text style={styles.productName}>
          {product.name}
        </Text>

        <Text style={styles.price}>
          ₹{product.price.toLocaleString('en-IN')}
        </Text>

        {/* RATING */}
        <View style={styles.ratingRow}>
          <Text style={styles.stars}>
            ★★★★★
          </Text>

          <Text style={styles.ratingText}>
            {' '}4.8 (120 reviews)
          </Text>
        </View>

        <View style={styles.divider} />

        {/* DESCRIPTION */}
        <Text style={styles.descriptionTitle}>
          Description
        </Text>

        <Text style={styles.description}>
          {product.description}
        </Text>

        {/* QUANTITY */}
        <Text style={styles.quantityTitle}>
          Quantity
        </Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() =>
              setQuantity((value) =>
                Math.max(1, value - 1)
              )
            }
          >
            <Text style={styles.quantityButtonText}>
              −
            </Text>
          </TouchableOpacity>

          <Text style={styles.quantity}>
            {quantity}
          </Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() =>
              setQuantity((value) => value + 1)
            }
          >
            <Text style={styles.quantityButtonText}>
              +
            </Text>
          </TouchableOpacity>
        </View>

        {/* SELECTED TOTAL */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Total
          </Text>

          <Text style={styles.totalPrice}>
            ₹{(product.price * quantity).toLocaleString('en-IN')}
          </Text>
        </View>

        {/* ADD TO CART */}
        <TouchableOpacity
          style={styles.addToCart}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>
            Add to Cart
          </Text>
        </TouchableOpacity>

        {/* BUY NOW */}
        <TouchableOpacity
          style={styles.buyNow}
          onPress={handleBuyNow}
        >
          <Text style={styles.buyNowText}>
            Buy Now
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 32,
    color: '#222',
    marginTop: -4,
  },

  heart: {
    fontSize: 25,
    color: '#555',
  },

  heartActive: {
    color: '#ef4444',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#181818',
  },

  imageContainer: {
    height: 360,
    backgroundColor: '#eeeeee',
  },

  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  content: {
    backgroundColor: '#ffffff',
    marginTop: -10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },

  category: {
    color: '#7c3aed',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
  },

  productName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#181818',
  },

  price: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111',
    marginTop: 10,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  stars: {
    color: '#f5a623',
    fontSize: 18,
  },

  ratingText: {
    color: '#777',
    fontSize: 13,
  },

  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 20,
  },

  descriptionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#181818',
  },

  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginTop: 8,
  },

  quantityTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 22,
    color: '#181818',
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },

  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eeeeee',
    justifyContent: 'center',
    alignItems: 'center',
  },

  quantityButtonText: {
    fontSize: 24,
    color: '#222',
  },

  quantity: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 20,
  },

  totalRow: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#555',
  },

  totalPrice: {
    fontSize: 21,
    fontWeight: '800',
    color: '#7c3aed',
  },

  addToCart: {
    marginTop: 25,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addToCartText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  buyNow: {
    marginTop: 10,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buyNowText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '800',
  },

  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  notFoundText: {
    fontSize: 18,
    marginBottom: 20,
  },

  backButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },

  backButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});