// src/services/donationService.js
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  where,
  increment,
  runTransaction,
} from 'firebase/firestore';
import app from './firebase';
import { roundCurrency } from '../utils/formatUtils';
import {
  checkAndCompleteCampaign,
  notifyCampaignCompletion,
} from './campaignService';

const db = getFirestore(app);

// DONATIONS
export const saveDonation = async (donation) => {
  try {
    // Round amount to 2 decimal places
    const roundedAmount = roundCurrency(donation.amount);

    // Use a transaction to ensure atomicity
    const result = await runTransaction(db, async (transaction) => {
      const donationData = {
        ...donation,
        amount: roundedAmount,
        createdAt: new Date(),
      };

      // Update campaign raised amount if donation is to a specific campaign
      if (donation.campaignId && donation.campaignId !== 'general') {
        // Check if campaign is completed (READ first)
        const isCompleted = await checkAndCompleteCampaign(
          transaction,
          donation.campaignId,
          roundedAmount
        );

        if (isCompleted) {
          // We can't send notification here because we are in a transaction
          // We'll return a flag to send it after
          donationData.campaignCompleted = true;
        }

        // Update campaign raised amount (WRITE second)
        const campaignRef = doc(db, 'campaigns', donation.campaignId);
        transaction.update(campaignRef, {
          raised: increment(roundedAmount),
        });
      } else {
        // It's a general donation, update the active voting session's poolAmount
        const sessionQuery = query(
          collection(db, 'votingSessions'),
          where('active', '==', true)
        );
        const sessionSnapshot = await getDocs(sessionQuery);
        if (!sessionSnapshot.empty) {
          const sessionDoc = sessionSnapshot.docs[0];
          donationData.votingSessionId = sessionDoc.id;
          transaction.update(sessionDoc.ref, {
            poolAmount: increment(roundedAmount),
          });
        }
      }

      // Add the donation with rounded amount
      const donationRef = doc(collection(db, 'donations'));
      transaction.set(donationRef, donationData);

      return {
        id: donationRef.id,
        campaignCompleted: donationData.campaignCompleted,
      };
    });

    // Send completion notification if needed
    if (result.campaignCompleted && donation.campaignId) {
      await notifyCampaignCompletion(donation.campaignId);
    }

    return result.id;
  } catch (error) {
    console.error('Error saving donation:', error);
    throw error;
  }
};

