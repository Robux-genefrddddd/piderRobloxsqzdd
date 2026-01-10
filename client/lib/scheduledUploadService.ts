import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

export interface ScheduledUpload {
  id: string;
  assetId: string;
  userId: string;
  files: Array<{
    name: string;
    size: number;
    type: string;
    path?: string;
  }>;
  changeNotes: string;
  scheduledFor: Date;
  status: "scheduled" | "processing" | "completed" | "failed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  errorMessage?: string;
}

const SCHEDULED_UPLOADS_COLLECTION = "scheduled_uploads";

// Create a scheduled upload
export async function createScheduledUpload(
  assetId: string,
  userId: string,
  files: Array<{ name: string; size: number; type: string }>,
  changeNotes: string,
  scheduledFor: Date,
): Promise<string> {
  try {
    const docRef = await addDoc(
      collection(db, SCHEDULED_UPLOADS_COLLECTION),
      {
        assetId,
        userId,
        files,
        changeNotes,
        scheduledFor: Timestamp.fromDate(scheduledFor),
        status: "scheduled",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
    );
    return docRef.id;
  } catch (error) {
    console.error("Error creating scheduled upload:", error);
    throw error;
  }
}

// Get scheduled uploads for a user
export async function getUserScheduledUploads(
  userId: string,
): Promise<ScheduledUpload[]> {
  try {
    const q = query(
      collection(db, SCHEDULED_UPLOADS_COLLECTION),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);

    const uploads = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        scheduledFor: doc.data().scheduledFor?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      }))
      .sort((a, b) => b.scheduledFor.getTime() - a.scheduledFor.getTime()) as ScheduledUpload[];

    return uploads;
  } catch (error) {
    console.error("Error fetching scheduled uploads:", error);
    return [];
  }
}

// Get pending scheduled uploads (for a background worker)
export async function getPendingScheduledUploads(): Promise<ScheduledUpload[]> {
  try {
    const now = new Date();
    const q = query(
      collection(db, SCHEDULED_UPLOADS_COLLECTION),
      where("status", "==", "scheduled"),
    );
    const querySnapshot = await getDocs(q);

    const uploads = querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        scheduledFor: doc.data().scheduledFor?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      }))
      .filter((upload) => upload.scheduledFor <= now) as ScheduledUpload[];

    return uploads;
  } catch (error) {
    console.error("Error fetching pending scheduled uploads:", error);
    return [];
  }
}

// Update scheduled upload status
export async function updateScheduledUploadStatus(
  uploadId: string,
  status: "scheduled" | "processing" | "completed" | "failed" | "cancelled",
  errorMessage?: string,
): Promise<void> {
  try {
    const docRef = doc(db, SCHEDULED_UPLOADS_COLLECTION, uploadId);
    await updateDoc(docRef, {
      status,
      errorMessage: errorMessage || null,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating scheduled upload status:", error);
    throw error;
  }
}

// Cancel a scheduled upload
export async function cancelScheduledUpload(uploadId: string): Promise<void> {
  try {
    await updateScheduledUploadStatus(uploadId, "cancelled");
  } catch (error) {
    console.error("Error cancelling scheduled upload:", error);
    throw error;
  }
}

// Delete a scheduled upload
export async function deleteScheduledUpload(uploadId: string): Promise<void> {
  try {
    const docRef = doc(db, SCHEDULED_UPLOADS_COLLECTION, uploadId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting scheduled upload:", error);
    throw error;
  }
}

// Format time remaining until scheduled upload
export function getTimeRemaining(scheduledFor: Date): string {
  const now = new Date();
  const diff = scheduledFor.getTime() - now.getTime();

  if (diff < 0) {
    return "Ready to upload";
  }

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return "Now";
}
