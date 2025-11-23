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

// BADGE RULES
export const BADGE_TYPES = {
  FIRST_DONATION: "first_donation",
  FIVE_DONATIONS: "five_donations",
  BIG_50: "big_50",
  STREAK_3: "streak_3",
  STREAK_7: "streak_7",
};

export const BADGE_LABELS = {
  [BADGE_TYPES.FIRST_DONATION]: "First Donation",
  [BADGE_TYPES.FIVE_DONATIONS]: "5 Donations",
  [BADGE_TYPES.BIG_50]: "$50 Donated",
  [BADGE_TYPES.STREAK_3]: "3-Day Streak",
  [BADGE_TYPES.STREAK_7]: "7-Day Streak",
};

export const checkAndAwardBadges = async (userId, donations, stats) => {
  try {
    const existingBadges = await getUserBadges(userId);
    const existingTypes = new Set(existingBadges.map(b => b.badgeType));

    const newBadges = [];

    // 1) First donation
    if (donations.length >= 1 && !existingTypes.has(BADGE_TYPES.FIRST_DONATION)) {
      newBadges.push(BADGE_TYPES.FIRST_DONATION);
    }

    // 2) 5 donations
    if (donations.length >= 5 && !existingTypes.has(BADGE_TYPES.FIVE_DONATIONS)) {
      newBadges.push(BADGE_TYPES.FIVE_DONATIONS);
    }

    // 3) Total donated >= $50
    if (stats.totalDonated >= 50 && !existingTypes.has(BADGE_TYPES.BIG_50)) {
      newBadges.push(BADGE_TYPES.BIG_50);
    }

    // 4) Streak >= 3
    if (stats.streak >= 3 && !existingTypes.has(BADGE_TYPES.STREAK_3)) {
      newBadges.push(BADGE_TYPES.STREAK_3);
    }

    // 5) Streak >= 7
    if (stats.streak >= 7 && !existingTypes.has(BADGE_TYPES.STREAK_7)) {
      newBadges.push(BADGE_TYPES.STREAK_7);
    }

    // Award any new badges
    for (const badgeType of newBadges) {
      await awardBadge(userId, badgeType);
    }

    return newBadges; // <- Dashboard will use this to show the notification
  } catch (error) {
    console.error("Error checking/awarding badges:", error);
    return [];
  }
};
