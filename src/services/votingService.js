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
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get a voting session by its document ID
 * @param {string} sessionId - Firestore doc id in "votingSessions"
 * @returns {Object|null} Voting session object or null if not found
 */
export const getVotingSessionById = async (sessionId) => {
  try {
    const sessionRef = doc(db, 'votingSessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      return null;
    }

    return { id: sessionSnap.id, ...sessionSnap.data() };
  } catch (error) {
    console.error('Error getting voting session by id:', error);
    throw error;
  }
};

/**
 * Get or create the current week's voting session (Sunday to Saturday)
 * @returns {Object} Voting session with 5 random campaigns
 */
export const getCurrentVotingSession = async () => {
  try {
    // Get current week identifier based on Sunday-Saturday week
    const weekId = getWeekIdentifier();

    // Check if session already exists
    const sessionRef = doc(db, 'votingSessions', weekId);
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
      campaigns: campaigns.map((c) => ({
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
    console.error('Error getting voting session:', error);
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
      collection(db, 'votingSessions'),
      orderBy('createdAt', 'desc'),
      limit(count + 1)
    );
    const snapshot = await getDocs(sessionsQuery);

    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((session) => session.id !== currentWeekId)
      .slice(0, count);
  } catch (error) {
    console.error('Error getting past sessions:', error);
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
      collection(db, 'campaigns'),
      where('status', '==', 'approved')
    );
    const snapshot = await getDocs(campaignsQuery);
    let allCampaigns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get recently used campaigns from last 3 weeks
    const recentlyUsed = await getRecentlyUsedCampaigns(3);

    // Filter out recently used campaigns if we have enough options
    let availableCampaigns = allCampaigns.filter(
      (c) => !recentlyUsed.includes(c.id)
    );

    // If not enough available campaigns, use all campaigns
    if (availableCampaigns.length < count) {
      availableCampaigns = allCampaigns;
    }

    // Shuffle and select random campaigns
    const shuffled = availableCampaigns.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  } catch (error) {
    console.error('Error getting random campaigns:', error);
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
      collection(db, 'votingSessions'),
      orderBy('createdAt', 'desc'),
      limit(weeksBack)
    );
    const snapshot = await getDocs(sessionsQuery);

    const usedIds = new Set();
    snapshot.docs.forEach((doc) => {
      const campaigns = doc.data().campaigns || [];
      campaigns.forEach((c) => usedIds.add(c.id));
    });

    return Array.from(usedIds);
  } catch (error) {
    console.error('Error getting recently used campaigns:', error);
    return [];
  }
};

/**
 * Submit or update a vote for a campaign
 * @param {string} userId - User ID
 * @param {string} campaignId - Campaign ID to vote for
 * @param {string} sessionId - Voting session ID
 */
export const submitVote = async (userId, campaignId, sessionId) => {
  try {
    // Check if user already voted
    const votesQuery = query(
      collection(db, 'votes'),
      where('userId', '==', userId),
      where('sessionId', '==', sessionId)
    );
    const existingVotes = await getDocs(votesQuery);

    let oldCampaignId = null;
    let voteDocId = null;

    // If user has voted, get the old campaign ID and vote doc ID
    if (!existingVotes.empty) {
      const oldVote = existingVotes.docs[0];
      oldCampaignId = oldVote.data().campaignId;
      voteDocId = oldVote.id;

      // If voting for the same campaign, no need to update
      if (oldCampaignId === campaignId) {
        return true;
      }

      // Delete the old vote document
      await deleteDoc(doc(db, 'votes', voteDocId));
    }

    // Add new vote
    await addDoc(collection(db, 'votes'), {
      userId,
      campaignId,
      sessionId,
      timestamp: serverTimestamp(),
    });

    // Update campaign vote counts in session
    const sessionRef = doc(db, 'votingSessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      const sessionData = sessionSnap.data();
      const updatedCampaigns = sessionData.campaigns.map((c) => {
        if (c.id === campaignId) {
          // Increment vote for new campaign
          return { ...c, votes: (c.votes || 0) + 1 };
        } else if (oldCampaignId && c.id === oldCampaignId) {
          // Decrement vote for old campaign
          return { ...c, votes: Math.max(0, (c.votes || 0) - 1) };
        }
        return c;
      });

      // If this is a new vote (not an update), increment total votes
      const updates = {
        campaigns: updatedCampaigns,
      };

      if (!oldCampaignId) {
        updates.totalVotes = increment(1);
      }

      await updateDoc(sessionRef, updates);
    }

    return true;
  } catch (error) {
    console.error('Error submitting vote:', error);
    throw error;
  }
};

/**
 * Get user's vote for a specific session
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Vote object with campaignId, or null if not voted
 */
export const getUserVote = async (userId, sessionId) => {
  try {
    const votesQuery = query(
      collection(db, 'votes'),
      where('userId', '==', userId),
      where('sessionId', '==', sessionId)
    );
    const snapshot = await getDocs(votesQuery);

    if (snapshot.empty) {
      return null;
    }

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    };
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
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
    const vote = await getUserVote(userId, sessionId);
    return vote !== null;
  } catch (error) {
    console.error('Error checking vote status:', error);
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
