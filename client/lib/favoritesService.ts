import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

export interface Favorite {
  id: string;
  userId: string;
  assetId: string;
  assetName: string;
  assetImage: string;
  createdAt: Date;
}

const FAVORITES_COLLECTION = "favorites";

// Get user's favorite assets
export async function getUserFavorites(userId: string): Promise<Favorite[]> {
  try {
    const q = query(
      collection(db, FAVORITES_COLLECTION),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);

    const favorites = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }))
      .sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      ) as Favorite[];

    return favorites;
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
}

// Check if asset is favorited
export async function isFavorited(
  userId: string,
  assetId: string,
): Promise<boolean> {
  try {
    const q = query(
      collection(db, FAVORITES_COLLECTION),
      where("userId", "==", userId),
      where("assetId", "==", assetId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.length > 0;
  } catch (error) {
    console.error("Error checking favorite:", error);
    return false;
  }
}

// Add to favorites
export async function addFavorite(
  userId: string,
  assetId: string,
  assetName: string,
  assetImage: string,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, FAVORITES_COLLECTION), {
      userId,
      assetId,
      assetName,
      assetImage,
      createdAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error adding favorite:", error);
    throw error;
  }
}

// Remove from favorites
export async function removeFavorite(
  userId: string,
  assetId: string,
): Promise<void> {
  try {
    const q = query(
      collection(db, FAVORITES_COLLECTION),
      where("userId", "==", userId),
      where("assetId", "==", assetId),
    );
    const querySnapshot = await getDocs(q);

    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
    }
  } catch (error) {
    console.error("Error removing favorite:", error);
    throw error;
  }
}
