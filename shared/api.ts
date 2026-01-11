/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Group Types
 */
export interface Group {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  members: GroupMember[];
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface GroupMember {
  userId: string;
  username: string;
  avatar?: string;
  role: "member" | "admin";
  joinedAt: Date;
  isActive: boolean;
}

/**
 * Message Types
 */
export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  imageUrl?: string;
  timestamp: Date;
  isEdited: boolean;
  editedAt?: Date;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  inviterId: string;
  inviterName: string;
  inviterAvatar?: string;
  inviteeId: string;
  invitationDate: Date;
  status: "pending" | "accepted" | "declined";
  message?: string;
}

/**
 * Notification Types
 */
export interface Notification {
  id: string;
  userId: string;
  type:
    | "role_change"
    | "ban"
    | "group_invite"
    | "group_joined"
    | "group_message"
    | "asset_deleted";
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

/**
 * Real-time Update Types
 */
export interface RealtimeUpdate {
  type:
    | "user_banned"
    | "role_changed"
    | "group_created"
    | "group_updated"
    | "message_sent"
    | "member_joined"
    | "notification";
  userId: string;
  timestamp: Date;
  data: Record<string, any>;
}

/**
 * Product/Order Payment Types
 */
export interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: "USD" | "EUR";
  creatorId: string;
  creatorName: string;
  imageUrl: string;
  status: "draft" | "published" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

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
  // Split amounts
  totalAmount: number; // 100%
  platformFee: number; // 30%
  sellerAmount: number; // 70%
  // Status
  status: "pending" | "approved" | "completed" | "failed" | "cancelled";
  paypalStatus: string;
  // Dates
  createdAt: Date;
  capturedAt?: Date;
  updatedAt: Date;
  // Payout info
  payoutId?: string;
  payoutStatus?: "pending" | "completed" | "failed";
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
