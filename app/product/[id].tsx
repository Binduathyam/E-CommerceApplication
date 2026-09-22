import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import React from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE_URL } from '../../config/api';

import { useCart } from '../../context/CartContext';

import {
  useWishlist,
} from '../../context/WishlistContext';

// =========================================
// PRODUCT TYPE
// =========================================

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;

  description?: string;

  size_fit?: string;

  material_care?: string;

  brand?: string;

  stock?: number;

  image: string;
};

// =========================================
// REVIEW TYPE
// =========================================

type Review = {
  id?: number | string;

  customer_name?: string;

  customerName?: string;

  name?: string;

  rating: number;

  feedback?: string;

  comment?: string;

  created_at?: string;

  createdAt?: string;

  verified?: boolean;
};

// =========================================
// PRODUCT DETAILS SCREEN
// =========================================

export default function ProductDetails() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams();

  // =======================================
  // CART
  // =======================================

  const {
    addToCart,
  } = useCart();

  // =======================================
  // PRODUCT
  // =======================================

  const [
    product,
    setProduct,
  ] = React.useState<Product | null>(
    null
  );

  // =======================================
  // LOADING
  // =======================================

  const [
    loading,
    setLoading,
  ] = React.useState(true);

  // =======================================
  // ADD TO CART LOADING
  // =======================================

  const [
    addingToCart,
    setAddingToCart,
  ] = React.useState(false);

  // =======================================
  // ERROR
  // =======================================

  const [
    error,
    setError,
  ] = React.useState('');

  // =======================================
  // QUANTITY
  // =======================================

  const [
    quantity,
    setQuantity,
  ] = React.useState(1);

  // =======================================
  // WISHLIST
  // =======================================

  const {
    toggleWishlist,
    isWishlisted,
  } = useWishlist();

  // =======================================
  // ADMIN RATING
  // =======================================

  const [
    adminRating,
    setAdminRating,
  ] = React.useState(4);

  // =======================================
  // CUSTOMER REVIEWS
  // =======================================

  const [
    reviews,
    setReviews,
  ] = React.useState<Review[]>(
    []
  );

  // =======================================
  // CUSTOMER AVERAGE RATING
  // =======================================

  const [
    averageRating,
    setAverageRating,
  ] = React.useState(0);

  // =======================================
  // TOTAL REVIEWS
  // =======================================

  const [
    totalReviews,
    setTotalReviews,
  ] = React.useState(0);

  // =======================================
  // REVIEWS LOADING
  // =======================================

  const [
    reviewsLoading,
    setReviewsLoading,
  ] = React.useState(false);

  // =======================================
  // FETCH PRODUCT
  // =======================================

  React.useEffect(() => {
    const fetchProduct =
      async () => {
        try {
          setLoading(true);
          setError('');

          const productId =
            String(id);

          console.log(
            '================================'
          );

          console.log(
            'FETCH PRODUCT'
          );

          console.log(
            'Product ID:',
            productId
          );

          console.log(
            'API:',
            `${API_BASE_URL}/api/products/${productId}`
          );

          const response =
            await fetch(
              `${API_BASE_URL}/api/products/${productId}`
            );

          const data =
            await response.json();

          console.log(
            'Product API response:',
            data
          );

          if (!response.ok) {
            throw new Error(
              data.message ||
                'Failed to fetch product'
            );
          }

          if (!data.product) {
            throw new Error(
              'Product not found'
            );
          }

          const backendProduct =
            data.product;

          const formattedProduct:
            Product = {
            id: String(
              backendProduct.id
            ),

            name: String(
              backendProduct.name ||
                ''
            ),

            category: String(
              backendProduct.category ||
                ''
            ),

            price: Number(
              backendProduct.price ||
                0
            ),

            image: String(
              backendProduct.image ||
                ''
            ),

            description:
              backendProduct.description ||
              'No product description available.',

            size_fit:
              backendProduct.size_fit ||
              'Size and fit information is not available.',

            material_care:
              backendProduct.material_care ||
              'Material and care information is not available.',

            brand:
              backendProduct.brand ||
              '',

            stock: Number(
              backendProduct.stock ||
                0
            ),
          };

          setProduct(
            formattedProduct
          );

        } catch (err) {
          console.error(
            'Product fetch error:',
            err
          );

          setError(
            'Unable to load product details.'
          );

        } finally {
          setLoading(false);
        }
      };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // =======================================
  // FETCH ADMIN RATING + CUSTOMER REVIEWS
  // =======================================

  React.useEffect(() => {
    const fetchReviews =
      async () => {
        if (!id) {
          return;
        }

        try {
          setReviewsLoading(true);

          const productId =
            String(id);

          console.log(
            '================================'
          );

          console.log(
            'FETCH PRODUCT REVIEWS'
          );

          console.log(
            'Product ID:',
            productId
          );

          console.log(
            'Reviews API:',
            `${API_BASE_URL}/api/reviews/product/${productId}`
          );

          const response =
            await fetch(
              `${API_BASE_URL}/api/reviews/product/${productId}`
            );

          const data =
            await response.json();

          console.log(
            'Reviews API response:',
            data
          );

          if (!response.ok) {
            throw new Error(
              data.message ||
                'Failed to fetch reviews'
            );
          }

          // =================================
          // ADMIN RATING
          // =================================

          const receivedAdminRating =
            Number(
              data.adminRating ??
                data.admin_rating ??
                0
            );

          if (
            receivedAdminRating > 0
          ) {
            setAdminRating(
              receivedAdminRating
            );
          } else {
            // Default rating = 4
            setAdminRating(4);
          }

          // =================================
          // CUSTOMER REVIEWS
          // =================================

          const receivedReviews =
            Array.isArray(
              data.reviews
            )
              ? data.reviews
              : [];

          setReviews(
            receivedReviews
          );

          // =================================
          // CUSTOMER AVERAGE
          // =================================

          const receivedAverage =
            Number(
              data.averageRating ??
                data.average_rating ??
                0
            );

          setAverageRating(
            receivedAverage
          );

          // =================================
          // TOTAL REVIEWS
          // =================================

          const receivedTotal =
            Number(
              data.totalReviews ??
                data.total_reviews ??
                receivedReviews.length
            );

          setTotalReviews(
            receivedTotal
          );

        } catch (err) {
          console.error(
            'Reviews fetch error:',
            err
          );

          // =================================
          // IMPORTANT
          // If API fails, keep default
          // admin rating as 4
          // =================================

          setAdminRating(4);

          setReviews([]);

          setAverageRating(0);

          setTotalReviews(0);

        } finally {
          setReviewsLoading(false);
        }
      };

    fetchReviews();
  }, [id]);

  // =======================================
  // LOADING SCREEN
  // =======================================

  if (loading) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <Text
          style={
            styles.loadingIcon
          }
        >
          🛍️
        </Text>

        <Text
          style={
            styles.loadingText
          }
        >
          Loading product...
        </Text>
      </View>
    );
  }

  // =======================================
  // ERROR SCREEN
  // =======================================

  if (
    error ||
    !product
  ) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <Text
          style={
            styles.errorIcon
          }
        >
          ⚠️
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          {error ||
            'Product not found'}
        </Text>

        <TouchableOpacity
          style={
            styles.backButtonLarge
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backButtonLargeText
            }
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =======================================
  // WISHLIST STATUS
  // =======================================

  const productInWishlist =
    isWishlisted(
      product.id
    );

  // =======================================
  // WISHLIST
  // =======================================

  const handleWishlist =
    () => {
      toggleWishlist({
        id:
          product.id,

        name:
          product.name,

        category:
          product.category,

        price:
          product.price,

        image:
          product.image,
      });
    };

  // =======================================
  // ADD TO CART
  // =======================================

  const handleAddToCart =
    async () => {
      try {
        setAddingToCart(true);

        console.log(
          '================================'
        );

        console.log(
          'PRODUCT DETAILS ADD TO CART'
        );

        console.log(
          'Product ID:',
          product.id
        );

        console.log(
          'Quantity:',
          quantity
        );

        for (
          let i = 0;
          i < quantity;
          i++
        ) {
          await Promise.resolve(
            addToCart({
              id:
                String(
                  product.id
                ),

              name:
                product.name,

              category:
                product.category,

              price:
                Number(
                  product.price
                ),

              image:
                product.image,
            })
          );
        }

        console.log(
          'PRODUCT ADDED TO CART SUCCESSFULLY'
        );

        Alert.alert(
          'Success',
          'Product added to cart successfully!',
          [
            {
              text: 'Go to Cart',
              onPress: () => {
                router.push(
                  '/cart' as any
                );
              },
            },

            {
              text: 'Continue Shopping',
              style: 'cancel',
            },
          ]
        );

      } catch (error) {
        console.error(
          'Product Details Add to Cart Error:',
          error
        );

        Alert.alert(
          'Add to Cart Failed',
          'Unable to add product to cart.'
        );

      } finally {
        setAddingToCart(
          false
        );
      }
    };

  // =======================================
  // BUY NOW
  // =======================================

  const handleBuyNow =
    async () => {
      try {
        setAddingToCart(true);

        for (
          let i = 0;
          i < quantity;
          i++
        ) {
          await Promise.resolve(
            addToCart({
              id:
                String(
                  product.id
                ),

              name:
                product.name,

              category:
                product.category,

              price:
                Number(
                  product.price
                ),

              image:
                product.image,
            })
          );
        }

        router.push(
          '/checkout' as any
        );

      } catch (error) {
        console.error(
          'Buy Now Error:',
          error
        );

        Alert.alert(
          'Error',
          'Unable to continue to checkout.'
        );

      } finally {
        setAddingToCart(
          false
        );
      }
    };

  // =======================================
  // STOCK STATUS
  // =======================================

  const isInStock =
    Number(product.stock || 0) > 0;

  // =======================================
  // ADMIN STARS
  // =======================================

  const renderStars =
    (
      rating: number
    ) => {
      const roundedRating =
        Math.round(
          Number(rating)
        );

      return (
        <Text
          style={
            styles.stars
          }
        >
          {Array.from(
            {
              length: 5,
            },
            (_, index) =>
              index <
              roundedRating
                ? '★'
                : '☆'
          ).join('')}
        </Text>
      );
    };

  // =======================================
  // CUSTOMER STARS
  // =======================================

  const renderCustomerStars =
    (
      rating: number
    ) => {
      const roundedRating =
        Math.round(
          Number(rating)
        );

      return (
        <Text
          style={
            styles.customerReviewStars
          }
        >
          {Array.from(
            {
              length: 5,
            },
            (_, index) =>
              index <
              roundedRating
                ? '★'
                : '☆'
          ).join('')}
        </Text>
      );
    };

  // =======================================
  // FORMAT REVIEW DATE
  // =======================================

  const formatReviewDate =
    (
      date?: string
    ) => {
      if (!date) {
        return '';
      }

      try {
        return new Date(
          date
        ).toLocaleDateString(
          'en-IN'
        );
      } catch {
        return '';
      }
    };

  // =======================================
  // MAIN UI
  // =======================================

  return (
    <View
      style={
        styles.screenContainer
      }
    >

      <ScrollView
        style={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* =================================
            HEADER
        ================================== */}

        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            style={
              styles.headerButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.backIcon
              }
            >
              ‹
            </Text>
          </TouchableOpacity>

          <Text
            style={
              styles.headerTitle
            }
          >
            Product Details
          </Text>

          <TouchableOpacity
            style={
              styles.headerButton
            }
            onPress={
              handleWishlist
            }
          >
            <Text
              style={[
                styles.heart,
                productInWishlist &&
                  styles.heartActive,
              ]}
            >
              {productInWishlist
                ? '♥'
                : '♡'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* =================================
            PRODUCT IMAGE
        ================================== */}

        <View
          style={
            styles.imageContainer
          }
        >
          <Image
            source={{
              uri:
                product.image,
            }}
            style={
              styles.productImage
            }
          />
        </View>

        {/* =================================
            MAIN PRODUCT INFORMATION
        ================================== */}

        <View
          style={
            styles.content
          }
        >

          {/* CATEGORY */}

          <Text
            style={
              styles.category
            }
          >
            {product.category}
          </Text>

          {/* PRODUCT NAME */}

          <Text
            style={
              styles.productName
            }
          >
            {product.name}
          </Text>

          {/* =================================
              ADMIN RATING
          ================================== */}

          <View
            style={
              styles.ratingRow
            }
          >

            {renderStars(
              adminRating
            )}

            <Text
              style={
                styles.ratingNumber
              }
            >
              {Number(
                adminRating
              ).toFixed(1)}
            </Text>

            <Text
              style={
                styles.ratingDivider
              }
            >
              |
            </Text>

            <Text
              style={
                styles.ratingCount
              }
            >
            Rating
            </Text>

          </View>

          {/* =================================
              CUSTOMER RATING
          ================================== */}

          <View
            style={
              styles.customerRatingRow
            }
          >

            {totalReviews >
            0 &&
              renderCustomerStars(
                averageRating
              )}

            <Text
              style={
                styles.customerRatingLabel
              }
            >
              Customer Rating
            </Text>

            {totalReviews >
            0 && (
              <>
                <Text
                  style={
                    styles.customerAverage
                  }
                >
                  {Number(
                    averageRating
                  ).toFixed(1)}
                </Text>

                <Text
                  style={
                    styles.customerReviewCount
                  }
                >
                  (
                  {totalReviews}{' '}
                  {totalReviews ===
                  1
                    ? 'Review'
                    : 'Reviews'}
                  )
                </Text>
              </>
            )}

            {totalReviews ===
              0 && (
              <Text
                style={
                  styles.noCustomerRating
                }
              >
                No reviews yet
              </Text>
            )}

          </View>

          {/* PRICE */}

          <View
            style={
              styles.priceSection
            }
          >
            <Text
              style={
                styles.price
              }
            >
              ₹
              {product.price.toLocaleString(
                'en-IN'
              )}
            </Text>

            <Text
              style={
                styles.taxText
              }
            >
              inclusive of all taxes
            </Text>
          </View>

          {/* PRODUCT DETAILS */}

          <View
            style={
              styles.productDetailsSection
            }
          >
            <Text
              style={
                styles.sectionHeading
              }
            >
              Product Details
            </Text>

            <Text
              style={
                styles.description
              }
            >
              {product.description ||
                'No product description available.'}
            </Text>
          </View>

          {/* SELECT SIZE */}

          <View
            style={
              styles.sizeSection
            }
          >
            <Text
              style={
                styles.sizeTitle
              }
            >
              SELECT SIZE
            </Text>

            <TouchableOpacity
              style={
                styles.sizeOption
              }
              activeOpacity={0.8}
            >
              <Text
                style={
                  styles.sizeOptionText
                }
              >
                Onesize
              </Text>
            </TouchableOpacity>
          </View>

          {/* STOCK */}

          <View
            style={
              styles.stockSection
            }
          >
            <Text
              style={[
                styles.stockText,
                isInStock
                  ? styles.inStock
                  : styles.outOfStock,
              ]}
            >
              {isInStock
                ? '✓ In Stock'
                : '✕ Out of Stock'}
            </Text>
          </View>

          {/* QUANTITY */}

          <View
            style={
              styles.quantitySection
            }
          >
            <Text
              style={
                styles.quantityTitle
              }
            >
              Quantity
            </Text>

            <View
              style={
                styles.quantityContainer
              }
            >
              <TouchableOpacity
                style={
                  styles.quantityButton
                }
                onPress={() =>
                  setQuantity(
                    (value) =>
                      Math.max(
                        1,
                        value - 1
                      )
                  )
                }
                disabled={
                  addingToCart
                }
              >
                <Text
                  style={
                    styles.quantityButtonText
                  }
                >
                  −
                </Text>
              </TouchableOpacity>

              <Text
                style={
                  styles.quantity
                }
              >
                {quantity}
              </Text>

              <TouchableOpacity
                style={
                  styles.quantityButton
                }
                onPress={() =>
                  setQuantity(
                    (value) =>
                      value + 1
                  )
                }
                disabled={
                  addingToCart
                }
              >
                <Text
                  style={
                    styles.quantityButtonText
                  }
                >
                  +
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* TOTAL */}

          <View
            style={
              styles.totalRow
            }
          >
            <Text
              style={
                styles.totalLabel
              }
            >
              Total
            </Text>

            <Text
              style={
                styles.totalPrice
              }
            >
              ₹
              {(
                product.price *
                quantity
              ).toLocaleString(
                'en-IN'
              )}
            </Text>
          </View>

          {/* ACTION BUTTONS */}

          <View
            style={
              styles.actions
            }
          >

            {/* ADD TO BAG */}

            <TouchableOpacity
              style={[
                styles.addToCart,
                addingToCart &&
                  styles.disabledButton,
                !isInStock &&
                  styles.disabledButton,
              ]}
              onPress={
                handleAddToCart
              }
              disabled={
                addingToCart ||
                !isInStock
              }
            >
              <Text
                style={
                  styles.addToCartText
                }
              >
                {addingToCart
                  ? 'Adding...'
                  : '🛒 ADD TO BAG'}
              </Text>
            </TouchableOpacity>

            {/* WISHLIST */}

            <TouchableOpacity
              style={
                styles.wishlistButton
              }
              onPress={
                handleWishlist
              }
            >
              <Text
                style={
                  styles.wishlistButtonText
                }
              >
                {productInWishlist
                  ? '♥'
                  : '♡'}{' '}
                WISHLIST
              </Text>
            </TouchableOpacity>
          </View>

          {/* ASSURANCE */}

          <View
            style={
              styles.assurance
            }
          >
            <Text
              style={
                styles.assuranceCheck
              }
            >
              ✓
            </Text>

            <Text
              style={
                styles.assuranceText
              }
            >
              100% Original Products
            </Text>
          </View>

        </View>

        {/* =================================
            FULL PRODUCT INFORMATION
        ================================== */}

        <View
          style={
            styles.productInformation
          }
        >

          {/* PRODUCT DESCRIPTION */}

          <View
            style={
              styles.informationSection
            }
          >
            <Text
              style={
                styles.informationTitle
              }
            >
              Product Description
            </Text>

            <Text
              style={
                styles.informationText
              }
            >
              {product.description ||
                'No product description available.'}
            </Text>
          </View>

          {/* SIZE & FIT */}

          <View
            style={
              styles.informationSection
            }
          >
            <Text
              style={
                styles.informationTitle
              }
            >
              Size & Fit
            </Text>

            <Text
              style={
                styles.informationText
              }
            >
              {product.size_fit ||
                'Size and fit information is not available.'}
            </Text>
          </View>

          {/* MATERIAL & CARE */}

          <View
            style={
              styles.informationSection
            }
          >
            <Text
              style={
                styles.informationTitle
              }
            >
              Material & Care
            </Text>

            <Text
              style={
                styles.informationText
              }
            >
              {product.material_care ||
                'Material and care information is not available.'}
            </Text>
          </View>

          {/* SPECIFICATIONS */}

          <View
            style={
              styles.informationSection
            }
          >
            <Text
              style={
                styles.informationTitle
              }
            >
              Specifications
            </Text>

            <View
              style={
                styles.specificationsCard
              }
            >

              {/* CATEGORY */}

              <View
                style={
                  styles.specificationRow
                }
              >
                <Text
                  style={
                    styles.specificationLabel
                  }
                >
                  Category
                </Text>

                <Text
                  style={
                    styles.specificationValue
                  }
                >
                  {product.category ||
                    '—'}
                </Text>
              </View>

              {/* PRODUCT TYPE */}

              <View
                style={
                  styles.specificationRow
                }
              >
                <Text
                  style={
                    styles.specificationLabel
                  }
                >
                  Product Type
                </Text>

                <Text
                  style={
                    styles.specificationValue
                  }
                >
                  {product.category ||
                    '—'}
                </Text>
              </View>

              {/* BRAND */}

              <View
                style={
                  styles.specificationRow
                }
              >
                <Text
                  style={
                    styles.specificationLabel
                  }
                >
                  Brand
                </Text>

                <Text
                  style={
                    styles.specificationValue
                  }
                >
                  {product.brand ||
                    '—'}
                </Text>
              </View>

              {/* AVAILABILITY */}

              <View
                style={[
                  styles.specificationRow,
                  styles.lastSpecificationRow,
                ]}
              >
                <Text
                  style={
                    styles.specificationLabel
                  }
                >
                  Availability
                </Text>

                <Text
                  style={[
                    styles.specificationValue,
                    isInStock
                      ? styles.availableValue
                      : styles.unavailableValue,
                  ]}
                >
                  {isInStock
                    ? 'In Stock'
                    : 'Out of Stock'}
                </Text>
              </View>

            </View>
          </View>

        </View>

        {/* =================================
            CUSTOMER REVIEWS
        ================================== */}

        <View
          style={
            styles.reviewsSection
          }
        >

          {/* REVIEWS TITLE */}

          <View
            style={
              styles.reviewsHeader
            }
          >
            <Text
              style={
                styles.reviewsTitle
              }
            >
              Customer Reviews
            </Text>

            {totalReviews >
              0 && (
              <Text
                style={
                  styles.reviewsSummary
                }
              >
                {Number(
                  averageRating
                ).toFixed(1)}{' '}
                out of 5 ·{' '}
                {totalReviews}{' '}
                {totalReviews ===
                1
                  ? 'Review'
                  : 'Reviews'}
              </Text>
            )}
          </View>

          {/* LOADING */}

          {reviewsLoading && (
            <View
              style={
                styles.reviewsLoading
              }
            >
              <ActivityIndicator
                size="small"
                color="#7c3aed"
              />

              <Text
                style={
                  styles.reviewsLoadingText
                }
              >
                Loading reviews...
              </Text>
            </View>
          )}

          {/* NO REVIEWS */}

          {!reviewsLoading &&
            reviews.length ===
              0 && (
              <View
                style={
                  styles.noReviewsCard
                }
              >
                <Text
                  style={
                    styles.noReviewsIcon
                  }
                >
                  💬
                </Text>

                <Text
                  style={
                    styles.noReviewsTitle
                  }
                >
                  No customer reviews yet
                </Text>

                <Text
                  style={
                    styles.noReviewsText
                  }
                >
                  Be the first customer to
                  review this product.
                </Text>
              </View>
            )}

          {/* REVIEWS LIST */}

          {!reviewsLoading &&
            reviews.length > 0 &&
            reviews.map(
              (
                review,
                index
              ) => {

                const customerName =
                  review.customer_name ||
                  review.customerName ||
                  review.name ||
                  'Customer';

                const reviewText =
                  review.feedback ||
                  review.comment ||
                  '';

                const reviewDate =
                  review.created_at ||
                  review.createdAt;

                return (
                  <View
                    key={
                      review.id ??
                      index
                    }
                    style={
                      styles.reviewCard
                    }
                  >

                    {/* CUSTOMER NAME */}

                    <View
                      style={
                        styles.reviewTopRow
                      }
                    >
                      <View
                        style={
                          styles.customerInfo
                        }
                      >
                        <Text
                          style={
                            styles.customerName
                          }
                        >
                          {customerName}
                        </Text>

                        <View
                          style={
                            styles.verifiedRow
                          }
                        >
                          <Text
                            style={
                              styles.verifiedIcon
                            }
                          >
                            ✓
                          </Text>

                          <Text
                            style={
                              styles.verifiedText
                            }
                          >
                            Verified Purchase
                          </Text>
                        </View>
                      </View>

                      {/* DATE */}

                      {reviewDate && (
                        <Text
                          style={
                            styles.reviewDate
                          }
                        >
                          {formatReviewDate(
                            reviewDate
                          )}
                        </Text>
                      )}
                    </View>

                    {/* STARS */}

                    <View
                      style={
                        styles.reviewRatingRow
                      }
                    >
                      {renderCustomerStars(
                        Number(
                          review.rating
                        )
                      )}

                      <Text
                        style={
                          styles.reviewRatingNumber
                        }
                      >
                        {Number(
                          review.rating
                        ).toFixed(1)}
                      </Text>
                    </View>

                    {/* FEEDBACK */}

                    {reviewText !==
                      '' && (
                      <Text
                        style={
                          styles.reviewFeedback
                        }
                      >
                        {reviewText}
                      </Text>
                    )}

                  </View>
                );
              }
            )}

        </View>

        {/* =================================
            BOTTOM SPACE
        ================================== */}

        <View
          style={{
            height: 110,
          }}
        />

      </ScrollView>

      {/* =================================
          BUY NOW BAR
      ================================== */}

      <View
        style={
          styles.bottomContainer
        }
      >
        <View
          style={
            styles.bottomTotal
          }
        >
          <Text
            style={
              styles.bottomTotalLabel
            }
          >
            Total
          </Text>

          <Text
            style={
              styles.bottomTotalPrice
            }
          >
            ₹
            {(
              product.price *
              quantity
            ).toLocaleString(
              'en-IN'
            )}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.buyNowButton,
            addingToCart ||
              !isInStock
              ? styles.disabledButton
              : null,
          ]}
          onPress={
            handleBuyNow
          }
          disabled={
            addingToCart ||
            !isInStock
          }
        >
          <Text
            style={
              styles.buyNowText
            }
          >
            BUY NOW
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// =========================================
// STYLES
// =========================================

