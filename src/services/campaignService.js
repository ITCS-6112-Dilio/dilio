// src/services/campaignService.js
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  updateDoc,
  increment,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import app from './firebase';
import { roundCurrency } from '../utils/formatUtils';
import { addNotification } from './notificationService';

const db = getFirestore(app);

const VALID_STATUSES = ['approved', 'pending', 'rejected', 'completed'];

// CAMPAIGN MANAGEMENT
export const createCampaign = async (campaign) => {
  try {
    const docRef = await addDoc(collection(db, 'campaigns'), {
      ...campaign,
      goal: roundCurrency(campaign.goal),
      status: 'pending',
      raised: 0,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

export const updateCampaign = async (campaignId, updates) => {
  try {
    await updateDoc(doc(db, 'campaigns', campaignId), updates);
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
};

export const getAllCampaigns = async (status) => {
  try {
    let q;
    if (status === undefined) {
      q = query(collection(db, 'campaigns'));
    } else if (VALID_STATUSES.includes(status)) {
      q = query(collection(db, 'campaigns'), where('status', '==', status));
    } else {
      throw new Error(
        `Invalid campaign status '${status}'. Must be one of: ${VALID_STATUSES.join(', ')}`
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting campaigns:', error);
    return [
      {
        id: '1',
        name: 'Campus Food Pantry',
        description: 'Supporting students facing food insecurity',
        goal: 5000,
        raised: 2340,
        category: 'Community',
        status: 'approved',
      },
      {
        id: '2',
        name: 'STEM Scholarship Fund',
        description: 'Scholarships for underrepresented students in STEM',
        goal: 10000,
        raised: 4560,
        category: 'Education',
        status: 'approved',
      },
      {
        id: '3',
        name: 'Mental Health Awareness',
        description: 'Student wellness and mental health support',
        goal: 3000,
        raised: 1200,
        category: 'Wellness',
        status: 'approved',
      },
      {
        id: '4',
        name: 'Green Campus Initiative',
        description: 'Sustainability and environmental projects',
        goal: 4000,
        raised: 1800,
        category: 'Environment',
        status: 'approved',
      },
    ];
  }
};

export const getCampaignById = async (campaignId) => {
  try {
    const ref = doc(db, 'campaigns', campaignId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (error) {
    console.error('Error getting campaign by id:', error);
    throw error;
  }
};

// Get campaigns by organizer ID
export const getCampaignsByOrganizer = async (organizerId) => {
  try {
    const q = query(
      collection(db, 'campaigns'),
      where('organizerId', '==', organizerId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting organizer campaigns:', error);
    return [];
  }
};

// Calculate total raised across all organizer's campaigns
export const getOrganizerTotalRaised = async (organizerId) => {
  try {
    const campaigns = await getCampaignsByOrganizer(organizerId);
    return campaigns.reduce((total, campaign) => {
      return roundCurrency(total + (Number(campaign.raised) || 0));
    }, 0);
  } catch (error) {
    console.error('Error calculating organizer total:', error);
    return 0;
  }
};

export const getPendingCampaigns = async () => {
  try {
    const q = query(
      collection(db, 'campaigns'),
      where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting pending campaigns:', error);
    return [];
  }
};

export const approveCampaign = async (campaignId) => {
  await updateCampaign(campaignId, {
    status: 'approved',
    updatedAt: new Date(),
  });

  const campaignDoc = await doc(db, 'campaigns', campaignId);
  const campaignSnap = await getDoc(campaignDoc);
  const data = campaignSnap.data();
  if (data) {
    await addNotification(
      data.organizerId,
      'campaign_approved',
      `Your campaign "${data.name}" was approved!`
    );
  }
};

export const rejectCampaign = async (campaignId) => {
  await updateCampaign(campaignId, {
    status: 'rejected',
    updatedAt: new Date(),
  });

  const campaignDoc = await doc(db, 'campaigns', campaignId);
  const campaignSnap = await getDoc(campaignDoc);
  const data = campaignSnap.data();
  if (data) {
    await addNotification(
      data.organizerId,
      'campaign_rejected',
      `Your campaign "${data.name}" was rejected.`
    );
  }
};

export const donateDirectToCampaign = async ({
  userId,
  campaignId,
  amount,
  source = 'direct_from_dashboard',
}) => {
  const numericAmount = roundCurrency(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Invalid direct donation amount');
  }

  const campaignRef = doc(db, 'campaigns', campaignId);

  await updateDoc(campaignRef, {
    raised: increment(numericAmount),
    updatedAt: new Date(),
  });

  await addDoc(collection(db, 'directDonations'), {
    userId,
    campaignId,
    amount: numericAmount,
    source,
    timestamp: Date.now(),
    type: 'direct_transfer',
  });
};

export const getUserDirectDonationsTotal = async (userId) => {
  const q = query(
    collection(db, 'directDonations'),
    where('userId', '==', userId)
  );

  const snap = await getDocs(q);
  return snap.docs.reduce((sum, d) => {
    const data = d.data();
    return roundCurrency(sum + (Number(data.amount) || 0));
  }, 0);
};

/**
 * Checks if a campaign has reached its goal and updates status to 'completed' if so.
 * MUST be called within a transaction.
 * @param {object} transaction - Firestore transaction object
 * @param {string} campaignId - Campaign ID
 * @param {number} additionalAmount - Amount being added to raised total
 * @returns {Promise<boolean>} - True if campaign was marked completed
 */
export const checkAndCompleteCampaign = async (
  transaction,
  campaignId,
  additionalAmount
) => {
  const campaignRef = doc(db, 'campaigns', campaignId);
  const campaignSnap = await transaction.get(campaignRef);

  if (!campaignSnap.exists()) {
    throw new Error('Campaign not found');
  }

  const data = campaignSnap.data();
  const currentRaised = Number(data.raised) || 0;
  const newRaised = roundCurrency(currentRaised + additionalAmount);
  const goal = Number(data.goal) || 0;

  // Check if goal reached and not already completed
  if (newRaised >= goal && data.status !== 'completed') {
    transaction.update(campaignRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
    });
    return true;
  }

  return false;
};

/**
 * Sends a notification to the organizer that their campaign is completed.
 * Should be called AFTER the transaction commits.
 * @param {string} campaignId - Campaign ID
 */
export const notifyCampaignCompletion = async (campaignId) => {
  try {
    const campaignSnap = await getDoc(doc(db, 'campaigns', campaignId));
    if (campaignSnap.exists()) {
      const data = campaignSnap.data();
      if (data.organizerId) {
        await addNotification(
          data.organizerId,
          'campaign_completed',
          `🎉 Goal Reached! Your campaign "${data.name}" has reached its goal!`
        );
      }
    }
  } catch (error) {
    console.error('Error sending completion notification:', error);
  }
};
