// src/services/userService.js
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import app from "./firebase";

const db = getFirestore(app);

// USER ROLES
export const updateUserRole = async (userId, role) => {
  try {
    await updateDoc(doc(db, "users", userId), { role, updatedAt: new Date() });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

export const requestOrganizerRole = async (userId, reason) => {
  try {
    await addDoc(collection(db, "roleRequests"), {
      userId,
      requestedRole: "organizer",
      reason,
      status: "pending",
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error requesting organizer role:", error);
    throw error;
  }
};

export const getPendingRoleRequests = async () => {
  try {
    const q = query(
      collection(db, "roleRequests"),
      where("status", "==", "pending"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting pending role requests:", error);
    return [];
  }
};

export const approveRoleRequest = async (requestId, userId, role) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      role,
      updatedAt: new Date(),
    });

    await updateDoc(doc(db, "roleRequests", requestId), {
      status: "approved",
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error approving role request:", error);
    return { success: false, error };
  }
};

export const rejectRoleRequest = async (requestId) => {
  try {
    await updateDoc(doc(db, "roleRequests", requestId), {
      status: "rejected",
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error rejecting role request:", error);
    return { success: false, error };
  }
};

// USER
export const getUserById = async (userId) => {
  try {
    const querySnapshot = await getDoc(doc(db, "users", userId));
    return querySnapshot.exists() ? querySnapshot.data() : null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    const usersCol = collection(db, "users");
    const querySnapshot = await getDocs(usersCol);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching all users", error);
    throw error;
  }
};

// BADGES & GAMIFICATION (Sprint 3)
export const getUserBadges = async (userId) => {
  try {
    const q = query(
      collection(db, "badges"),
      where("userId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting badges:", error);
    return [];
  }
};

export const awardBadge = async (userId, badgeType) => {
  try {
    await addDoc(collection(db, "badges"), {
      userId,
      badgeType,
      awardedAt: new Date(),
    });
  } catch (error) {
    console.error("Error awarding badge:", error);
    throw error;
  }
};

// ADMIN REPORTING (Sprint 3)
export const getWeeklyReport = async () => {
  try {
    const q = query(collection(db, "weeklyReports"), orderBy("weekEnd", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting weekly reports:", error);
    return [];
  }
};