const styles =
  StyleSheet.create({

    // =====================================
    // MAIN
    // =====================================

    screenContainer: {
      flex: 1,
      backgroundColor:
        '#f8f8f8',
    },

    container: {
      flex: 1,
      backgroundColor:
        '#f8f8f8',
    },

    // =====================================
    // CENTER
    // =====================================

    centerContainer: {
      flex: 1,
      backgroundColor:
        '#f8f8f8',
      justifyContent:
        'center',
      alignItems:
        'center',
      paddingHorizontal:
        30,
    },

    // =====================================
    // LOADING
    // =====================================

    loadingIcon: {
      fontSize: 45,
      marginBottom: 12,
    },

    loadingText: {
      fontSize: 15,
      color: '#777',
      fontWeight: '600',
    },

    // =====================================
    // ERROR
    // =====================================

    errorIcon: {
      fontSize: 42,
      marginBottom: 12,
    },

    errorText: {
      fontSize: 15,
      color: '#666',
      textAlign: 'center',
      marginBottom: 20,
    },

    // =====================================
    // HEADER
    // =====================================

    header: {
      paddingTop: 50,
      paddingHorizontal: 16,
      paddingBottom: 14,
      backgroundColor:
        '#ffffff',
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    headerButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        '#f4f4f4',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    backIcon: {
      fontSize: 32,
      color: '#222',
      marginTop: -4,
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#181818',
    },

    heart: {
      fontSize: 25,
      color: '#555',
    },

    heartActive: {
      color: '#ef4444',
    },

    // =====================================
    // IMAGE
    // =====================================

    imageContainer: {
      height: 350,
      backgroundColor:
        '#eeeeee',
    },

    productImage: {
      width: '100%',
      height: '100%',
      resizeMode:
        'cover',
    },

    // =====================================
    // MAIN CONTENT
    // =====================================

    content: {
      backgroundColor:
        '#ffffff',

      marginTop: -10,

      borderTopLeftRadius:
        20,

      borderTopRightRadius:
        20,

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
      lineHeight: 32,
    },

    // =====================================
    // ADMIN RATING
    // =====================================

    ratingRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 11,
    },

    stars: {
      color: '#f5a623',
      fontSize: 17,
      letterSpacing: 1,
    },

    ratingNumber: {
      color: '#333',
      fontSize: 13,
      fontWeight: '700',
      marginLeft: 7,
    },

    ratingDivider: {
      color: '#aaa',
      fontSize: 13,
      marginHorizontal: 7,
    },

    ratingCount: {
      color: '#777',
      fontSize: 12,
    },

    // =====================================
    // CUSTOMER RATING
    // =====================================

    customerRatingRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      flexWrap:
        'wrap',
      marginTop: 8,
    },

    customerReviewStars: {
      color: '#f5a623',
      fontSize: 15,
      letterSpacing: 1,
    },

    customerRatingLabel: {
      color: '#555',
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 7,
    },

    customerAverage: {
      color: '#333',
      fontSize: 12,
      fontWeight: '800',
      marginLeft: 7,
    },

    customerReviewCount: {
      color: '#777',
      fontSize: 12,
      marginLeft: 4,
    },

    noCustomerRating: {
      color: '#999',
      fontSize: 12,
      marginLeft: 7,
    },

    // =====================================
    // PRICE
    // =====================================

    priceSection: {
      marginTop: 13,
    },

    price: {
      fontSize: 24,
      fontWeight: '800',
      color: '#111',
    },

    taxText: {
      fontSize: 11,
      color: '#777',
      marginTop: 3,
    },

    // =====================================
    // PRODUCT DETAILS
    // =====================================

    productDetailsSection: {
      marginTop: 22,
    },

    sectionHeading: {
      fontSize: 18,
      fontWeight: '800',
      color: '#181818',
      marginBottom: 8,
    },

    description: {
      fontSize: 14,
      lineHeight: 22,
      color: '#666',
    },

    // =====================================
    // SIZE
    // =====================================

    sizeSection: {
      marginTop: 22,
    },

    sizeTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: '#333',
      letterSpacing: 0.5,
      marginBottom: 10,
    },

    sizeOption: {
      alignSelf:
        'flex-start',
      minWidth: 80,
      height: 40,
      paddingHorizontal: 18,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor:
        '#7c3aed',
      backgroundColor:
        '#faf7ff',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    sizeOptionText: {
      color: '#7c3aed',
      fontSize: 13,
      fontWeight: '800',
    },

    // =====================================
    // STOCK
    // =====================================

    stockSection: {
      marginTop: 12,
    },

    stockText: {
      fontSize: 13,
      fontWeight: '800',
    },

    inStock: {
      color: '#16a34a',
    },

    outOfStock: {
      color: '#dc2626',
    },

    // =====================================
    // QUANTITY
    // =====================================

    quantitySection: {
      marginTop: 22,
    },

    quantityTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: '#181818',
    },

    quantityContainer: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 11,
    },

    quantityButton: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor:
        '#eeeeee',
      justifyContent:
        'center',
      alignItems:
        'center',
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

    // =====================================
    // TOTAL
    // =====================================

    totalRow: {
      marginTop: 20,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor:
        '#eeeeee',
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
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

    // =====================================
    // ACTIONS
    // =====================================

    actions: {
      marginTop: 20,
    },

    addToCart: {
      height: 52,
      borderRadius: 12,
      backgroundColor:
        '#7c3aed',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    addToCartText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '800',
    },

    wishlistButton: {
      height: 50,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        '#ddd6fe',
      backgroundColor:
        '#ffffff',
      justifyContent:
        'center',
      alignItems:
        'center',
      marginTop: 9,
    },

    wishlistButtonText: {
      color: '#7c3aed',
      fontSize: 14,
      fontWeight: '800',
    },

    disabledButton: {
      opacity: 0.55,
    },

    // =====================================
    // ASSURANCE
    // =====================================

    assurance: {
      marginTop: 18,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor:
        '#eeeeee',
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    assuranceCheck: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor:
        '#dcfce7',
      color: '#16a34a',
      textAlign:
        'center',
      lineHeight: 22,
      fontSize: 12,
      fontWeight: '900',
    },

    assuranceText: {
      color: '#333',
      fontSize: 13,
      fontWeight: '700',
      marginLeft: 8,
    },

    // =====================================
    // FULL INFORMATION
    // =====================================

    productInformation: {
      backgroundColor:
        '#ffffff',
      marginTop: 10,
      padding: 20,
    },

    informationSection: {
      paddingVertical: 17,
      borderBottomWidth: 1,
      borderBottomColor:
        '#eeeeee',
    },

    informationTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#181818',
      marginBottom: 9,
    },

    informationText: {
      fontSize: 14,
      lineHeight: 22,
      color: '#666',
    },

    // =====================================
    // SPECIFICATIONS
    // =====================================

    specificationsCard: {
      borderWidth: 1,
      borderColor:
        '#eeeeee',
      borderRadius: 12,
      overflow: 'hidden',
    },

    specificationRow: {
      minHeight: 50,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        '#eeeeee',
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    lastSpecificationRow: {
      borderBottomWidth: 0,
    },

    specificationLabel: {
      flex: 1,
      color: '#777',
      fontSize: 13,
    },

    specificationValue: {
      flex: 1,
      color: '#222',
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'right',
    },

    availableValue: {
      color: '#16a34a',
    },

    unavailableValue: {
      color: '#dc2626',
    },

    // =====================================
    // CUSTOMER REVIEWS
    // =====================================

    reviewsSection: {
      backgroundColor:
        '#ffffff',
      marginTop: 10,
      padding: 20,
    },

    reviewsHeader: {
      marginBottom: 15,
    },

    reviewsTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: '#181818',
    },

    reviewsSummary: {
      fontSize: 12,
      color: '#777',
      marginTop: 5,
    },

    reviewsLoading: {
      minHeight: 80,
      justifyContent:
        'center',
      alignItems:
        'center',
      flexDirection:
        'row',
    },

    reviewsLoadingText: {
      color: '#777',
      fontSize: 13,
      marginLeft: 8,
    },

    // =====================================
    // NO REVIEWS
    // =====================================

    noReviewsCard: {
      borderWidth: 1,
      borderColor:
        '#eeeeee',
      borderRadius: 14,
      paddingVertical: 25,
      paddingHorizontal: 15,
      alignItems:
        'center',
      backgroundColor:
        '#fafafa',
    },

    noReviewsIcon: {
      fontSize: 32,
      marginBottom: 8,
    },

    noReviewsTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: '#333',
    },

    noReviewsText: {
      fontSize: 12,
      color: '#888',
      textAlign: 'center',
      marginTop: 5,
    },

    // =====================================
    // REVIEW CARD
    // =====================================

    reviewCard: {
      borderWidth: 1,
      borderColor:
        '#eeeeee',
      borderRadius: 14,
      padding: 15,
      marginBottom: 12,
      backgroundColor:
        '#ffffff',
    },

    reviewTopRow: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
    },

    customerInfo: {
      flex: 1,
    },

    customerName: {
      fontSize: 15,
      fontWeight: '800',
      color: '#222',
    },

    verifiedRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 4,
    },

    verifiedIcon: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor:
        '#dcfce7',
      color: '#16a34a',
      textAlign:
        'center',
      lineHeight: 16,
      fontSize: 9,
      fontWeight: '900',
    },

    verifiedText: {
      fontSize: 10,
      color: '#16a34a',
      fontWeight: '700',
      marginLeft: 5,
    },

    reviewDate: {
      fontSize: 10,
      color: '#999',
      marginLeft: 8,
    },

    reviewRatingRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      marginTop: 10,
    },

    reviewRatingNumber: {
      fontSize: 11,
      fontWeight: '700',
      color: '#555',
      marginLeft: 6,
    },

    reviewFeedback: {
      fontSize: 13,
      lineHeight: 20,
      color: '#555',
      marginTop: 10,
    },

    // =====================================
    // BUY NOW
    // =====================================

    bottomContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor:
        '#ffffff',
      borderTopWidth: 1,
      borderTopColor:
        '#eeeeee',
      paddingHorizontal: 15,
      paddingVertical: 10,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 10,
      elevation: 10,
    },

    bottomTotal: {
      width: 105,
    },

    bottomTotalLabel: {
      fontSize: 10,
      color: '#777',
    },

    bottomTotalPrice: {
      fontSize: 17,
      fontWeight: '800',
      color: '#181818',
      marginTop: 2,
    },

    buyNowButton: {
      flex: 1,
      height: 48,
      borderRadius: 11,
      backgroundColor:
        '#7c3aed',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    buyNowText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '800',
    },

    // =====================================
    // ERROR BACK
    // =====================================

    backButtonLarge: {
      backgroundColor:
        '#7c3aed',
      paddingHorizontal: 25,
      paddingVertical: 12,
      borderRadius: 10,
    },

    backButtonLargeText: {
      color: '#ffffff',
      fontWeight: '700',
    },

  });