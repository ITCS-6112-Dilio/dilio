// src/services/donationService.js
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from "firebase/firestore";
import app from "./firebase";

const db = getFirestore(app);

/**
 * Save a new donation to Firestore
 */
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

/**
 * Get all donations for a specific user
 */
export const getDonations = async (userId) => {
  try {
    const q = query(
      collection(db, "donations"),
      where("userId", "==", userId),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting donations:", error);
    return [];
  }
};

/**
 * Calculate user statistics from donations
 */
export const calculateStats = (donations) => {
  const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
  const points = donations.length * 10;
  
  let streak = 0;
  if (donations.length > 0) {
    const today = new Date().setHours(0, 0, 0, 0);
    const sortedDonations = [...donations].sort((a, b) => b.timestamp - a.timestamp);
    
    let currentDate = today;
    for (const donation of sortedDonations) {
      const donationDate = new Date(donation.timestamp).setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((currentDate - donationDate) / (1000 * 60 * 60 * 24));
      
      if (dayDiff <= 1) {
        streak++;
        currentDate = donationDate;
      } else {
        break;
      }
    }
  }
  
  return { totalDonated, points, streak: Math.min(streak, 30) };
};

/**
 * Get all active campaigns
 */
export const getAllCampaigns = async () => {
  return [
    {
      id: "1",
      name: "Campus Food Pantry",
      description: "Supporting students facing food insecurity",
      goal: 5000,
      raised: 2340,
      category: "Community",
    },
    {
      id: "2",
      name: "STEM Scholarship Fund",
      description: "Scholarships for underrepresented students in STEM",
      goal: 10000,
      raised: 4560,
      category: "Education",
    },
    {
      id: "3",
      name: "Mental Health Awareness",
      description: "Student wellness and mental health support",
      goal: 3000,
      raised: 1200,
      category: "Wellness",
    },
    {
      id: "4",
      name: "Green Campus Initiative",
      description: "Sustainability and environmental projects",
      goal: 4000,
      raised: 1800,
      category: "Environment",
    },
  ];
};

/**
 * Get current voting session
 */
export const getVotingSession = async () => {
  return {
    id: "week-45-2025",
    poolAmount: 234.50,
    startDate: new Date("2025-11-11"),
    endDate: new Date("2025-11-17"),
    organizations: [
      { 
        id: "1", 
        name: "Campus Food Pantry", 
        description: "Supporting students with food security",
        votes: 45
      },
      { 
        id: "2", 
        name: "Green Initiative", 
        description: "Campus sustainability projects",
        votes: 32
      },
      { 
        id: "3", 
        name: "Mental Health Awareness", 
        description: "Student wellness programs",
        votes: 28
      },
      { 
        id: "4", 
        name: "Community Outreach", 
        description: "Local volunteering opportunities",
        votes: 19
      },
      { 
        id: "5", 
        name: "Arts Council", 
        description: "Supporting creative expression",
        votes: 15
      },
    ],
  };
};

/**
 * Submit a vote for an organization
 */
export const submitVote = async (userId, organizationId, sessionId) => {
  try {
    const q = query(
      collection(db, "votes"),
      where("userId", "==", userId),
      where("sessionId", "==", sessionId)
    );
    
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
