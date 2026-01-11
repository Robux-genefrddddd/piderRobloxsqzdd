import { useEffect, useState } from "react";
import * as paymentService from "@/lib/paymentService";
import type { PaymentOrder, Payout } from "@/lib/paymentService";

/**
 * Hook to fetch buyer's orders
 */
export function useBuyerOrders(userId: string | undefined) {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await paymentService.getBuyerOrders(userId);
        setOrders(data);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  return { orders, loading, error };
}

/**
 * Hook to fetch seller's orders
 */
export function useSellerOrders(sellerId: string | undefined) {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await paymentService.getSellerOrders(sellerId);
        setOrders(data);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch seller orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [sellerId]);

  return { orders, loading, error };
}

/**
 * Hook to fetch seller earnings
 */
export function useSellerEarnings(sellerId: string | undefined) {
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    completedOrders: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setEarnings({
        totalEarnings: 0,
        completedOrders: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
      });
      setLoading(false);
      return;
    }

    const fetchEarnings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await paymentService.getSellerEarnings(sellerId);
        setEarnings(data);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch earnings");
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [sellerId]);

  return { ...earnings, loading, error };
}

/**
 * Hook to fetch seller's payouts
 */
export function useSellerPayouts(sellerId: string | undefined) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) {
      setPayouts([]);
      setLoading(false);
      return;
    }

    const fetchPayouts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await paymentService.getSellerPayouts(sellerId);
        setPayouts(data);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch payouts");
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, [sellerId]);

  return { payouts, loading, error };
}

/**
 * Hook to check if user has purchased a product
 */
export function usePurchaseHistory(
  userId: string | undefined,
  productId: string,
) {
  const [purchased, setPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !productId) {
      setPurchased(false);
      setLoading(false);
      return;
    }

    const checkPurchase = async () => {
      try {
        setLoading(true);
        setError(null);
        const hasPurchased = await paymentService.hasUserPurchased(
          userId,
          productId,
        );
        setPurchased(hasPurchased);
      } catch (err: any) {
        setError(err?.message || "Failed to check purchase history");
      } finally {
        setLoading(false);
      }
    };

    checkPurchase();
  }, [userId, productId]);

  return { purchased, loading, error };
}

/**
 * Hook to manage a single order
 */
export function useOrder(orderId: string | undefined) {
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await paymentService.getOrder(orderId);
        setOrder(data);
      } catch (err: any) {
        setError(err?.message || "Failed to fetch order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return { order, loading, error };
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      await paymentService.cancelOrder(orderId);
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to cancel order";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { cancel, loading, error };
}

/**
 * Hook to refund an order
 */
export function useRefundOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refund = async (orderId: string, reason: string) => {
    try {
      setLoading(true);
      setError(null);
      await paymentService.refundOrder(orderId, reason);
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to refund order";
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { refund, loading, error };
}
