// src/services/mockDataService.js
import {
  collection,
  doc,
  getFirestore,
  runTransaction,
  increment,
  Timestamp,
} from 'firebase/firestore';
import app from './firebase';
import { addNotification } from './notificationService';
import { formatDateRange } from '../utils/formatUtils';

const db = getFirestore(app);

const ADMIN_ID = 'lDlZzrTmVlNzWblDdMZyhKorMCr2';
const STUDENT_ID = 'aEFvWHiPnzfsUqBOeCjjSsK4tSQ2';
const ORGANIZER_ID = 'RObQwtuUMiXeGyU3RXaqBmqvVFs1';

const getWeekId = (offsetWeeks) => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() - dayOfWeek - 7 * offsetWeeks); // Previous Sunday based on offset

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createDataForWeek = (transaction, offsetWeeks) => {
  const weekId = getWeekId(offsetWeeks);
  console.log(`Creating mock data for ${weekId}...`);

  // Calculate start and end dates as numbers (Sunday 00:00:00 to Saturday 23:59:59)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startDateObj = new Date(now);
  startDateObj.setDate(now.getDate() - dayOfWeek - 7 * offsetWeeks); // Previous Sunday
  startDateObj.setHours(0, 0, 0, 0);

  const endDateObj = new Date(startDateObj);
  endDateObj.setDate(startDateObj.getDate() + 6); // Previous Saturday
  endDateObj.setHours(23, 59, 59, 999);

  const startDate = startDateObj.getTime();
  const endDate = endDateObj.getTime();

  // Create 5 Mock Campaigns
  const campaigns = [];
  for (let i = 1; i <= 5; i++) {
    const campaignRef = doc(collection(db, 'campaigns'));
    const campaignData = {
      name: `Mock Campaign ${i} (Week ${offsetWeeks} Ago)`,
      description: `This is a mock campaign description for campaign ${i} from ${offsetWeeks} week(s) ago.`,
      organizerId: ORGANIZER_ID,
      organizerName: 'Mock Organizer',
      goal: 1000,
      raised: 0, // Will update with donations
      status: 'approved',
      category: 'Community',
      createdAt: Timestamp.now(),
    };
    transaction.set(campaignRef, campaignData);
    campaigns.push({ id: campaignRef.id, ...campaignData, ref: campaignRef });
  }

  // Create Donations (General + Specific)
  let poolAmount = 0;
  const donations = [];

  // Helper to add donation
  const addDonation = (userId, amount, campaignId = 'general') => {
    const donationRef = doc(collection(db, 'donations'));
    const isGeneral = campaignId === 'general';

    const donationData = {
      amount: amount,
      campaign: isGeneral
        ? 'General Pool'
        : campaigns.find((c) => c.id === campaignId).name,
      campaignId: campaignId,
      timestamp: Date.now(),
      userId: userId,
      source: 'mock_generator',
      votingSessionId: isGeneral ? weekId : null,
    };

    transaction.set(donationRef, donationData);
    donations.push(donationData);

    if (isGeneral) {
      poolAmount += amount;
    } else {
      // Update campaign raised amount
      const campaign = campaigns.find((c) => c.id === campaignId);
      campaign.raised += amount;
      transaction.update(campaign.ref, { raised: campaign.raised });
    }
  };

  // General Donations
  if (offsetWeeks === 1) {
    addDonation(ADMIN_ID, 50.0);
    addDonation(STUDENT_ID, 25.5);
    addDonation(ORGANIZER_ID, 100.0);
    addDonation(ADMIN_ID, 15.0); // Second donation

    // Specific Donations
    addDonation(STUDENT_ID, 20.0, campaigns[0].id);
    addDonation(ADMIN_ID, 100.0, campaigns[2].id);
  } else {
    // Different pattern for Week 2
    addDonation(ADMIN_ID, 75.0);
    addDonation(STUDENT_ID, 10.0);
    addDonation(ORGANIZER_ID, 50.0);

    // Specific Donations
    addDonation(STUDENT_ID, 50.0, campaigns[1].id);
    addDonation(ADMIN_ID, 25.0, campaigns[3].id);
    addDonation(ORGANIZER_ID, 100.0, campaigns[4].id);
  }

  // Create Voting Session (Closed)
  const sessionRef = doc(db, 'votingSessions', weekId);

  // Calculate votes
  // Campaign 0: 2 votes (Admin, Student)
  // Campaign 1: 1 vote (Organizer)
  // Others: 0

  const sessionData = {
    active: false, // User requested active=false
    createdAt: Timestamp.now(),
    startDate: startDate,
    endDate: endDate,
    weekId: weekId,
    poolAmount: poolAmount,
    totalVotes: 3,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      votes: 0, // Will set below
    })),
  };

  // Assign votes
  if (offsetWeeks === 1) {
    sessionData.campaigns[0].votes = 2;
    sessionData.campaigns[1].votes = 1;
  } else {
    // Week 2: 1 vote each to 3 different campaigns
    sessionData.campaigns[0].votes = 1;
    sessionData.campaigns[1].votes = 1;
    sessionData.campaigns[2].votes = 1;
  }

  transaction.set(sessionRef, sessionData);

  // Create Vote Documents
  const addVote = (userId, campaignId) => {
    const voteRef = doc(collection(db, 'votes'));
    transaction.set(voteRef, {
      userId,
      campaignId: campaignId,
      sessionId: weekId,
      timestamp: Date.now(),
      createdAt: new Date(),
    });
  };

  if (offsetWeeks === 1) {
    addVote(ADMIN_ID, campaigns[0].id);
    addVote(STUDENT_ID, campaigns[0].id);
    addVote(ORGANIZER_ID, campaigns[1].id);
  } else {
    addVote(ADMIN_ID, campaigns[0].id);
    addVote(STUDENT_ID, campaigns[1].id);
    addVote(ORGANIZER_ID, campaigns[2].id);
  }

  // Calculate Distribution (Community Base Model)
  const BASE_POOL_PERCENTAGE = 0.3;
  const PERFORMANCE_POOL_PERCENTAGE = 0.7;

  const basePool = poolAmount * BASE_POOL_PERCENTAGE;
  const performancePool = poolAmount * PERFORMANCE_POOL_PERCENTAGE;
  const campaignCount = campaigns.length;

  const baseSharePerCampaign = campaignCount > 0 ? basePool / campaignCount : 0;

  const campaignAllocations = campaigns.map((c) => {
    const votes =
      offsetWeeks === 1
        ? c.id === campaigns[0].id
          ? 2
          : c.id === campaigns[1].id
            ? 1
            : 0
        : c.id === campaigns[0].id ||
            c.id === campaigns[1].id ||
            c.id === campaigns[2].id
          ? 1
          : 0;

    const voteShare = 3 > 0 ? votes / 3 : 0; // Total votes is hardcoded to 3 in this mock
    const performanceShare = performancePool * voteShare;
    const allocation = Number(
      (baseSharePerCampaign + performanceShare).toFixed(2)
    );

    return {
      ...c,
      votes,
      earned: allocation,
    };
  });

  // Create Weekly Report
  const reportRef = doc(db, 'weeklyReports', weekId);
  const winnerId = offsetWeeks === 1 ? campaigns[0].id : campaigns[2].id; // Arbitrary winner for tie
  const winnerName = offsetWeeks === 1 ? campaigns[0].name : campaigns[2].name;

  transaction.set(reportRef, {
    weekId: weekId,
    winnerId: winnerId,
    winnerName: winnerName,
    totalAmount: poolAmount,
    totalVotes: 3,
    startDate: startDate,
    endDate: endDate,
    closedAt: new Date(endDate),
    campaigns: campaignAllocations.map((c) => ({
      id: c.id,
      name: c.name,
      votes: c.votes,
      category: c.category || 'General',
      earned: c.earned,
    })),
  });

  // Update campaign raised amounts in mock data
  campaignAllocations.forEach((c) => {
    const campaignRef = c.ref; // We stored ref earlier
    transaction.update(campaignRef, { raised: increment(c.earned) });
  });

  return {
    weekId,
    notification: {
      organizerId: ORGANIZER_ID,
      campaignName: winnerName,
      poolAmount: poolAmount,
      startDate,
      endDate,
    },
  };
};

export const createMockDataForPreviousWeek = async () => {
  try {
    const results = await runTransaction(db, async (transaction) => {
      const week1 = createDataForWeek(transaction, 1);
      const week2 = createDataForWeek(transaction, 2);
      return [week1, week2];
    });

    // Send notifications after transaction
    for (const result of results) {
      if (result && result.notification) {
        const { organizerId, campaignName, startDate, endDate } =
          result.notification;
        await addNotification(
          organizerId,
          'campaign_win',
          `🎉 Congratulations! Your campaign "${campaignName}" won the weekly voting for this week (${formatDateRange(
            startDate,
            endDate
          )})!`
        );
      }
    }

    console.log('Mock data created successfully for past 2 weeks!');
  } catch (error) {
    console.error('Error creating mock data:', error);
    throw error;
  }
};
