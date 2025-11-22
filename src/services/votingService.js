// src/services/votingService.js
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  serverTimestamp,
  orderBy,
  limit,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Get or create the current week's voting session (Sunday to Saturday)
 * @returns {Object} Voting session with 5 random campaigns
 */
export const getCurrentVotingSession = async () => {
  try {
    // Get current week identifier based on Sunday-Saturday week
    const weekId = getWeekIdentifier();

    // Check if session already exists
    const sessionRef = doc(db, "votingSessions", weekId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      return { id: sessionSnap.id, ...sessionSnap.data() };
    }

    // Create new session with 5 random campaigns
    const campaigns = await getRandomCampaigns(5);
    
    const { startDate, endDate } = getCurrentWeekRange();
    
    const newSession = {
      weekId,
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        category: c.category,
        votes: 0,
      })),
      totalVotes: 0,
      active: true,
      createdAt: serverTimestamp(),
    };

    await setDoc(sessionRef, newSession);
    return { id: weekId, ...newSession };
  } catch (error) {
    console.error("Error getting voting session:", error);
    throw error;
  }
};

/**
 * Get past voting sessions for history
 * @param {number} count - Number of past sessions to retrieve
 * @returns {Array} Array of past voting sessions
 */
export const getPastVotingSessions = async (count = 4) => {
  try {
    const currentWeekId = getWeekIdentifier();
    
    const sessionsQuery = query(
      collection(db, "votingSessions"),
      orderBy("createdAt", "desc"),
      limit(count + 1)
    );
    const snapshot = await getDocs(sessionsQuery);
    
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(session => session.id !== currentWeekId)
      .slice(0, count);
  } catch (error) {
    console.error("Error getting past sessions:", error);
    return [];
  }
};

/**
 * Get 5 random approved campaigns, avoiding recent selections
 * @param {number} count - Number of campaigns to select
 * @returns {Array} Array of campaign objects
 */
const getRandomCampaigns = async (count = 5) => {
  try {
    // Get all approved campaigns
    const campaignsQuery = query(
      collection(db, "campaigns"),
      where("status", "==", "approved")
    );
    const snapshot = await getDocs(campaignsQuery);
    let allCampaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get recently used campaigns from last 3 weeks
    const recentlyUsed = await getRecentlyUsedCampaigns(3);
    
    // Filter out recently used campaigns if we have enough options
    let availableCampaigns = allCampaigns.filter(
      c => !recentlyUsed.includes(c.id)
    );

    // If not enough available campaigns, use all campaigns
    if (availableCampaigns.length < count) {
      availableCampaigns = allCampaigns;
    }

    // Shuffle and select random campaigns
    const shuffled = availableCampaigns.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  } catch (error) {
    console.error("Error getting random campaigns:", error);
    return [];
  }
};

/**
 * Get campaign IDs used in recent weeks
 * @param {number} weeksBack - Number of weeks to look back
 * @returns {Array} Array of campaign IDs
 */
const getRecentlyUsedCampaigns = async (weeksBack = 3) => {
  try {
    const sessionsQuery = query(
      collection(db, "votingSessions"),
      orderBy("createdAt", "desc"),
      limit(weeksBack)
    );
    const snapshot = await getDocs(sessionsQuery);
    
    const usedIds = new Set();
    snapshot.docs.forEach(doc => {
      const campaigns = doc.data().campaigns || [];
      campaigns.forEach(c => usedIds.add(c.id));
    });

    return Array.from(usedIds);
  } catch (error) {
    console.error("Error getting recently used campaigns:", error);
    return [];
  }
};

/**
 * Submit a vote for a campaign
 * @param {string} userId - User ID
 * @param {string} campaignId - Campaign ID to vote for
 * @param {string} sessionId - Voting session ID
 */
export const submitVote = async (userId, campaignId, sessionId) => {
  try {
    // Check if user already voted
    const votesQuery = query(
      collection(db, "votes"),
      where("userId", "==", userId),
      where("sessionId", "==", sessionId)
    );
    const existingVotes = await getDocs(votesQuery);

    if (!existingVotes.empty) {
      throw new Error("You have already voted in this session");
    }

    // Add vote
    await addDoc(collection(db, "votes"), {
      userId,
      campaignId,
      sessionId,
      timestamp: serverTimestamp(),
    });

    // Update campaign vote count in session
    const sessionRef = doc(db, "votingSessions", sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (sessionSnap.exists()) {
      const sessionData = sessionSnap.data();
      const updatedCampaigns = sessionData.campaigns.map(c => 
        c.id === campaignId ? { ...c, votes: (c.votes || 0) + 1 } : c
      );

      await updateDoc(sessionRef, {
        campaigns: updatedCampaigns,
        totalVotes: increment(1),
      });
    }

    return true;
  } catch (error) {
    console.error("Error submitting vote:", error);
    throw error;
  }
};

/**
 * Check if user has voted in current session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {boolean} True if user has voted
 */
export const hasUserVoted = async (userId, sessionId) => {
  try {
    const votesQuery = query(
      collection(db, "votes"),
      where("userId", "==", userId),
      where("sessionId", "==", sessionId)
    );
    const snapshot = await getDocs(votesQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking vote status:", error);
    return false;
  }
};

// Helper functions for week calculations (Sunday to Saturday)

/**
 * Get week identifier for current week (Sunday-Saturday)
 * Format: YYYY-MM-DD (date of the Sunday)
 */
const getWeekIdentifier = () => {
  const { startDate } = getCurrentWeekRange();
  const year = startDate.getFullYear();
  const month = String(startDate.getMonth() + 1).padStart(2, '0');
  const day = String(startDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get the current week's Sunday and Saturday dates
 * @returns {Object} { startDate: Date, endDate: Date }
 */
const getCurrentWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Get Sunday of current week
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);
  
  // Get Saturday of current week
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};