import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

import { API_BASE_URL } from '../config/api';

export type Order = {
  id: string;
  date: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  total: number;
  status: string;
};

type OrderContextType = {
  orders: Order[];
  addOrder: (order: Order) => void;
  fetchOrders: () => Promise<void>;
  cancelOrder: (
    orderId: string
  ) => Promise<boolean>;
};

const OrderContext = createContext<
  OrderContextType | undefined
>(undefined);

export function OrderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [orders, setOrders] =
    useState<Order[]>([]);

  // =====================================================
  // ADD ORDER LOCALLY
  // =====================================================

  const addOrder = useCallback(
    (order: Order) => {
      setOrders((currentOrders) => [
        order,
        ...currentOrders,
      ]);
    },
    []
  );

  // =====================================================
  // FETCH ORDERS FROM MYSQL BACKEND
  // =====================================================

  const fetchOrders = useCallback(
    async () => {
      try {
        console.log(
          'Fetching orders...'
        );

        // ---------------------------------------------
        // GET LOGGED-IN USER
        // ---------------------------------------------

        const storedUser =
          await AsyncStorage.getItem(
            'loggedInUser'
          );

        console.log(
          'Stored user:',
          storedUser
        );

        if (!storedUser) {
          console.log(
            'No logged-in user found'
          );

          setOrders([]);
          return;
        }

        const user =
          JSON.parse(storedUser);

        const userId = Number(
          user?.id
        );

        console.log(
          'User ID:',
          userId
        );

        if (!userId) {
          console.log(
            'Invalid user ID'
          );

          setOrders([]);
          return;
        }

        // ---------------------------------------------
        // GET USER ORDERS
        // ---------------------------------------------

        const ordersUrl =
          `${API_BASE_URL}/api/orders/${userId}`;

        console.log(
          'Orders API:',
          ordersUrl
        );

        const response =
          await fetch(
            ordersUrl
          );

        const data =
          await response.json();

        console.log(
          'Orders API response:',
          data
        );

        if (!response.ok) {
          console.error(
            'Orders API failed:',
            data?.message
          );

          setOrders([]);
          return;
        }

        if (
          !data?.success ||
          !Array.isArray(data.orders)
        ) {
          console.log(
            'No orders returned'
          );

          setOrders([]);
          return;
        }

        // ---------------------------------------------
        // CONVERT ORDERS
        // ---------------------------------------------

        const backendOrders: Order[] =
          data.orders.map(
            (order: any) => ({
              id: String(
                order.id
              ),

              date:
                order.created_at
                  ? new Date(
                      order.created_at
                    ).toLocaleDateString(
                      'en-IN'
                    )
                  : '',

              items: [],

              total: Number(
                order.total_amount || 0
              ),

              status:
                String(
                  order.order_status ||
                    'Placed'
                ),
            })
          );

        // ---------------------------------------------
        // GET ITEMS FOR EACH ORDER
        // ---------------------------------------------

        const ordersWithItems =
          await Promise.all(
            backendOrders.map(
              async (order) => {
                try {
                  const itemsUrl =
                    `${API_BASE_URL}/api/orders/${order.id}/items`;

                  console.log(
                    'Items API:',
                    itemsUrl
                  );

                  const itemResponse =
                    await fetch(
                      itemsUrl
                    );

                  const itemData =
                    await itemResponse.json();

                  console.log(
                    `Items response for order ${order.id}:`,
                    itemData
                  );

                  if (
                    !itemResponse.ok ||
                    !itemData?.success ||
                    !Array.isArray(
                      itemData.items
                    )
                  ) {
                    return order;
                  }

                  const items =
                    itemData.items.map(
                      (item: any) => ({
                        id: String(
                          item.product_id
                        ),

                        name: String(
                          item.name ||
                            'Product'
                        ),

                        price: Number(
                          item.price || 0
                        ),

                        quantity: Number(
                          item.quantity || 0
                        ),

                        image: String(
                          item.image ||
                            ''
                        ),
                      })
                    );

                  return {
                    ...order,
                    items,
                  };
                } catch (error) {
                  console.error(
                    `Error fetching items for order ${order.id}:`,
                    error
                  );

                  return order;
                }
              }
            )
          );

        // ---------------------------------------------
        // SAVE ORDERS
        // ---------------------------------------------

        console.log(
          'Final orders:',
          ordersWithItems
        );

        setOrders(
          ordersWithItems
        );
      } catch (error) {
        console.error(
          'Fetch orders error:',
          error
        );

        setOrders([]);
      }
    },
    []
  );

  // =====================================================
  // CANCEL ORDER
  // =====================================================

  const cancelOrder =
    useCallback(
      async (
        orderId: string
      ): Promise<boolean> => {
        try {
          console.log(
            'Cancelling order:',
            orderId
          );

          // -------------------------------------------
          // GET USER
          // -------------------------------------------

          const storedUser =
            await AsyncStorage.getItem(
              'loggedInUser'
            );

          if (!storedUser) {
            console.log(
              'No logged-in user'
            );

            return false;
          }

          const user =
            JSON.parse(
              storedUser
            );

          const userId =
            Number(user?.id);

          if (!userId) {
            return false;
          }

          // -------------------------------------------
          // CANCEL API
          // -------------------------------------------

          const response =
            await fetch(
              `${API_BASE_URL}/api/orders/${orderId}/cancel`,
              {
                method: 'PUT',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                body: JSON.stringify({
                  user_id:
                    userId,
                }),
              }
            );

          const data =
            await response.json();

          console.log(
            'Cancel response:',
            data
          );

          if (!response.ok) {
            console.error(
              'Cancel failed:',
              data?.message
            );

            return false;
          }

          if (!data?.success) {
            return false;
          }

          // -------------------------------------------
          // UPDATE SCREEN
          // -------------------------------------------

          setOrders(
            (currentOrders) =>
              currentOrders.map(
                (order) =>
                  order.id ===
                  String(orderId)
                    ? {
                        ...order,
                        status:
                          'Cancelled',
                      }
                    : order
              )
          );

          return true;
        } catch (error) {
          console.error(
            'Cancel order error:',
            error
          );

          return false;
        }
      },
      []
    );

  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
        fetchOrders,
        cancelOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

// =====================================================
// HOOK
// =====================================================

export function useOrders() {
  const context =
    useContext(OrderContext);

  if (!context) {
    throw new Error(
      'useOrders must be used inside OrderProvider'
    );
  }

  return context;
}