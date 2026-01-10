export type UserRole = "member" | "partner" | "admin" | "founder";

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type AssetType = "model" | "script" | "asset" | "resource" | "product";

export interface Asset {
  id: string;
  name: string;
  description: string;
  type: AssetType;
  imageUrl: string;
  productLink: string;
  price: number | null; // null = free
  category: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  downloads: number;
  rating: number;
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
  featured?: boolean;
}

export interface AssetFilter {
  type?: AssetType;
  category?: string;
  priceRange?: "all" | "free" | "paid";
  sortBy?: "newest" | "popular" | "rating";
}
