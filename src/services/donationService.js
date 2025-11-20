// src/services/donationService.js
import {
  addDoc,
  collection,
  deleteDoc,
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

// DONATIONS
export const saveDonation = async (donation) => {
  try {
    const docRef = await addDoc(collection(db, "donations"), {
      ...donation,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving donation:", error);
    throw error;
  }
};

export const getDonations = async (userId) => {
  try {
    const q = query(
      collection(db, "donations"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting donations:", error);
    // Do NOT return []
    throw error;
  }
};

export const deleteDonation = async (donationId) => {
  try {
    await deleteDoc(doc(db, "donations", donationId));
  } catch (error) {
    console.error("Error deleting donation:", error);
    throw error;
  }
};

export const updateDonation = async (donationId, updates) => {
  try {
    await updateDoc(doc(db, "donations", donationId), updates);
  } catch (error) {
    console.error("Error updating donation:", error);
    throw error;
  }
};

export const calculateStats = (donations = []) => {
  // Normalize data (amount as number, timestamp as ms)
  const normalized = donations.map(d => {
    const amount = Number(d.amount) || 0;

    let ts = d.timestamp;
    if (ts?.toMillis) {
      ts = ts.toMillis();          // Firestore Timestamp
    } else if (ts instanceof Date) {
      ts = ts.getTime();           // JS Date
    } else if (typeof ts !== "number") {
      ts = 0;                      // Fallback
    }

    return { ...d, amount, timestamp: ts };
  });

  // 1) Total donated
  const totalDonated = normalized.reduce((sum, d) => sum + d.amount, 0);

  // 2) Points based on total donated
  //    e.g., 10 points per $1 donated
  const pointsPerDollar = 10;
  const points = Math.round(totalDonated * pointsPerDollar);

  // 3) Streak logic
  let streak = 0;
  if (normalized.length > 0) {
    const today = new Date().setHours(0, 0, 0, 0);
    const sorted = [...normalized].sort((a, b) => b.timestamp - a.timestamp);
    let currentDate = today;

    for (const d of sorted) {
      if (!d.timestamp) continue;

      const donationDate = new Date(d.timestamp).setHours(0, 0, 0, 0);
      const dayDiff = Math.floor(
        (currentDate - donationDate) / (1000 * 60 * 60 * 24)
      );

      if (dayDiff <= 1) {
        streak++;
        currentDate = donationDate;
      } else {
        break;
      }
    }
  }

  return {
    totalDonated,
    points,
    streak: Math.min(streak, 30),
  };
};

// CAMPAIGN MANAGEMENT
export const createCampaign = async (campaign) => {
  try {
    const docRef = await addDoc(collection(db, "campaigns"), {
      ...campaign,
      status: "pending",
      raised: 0,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }
};

export const updateCampaign = async (campaignId, updates) => {
  try {
    await updateDoc(doc(db, "campaigns", campaignId), updates);
  } catch (error) {
    console.error("Error updating campaign:", error);
    throw error;
  }
};

export const getAllCampaigns = async (status = "approved") => {
  try {
    const q = query(
      collection(db, "campaigns"),
      where("status", "==", status),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting campaigns:", error);
    // Return mock data if Firestore fails
    return [
      {
        id: "1",
        name: "Campus Food Pantry",
        description: "Supporting students facing food insecurity",
        goal: 5000,
        raised: 2340,
        category: "Community",
        status: "approved",
      },
      {
        id: "2",
        name: "STEM Scholarship Fund",
        description: "Scholarships for underrepresented students in STEM",
        goal: 10000,
        raised: 4560,
        category: "Education",
        status: "approved",
      },
      {
        id: "3",
        name: "Mental Health Awareness",
        description: "Student wellness and mental health support",
        goal: 3000,
        raised: 1200,
        category: "Wellness",
        status: "approved",
      },
      {
        id: "4",
        name: "Green Campus Initiative",
        description: "Sustainability and environmental projects",
        goal: 4000,
        raised: 1800,
        category: "Environment",
        status: "approved",
      },
    ];
  }
};

export const getPendingCampaigns = async () => {
  try {
    const q = query(
      collection(db, "campaigns"),
      where("status", "==", "pending"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting pending campaigns:", error);
    return [];
  }
};

export const approveCampaign = async (campaignId) => {
  await updateCampaign(campaignId, { status: "approved", updatedAt: new Date() });
};

export const rejectCampaign = async (campaignId) => {
  await updateCampaign(campaignId, { status: "rejected", updatedAt: new Date() });
};

// VOTING
export const getVotingSession = async () => {
  try {
    // Get current week's voting session
    const q = query(
      collection(db, "votingSessions"),
      where("active", "==", true),
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    // Return mock if none exists
    return {
      id: "week-45-2025",
      poolAmount: 234.50,
      startDate: new Date("2025-11-11"),
      endDate: new Date("2025-11-17"),
      active: true,
      organizations: [
        { id: "1", name: "Campus Food Pantry", description: "Supporting students with food security", votes: 45 },
        { id: "2", name: "Green Initiative", description: "Campus sustainability projects", votes: 32 },
        { id: "3", name: "Mental Health Awareness", description: "Student wellness programs", votes: 28 },
        { id: "4", name: "Community Outreach", description: "Local volunteering opportunities", votes: 19 },
        { id: "5", name: "Arts Council", description: "Supporting creative expression", votes: 15 },
      ],
    };
  } catch (error) {
    console.error("Error getting voting session:", error);
    throw error;
  }
};

export const submitVote = async (userId, organizationId, sessionId) => {
  try {
    const q = query(collection(db, "votes"), where("userId", "==", userId), where("sessionId", "==", sessionId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error("You have already voted in this session");
    }
    await addDoc(collection(db, "votes"), {
      userId,
      organizationId,
      sessionId,
      timestamp: Date.now(),
      createdAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error("Error submitting vote:", error);
    throw error;
  }
};

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

export const closeWeeklyPool = async (weekId, winnerId, totalAmount) => {
  try {
    await addDoc(collection(db, "weeklyReports"), {
      weekId,
      winnerId,
      totalAmount,
      closedAt: new Date(),
    });
  } catch (error) {
    console.error("Error closing weekly pool:", error);
    throw error;
  }
};
