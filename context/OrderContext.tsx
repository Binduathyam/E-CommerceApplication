import React, {
    createContext,
    ReactNode,
    useContext,
    useState,
} from 'react';

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
};

const OrderContext = createContext<
  OrderContextType | undefined
>(undefined);

export function OrderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [orders, setOrders] = useState<Order[]>([]);

  const addOrder = (order: Order) => {
    setOrders((currentOrders) => [
      order,
      ...currentOrders,
    ]);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);

  if (!context) {
    throw new Error(
      'useOrders must be used inside OrderProvider'
    );
  }

  return context;
}