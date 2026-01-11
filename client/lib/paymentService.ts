import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

export interface PaymentOrder {
  id: string;
  paypalOrderId: string;
  buyerId: string;
  buyerEmail: string;
  productId: string;
  productName: string;
  productPrice: number;
  currency: "USD" | "EUR";
  creatorId: string;
  creatorName: string;
  totalAmount: number;
  platformFee: number;
  sellerAmount: number;
  status: "pending" | "approved" | "completed" | "failed" | "cancelled";
  paypalStatus: string;
  createdAt: Date;
  capturedAt?: Date;
  updatedAt: Date;
}

export interface Payout {
  id: string;
  orderId: string;
  sellerId: string;
  sellerEmail: string;
  amount: number;
  currency: "USD" | "EUR";
  paypalPayoutId: string;
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

const ORDERS_COLLECTION = "paymentOrders";
const PAYOUTS_COLLECTION = "payouts";

/**
 * Get a single order by ID
 */
export async function getOrder(orderId: string): Promise<PaymentOrder | null> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        capturedAt: data.capturedAt?.toDate?.() || undefined,
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as PaymentOrder;
    }
    return null;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

/**
 * Get all orders for a buyer
 */
export async function getBuyerOrders(userId: string): Promise<PaymentOrder[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where("buyerId", "==", userId),
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          capturedAt: data.capturedAt?.toDate?.() || undefined,
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as PaymentOrder;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Error fetching buyer orders:", error);
    return [];
  }
}

/**
 * Get all orders for a seller
 */
export async function getSellerOrders(
  sellerId: string,
): Promise<PaymentOrder[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where("creatorId", "==", sellerId),
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          capturedAt: data.capturedAt?.toDate?.() || undefined,
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        } as PaymentOrder;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    return [];
  }
}

/**
 * Get seller's total earnings
 */
export async function getSellerEarnings(sellerId: string): Promise<{
  totalEarnings: number;
  completedOrders: number;
  pendingPayouts: number;
  completedPayouts: number;
}> {
  try {
    const orders = await getSellerOrders(sellerId);
    const completedOrders = orders.filter(
      (o) => o.status === "completed",
    ).length;
    const totalEarnings = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + o.sellerAmount, 0);

    // Get payout statistics
    const payoutsQ = query(
      collection(db, PAYOUTS_COLLECTION),
      where("sellerId", "==", sellerId),
    );
    const payoutDocs = await getDocs(payoutsQ);
    const payouts = payoutDocs.docs.map((doc) => doc.data());

    const pendingPayouts = payouts.filter((p) => p.status === "pending").length;
    const completedPayouts = payouts.filter(
      (p) => p.status === "completed",
    ).length;

    return {
      totalEarnings,
      completedOrders,
      pendingPayouts,
      completedPayouts,
    };
  } catch (error) {
    console.error("Error calculating seller earnings:", error);
    return {
      totalEarnings: 0,
      completedOrders: 0,
      pendingPayouts: 0,
      completedPayouts: 0,
    };
  }
}

/**
 * Get seller's payouts
 */
export async function getSellerPayouts(sellerId: string): Promise<Payout[]> {
  try {
    const q = query(
      collection(db, PAYOUTS_COLLECTION),
      where("sellerId", "==", sellerId),
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          completedAt: data.completedAt?.toDate?.() || undefined,
        } as Payout;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Error fetching seller payouts:", error);
    return [];
  }
}

/**
 * Check if user already purchased a product
 */
export async function hasUserPurchased(
  userId: string,
  productId: string,
): Promise<boolean> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where("buyerId", "==", userId),
      where("productId", "==", productId),
      where("status", "==", "completed"),
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking purchase history:", error);
    return false;
  }
}

/**
 * Get order statistics for admin dashboard
 */
export async function getOrderStatistics(): Promise<{
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  platformFees: number;
  sellerPayouts: number;
  averageOrderValue: number;
}> {
  try {
    const allOrders = await getDocs(collection(db, ORDERS_COLLECTION));
    const orders = allOrders.docs.map((doc) => doc.data());

    const completedOrders = orders.filter((o) => o.status === "completed");
    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0,
    );
    const platformFees = completedOrders.reduce(
      (sum, o) => sum + (o.platformFee || 0),
      0,
    );

    const allPayouts = await getDocs(collection(db, PAYOUTS_COLLECTION));
    const payouts = allPayouts.docs.map((doc) => doc.data());
    const sellerPayouts = payouts
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      totalRevenue,
      platformFees,
      sellerPayouts,
      averageOrderValue:
        completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
    };
  } catch (error) {
    console.error("Error getting order statistics:", error);
    return {
      totalOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
      platformFees: 0,
      sellerPayouts: 0,
      averageOrderValue: 0,
    };
  }
}

/**
 * Cancel an order (only if not captured yet)
 */
export async function cancelOrder(orderId: string): Promise<void> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Order not found");
    }

    const order = orderSnap.data();
    if (order.status === "completed") {
      throw new Error("Cannot cancel a completed order");
    }

    await updateDoc(orderRef, {
      status: "cancelled",
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    throw error;
  }
}

/**
 * Refund an order (creates reverse transaction)
 */
export async function refundOrder(
  orderId: string,
  reason: string,
): Promise<void> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Order not found");
    }

    const order = orderSnap.data();
    if (order.status !== "completed") {
      throw new Error("Can only refund completed orders");
    }

    // Mark order as refunded
    await updateDoc(orderRef, {
      status: "refunded",
      refundReason: reason,
      refundedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // In real implementation, also call PayPal Refund API
    // to send money back to buyer
  } catch (error) {
    console.error("Error refunding order:", error);
    throw error;
  }
}
