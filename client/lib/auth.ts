import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// Default profile image URL for all users
export const DEFAULT_PROFILE_IMAGE =
  "https://tr.rbxcdn.com/180DAY-bd2c1a5fc86fd014cbbbaaafdd777643/420/420/Hat/Webp/noFilter";

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: Date;
  memberRank: "starter" | "creator" | "pro" | "studio";
  role: "member" | "partner" | "admin" | "founder" | "support";
  assetsCreated: number;
  assetsDownloaded: number;
  earnings: number;
  profileImage?: string;
  isBanned: boolean;
  banReason?: string;
  banDate?: Date;
}

export async function registerUser(
  email: string,
  password: string,
  username: string,
  displayName: string,
  role: "member" | "partner" | "admin" | "founder" | "support" = "member",
): Promise<UserProfile> {
  try {
    // Trim email to prevent whitespace issues
    const trimmedEmail = email.trim();

    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      trimmedEmail,
      password,
    );
    const user = userCredential.user;

    // Update auth profile with default image
    await updateProfile(user, {
      displayName: displayName,
      photoURL: DEFAULT_PROFILE_IMAGE,
    });

    // Create Firestore profile with default image
    const userProfile: UserProfile = {
      uid: user.uid,
      username,
      email: trimmedEmail,
      displayName,
      profileImage: DEFAULT_PROFILE_IMAGE,
      createdAt: new Date(),
      memberRank: "starter",
      role,
      assetsCreated: 0,
      assetsDownloaded: 0,
      earnings: 0,
      isBanned: false,
    };

    await setDoc(doc(db, "users", user.uid), userProfile);

    return userProfile;
  } catch (error: any) {
    console.error("Registration error:", error);

    // Provide better error messages
    if (error.code === "auth/email-already-in-use") {
      throw new Error(
        "An account with this email already exists. Please sign in instead.",
      );
    } else if (error.code === "auth/weak-password") {
      throw new Error(
        "Password is too weak. Please use at least 8 characters.",
      );
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address. Please check and try again.");
    } else if (error.message?.includes("displayName")) {
      throw new Error("Error updating profile. Please try again.");
    }

    throw error;
  }
}

export async function loginUser(
  email: string,
  password: string,
): Promise<User> {
  try {
    // Trim email to handle whitespace (common when copy/pasting)
    const trimmedEmail = email.trim();

    const userCredential = await signInWithEmailAndPassword(
      auth,
      trimmedEmail,
      password,
    );
    return userCredential.user;
  } catch (error: any) {
    console.error("Login error:", error);

    // Provide better error messages
    if (error.code === "auth/invalid-credential") {
      throw new Error(
        "Invalid email or password. Please check your credentials and try again.",
      );
    } else if (error.code === "auth/user-not-found") {
      throw new Error(
        "No account found with this email. Please create an account first.",
      );
    } else if (error.code === "auth/wrong-password") {
      throw new Error("Incorrect password. Please try again.");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address.");
    } else if (error.code === "auth/too-many-requests") {
      throw new Error(
        "Too many failed login attempts. Please try again later.",
      );
    }

    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    if (docSnap.exists()) {
      return {
        ...(docSnap.data() as UserProfile),
        createdAt: docSnap.data().createdAt.toDate?.() || new Date(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), updates);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

export async function findUserByEmailOrUsername(
  emailOrUsername: string,
): Promise<UserProfile | null> {
  try {
    // First, try to get by UID if it's a UID format (28 characters, alphanumeric)
    if (/^[a-zA-Z0-9]{28}$/.test(emailOrUsername)) {
      const profile = await getUserProfile(emailOrUsername);
      if (profile) {
        return profile;
      }
    }

    // Query users by email (Firestore query)
    const { query, where, getDocs, collection } = await import(
      "firebase/firestore"
    );
    const usersRef = collection(db, "users");

    // Try to find by email first
    const emailQuery = query(usersRef, where("email", "==", emailOrUsername));
    const emailSnapshot = await getDocs(emailQuery);
    if (!emailSnapshot.empty) {
      const userData = emailSnapshot.docs[0].data() as UserProfile;
      return {
        ...userData,
        createdAt: userData.createdAt instanceof Date ? userData.createdAt : new Date(),
      };
    }

    // Try to find by username
    const usernameQuery = query(
      usersRef,
      where("username", "==", emailOrUsername),
    );
    const usernameSnapshot = await getDocs(usernameQuery);
    if (!usernameSnapshot.empty) {
      const userData = usernameSnapshot.docs[0].data() as UserProfile;
      return {
        ...userData,
        createdAt: userData.createdAt instanceof Date ? userData.createdAt : new Date(),
      };
    }

    return null;
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function getMemberRankColor(rank: string): string {
  switch (rank) {
    case "starter":
      return "text-gray-400";
    case "creator":
      return "text-blue-400";
    case "pro":
      return "text-purple-400";
    case "studio":
      return "text-yellow-400";
    default:
      return "text-gray-400";
  }
}

export function getMemberRankLabel(rank: string): string {
  switch (rank) {
    case "starter":
      return "Starter";
    case "creator":
      return "Creator";
    case "pro":
      return "Pro";
    case "studio":
      return "Studio";
    default:
      return "Starter";
  }
}