export const getDonations = async (userId) => {
  try {
    const q = query(
      collection(db, 'donations'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting donations:', error);
    // Do NOT return []
    throw error;
  }
};

export const deleteDonation = async (donationId) => {
  try {
    // Use transaction to ensure we also decrement campaign raised amount
    await runTransaction(db, async (transaction) => {
      const donationRef = doc(db, 'donations', donationId);
      const donationSnap = await transaction.get(donationRef);

      if (!donationSnap.exists()) {
        throw new Error('Donation not found');
      }

      const donationData = donationSnap.data();
      const roundedAmount = roundCurrency(donationData.amount);

      // Delete the donation
      transaction.delete(donationRef);

      // Decrement campaign raised amount if it was to a specific campaign
      if (donationData.campaignId && donationData.campaignId !== 'general') {
        const campaignRef = doc(db, 'campaigns', donationData.campaignId);
        transaction.update(campaignRef, {
          raised: increment(-roundedAmount),
        });
      } else if (
        donationData.campaignId === 'general' &&
        donationData.votingSessionId
      ) {
        // Decrement voting session pool amount
        const sessionRef = doc(
          db,
          'votingSessions',
          donationData.votingSessionId
        );
        transaction.update(sessionRef, {
          poolAmount: increment(-roundedAmount),
        });
      }
    });
  } catch (error) {
    console.error('Error deleting donation:', error);
    throw error;
  }
};

export const updateDonation = async (donationId, updates) => {
  try {
    // Round amount to 2 decimal places if amount is being updated
    if (updates.amount !== undefined) {
      updates.amount = roundCurrency(updates.amount);
    }

    // Use transaction to handle amount changes
    await runTransaction(db, async (transaction) => {
      const donationRef = doc(db, 'donations', donationId);
      const donationSnap = await transaction.get(donationRef);

      if (!donationSnap.exists()) {
        throw new Error('Donation not found');
      }

      const donationData = donationSnap.data();
      const oldAmount = donationData.amount;
      const newAmount = updates.amount;

      // Update the donation
      transaction.update(donationRef, updates);

      // Update campaign raised amount if it was to a specific campaign and amount changed
      if (newAmount !== oldAmount) {
        const difference = roundCurrency(newAmount - oldAmount);

        if (donationData.campaignId && donationData.campaignId !== 'general') {
          const campaignRef = doc(db, 'campaigns', donationData.campaignId);
          transaction.update(campaignRef, {
            raised: increment(difference),
          });
        } else if (
          donationData.campaignId === 'general' &&
          donationData.votingSessionId
        ) {
          // Update voting session pool amount
          const sessionRef = doc(
            db,
            'votingSessions',
            donationData.votingSessionId
          );
          transaction.update(sessionRef, {
            poolAmount: increment(difference),
          });
        }
      }
    });
  } catch (error) {
    console.error('Error updating donation:', error);
    throw error;
  }
};

export const calculateStats = (donations = []) => {
  // Normalize data (amount as number, timestamp as ms)
  const normalized = donations.map((d) => {
    const amount = Number(d.amount) || 0;

    let ts = d.timestamp;
    if (ts?.toMillis) {
      ts = ts.toMillis(); // Firestore Timestamp
    } else if (ts instanceof Date) {
      ts = ts.getTime(); // JS Date
    } else if (typeof ts !== 'number') {
      ts = 0; // Fallback
    }

    return { ...d, amount, timestamp: ts };
  });

  // 1) Total donated
  const totalDonated = roundCurrency(
    normalized.reduce((sum, d) => sum + d.amount, 0)
  );

  // 2) Points based on total donated
  //    e.g., 10 points per $1 donated
  const pointsPerDollar = 10;
  const points = Math.round(totalDonated * pointsPerDollar);

  // 3) Streak (calculated in days)
  let streak = 0;
  if (normalized.length > 0) {
    const today = new Date().setHours(0, 0, 0, 0);

    // Collect unique donation days (midnight timestamps) in a Set
    const daySet = new Set();
    for (const d of normalized) {
      if (!d.timestamp) continue;
      const dayTs = new Date(d.timestamp).setHours(0, 0, 0, 0);
      daySet.add(dayTs);
    }

    // Convert to array and sort from most recent to oldest
    const uniqueDays = Array.from(daySet).sort((a, b) => b - a);

    let currentDate = today;

    for (const donationDay of uniqueDays) {
      const dayDiff = Math.floor(
        (currentDate - donationDay) / (1000 * 60 * 60 * 24)
      );

      // Allow today or exactly 1-day gap (yesterday, day before, etc.)
      if (dayDiff === 0 || dayDiff === 1) {
        streak++;
        currentDate = donationDay; // Next comparison is against this day
      } else {
        // Gap of 2+ days breaks the streak
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

export const getTotalForVotingSession = async (sessionId) => {
  try {
    const q = query(
      collection(db, 'donations'),
      where('votingSessionId', '==', sessionId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.reduce((total, doc) => {
      const data = doc.data();
      return roundCurrency(total + (Number(data.amount) || 0));
    }, 0);
  } catch (error) {
    console.error('Error calculating session total:', error);
    return 0;
  }
};

// VOTING
export const getVotingSession = async () => {
  try {
    // Get current week's voting session
    const q = query(
      collection(db, 'votingSessions'),
      where('active', '==', true)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }

    // Return mock if none exists
    return {
      id: 'week-45-2025',
      poolAmount: 234.5,
      startDate: new Date('2025-11-11'),
      endDate: new Date('2025-11-17'),
      active: true,
      organizations: [
        {
          id: '1',
          name: 'Campus Food Pantry',
          description: 'Supporting students with food security',
          votes: 45,
        },
        {
          id: '2',
          name: 'Green Initiative',
          description: 'Campus sustainability projects',
          votes: 32,
        },
        {
          id: '3',
          name: 'Mental Health Awareness',
          description: 'Student wellness programs',
          votes: 28,
        },
        {
          id: '4',
          name: 'Community Outreach',
          description: 'Local volunteering opportunities',
          votes: 19,
        },
        {
          id: '5',
          name: 'Arts Council',
          description: 'Supporting creative expression',
          votes: 15,
        },
      ],
    };
  } catch (error) {
    console.error('Error getting voting session:', error);
    throw error;
  }
};

export const submitVote = async (userId, organizationId, sessionId) => {
  try {
    const q = query(
      collection(db, 'votes'),
      where('userId', '==', userId),
      where('sessionId', '==', sessionId)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error('You have already voted in this session');
    }
    await addDoc(collection(db, 'votes'), {
      userId,
      organizationId,
      sessionId,
      timestamp: Date.now(),
      createdAt: new Date(),
    });
    return true;
  } catch (error) {
    console.error('Error submitting vote:', error);
    throw error;
  }
};

export const closeWeeklyPool = async (weekId, winnerId, totalAmount) => {
  try {
    await addDoc(collection(db, 'weeklyReports'), {
      weekId,
      winnerId,
      totalAmount,
      closedAt: new Date(),
    });
  } catch (error) {
    console.error('Error closing weekly pool:', error);
    throw error;
  }
};
