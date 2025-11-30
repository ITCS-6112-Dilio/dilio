// scheduled-tasks/closeWeeklyPool.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('../dilio-39ba5-firebase-adminsdk-fbsvc-bfea2c47b1.json');

initializeApp({
    credential: cert(serviceAccount),
});

const db = getFirestore();

// Helper: Round currency to 2 decimal places
const roundCurrency = (amount) => {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
};

// Helper: Format date range
const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
};

// Helper: Get total raised for a session
const getTotalForVotingSession = async (sessionId) => {
    try {
        const donationsRef = db.collection('donations');
        const snapshot = await donationsRef
            .where('votingSessionId', '==', sessionId)
            .get();

        let total = 0;
        snapshot.forEach((doc) => {
            const data = doc.data();
            total += Number(data.amount) || 0;
        });

        return roundCurrency(total);
    } catch (error) {
        console.error('Error calculating session total:', error);
        return 0;
    }
};

// Helper: Add notification
const addNotification = async (userId, type, message) => {
    try {
        await db.collection('notifications').add({
            userId,
            type,
            message,
            timestamp: new Date(),
            read: false,
        });
    } catch (error) {
        console.error('Error adding notification:', error);
    }
};

async function closeWeeklyPool() {
    console.log('Starting closeWeeklyPool task...');

    try {
        // 1. Get current active session
        // We look for the session that SHOULD be closing now.
        // Since this runs at the very end of the week (or start of next),
        // we look for an active session.
        const sessionsRef = db.collection('votingSessions');
        const snapshot = await sessionsRef.where('active', '==', true).get();

        if (snapshot.empty) {
            console.log('No active voting session found. Exiting.');
            return;
        }

        // There should only be one active session
        const sessionDoc = snapshot.docs[0];
        const sessionId = sessionDoc.id;
        const sessionData = sessionDoc.data();

        console.log(`Found active session: ${sessionId}`);

        // 2. Determine Winner
        let winner = null;
        let maxVotes = -1;

        sessionData.campaigns.forEach((c) => {
            const votes = c.votes || 0;
            if (votes > maxVotes) {
                maxVotes = votes;
                winner = c;
            }
        });

        if (!winner) {
            console.warn('No winner found, picking first campaign as fallback');
            winner = sessionData.campaigns[0];
        }

        console.log(`Winner determined: ${winner.name} (${maxVotes} votes)`);

        // 3. Calculate Pool Total
        const poolTotal = await getTotalForVotingSession(sessionId);
        console.log(`Total pool amount: $${poolTotal}`);

        // 4. Calculate Distribution
        const BASE_POOL_PERCENTAGE = 0.3;
        const PERFORMANCE_POOL_PERCENTAGE = 0.7;

        const basePool = poolTotal * BASE_POOL_PERCENTAGE;
        const performancePool = poolTotal * PERFORMANCE_POOL_PERCENTAGE;

        const campaignCount = sessionData.campaigns.length;
        const totalVotes = sessionData.totalVotes || 0;

        const baseSharePerCampaign =
            campaignCount > 0 ? basePool / campaignCount : 0;

        const campaignAllocations = sessionData.campaigns.map((c) => {
            const voteShare = totalVotes > 0 ? (c.votes || 0) / totalVotes : 0;
            const performanceShare = performancePool * voteShare;
            const totalAllocation = roundCurrency(
                baseSharePerCampaign + performanceShare
            );

            return {
                ...c,
                allocation: totalAllocation,
            };
        });

        // 5. Execute Transaction
        const completedCampaignIds = await db.runTransaction(async (transaction) => {
            // Step 1: READ all campaign data
            const campaignReads = [];
            for (const c of campaignAllocations) {
                const campaignRef = db.collection('campaigns').doc(c.id);
                const campaignSnap = await transaction.get(campaignRef);
                if (!campaignSnap.exists) {
                    throw new Error(`Campaign ${c.id} not found`);
                }
                campaignReads.push({
                    id: c.id,
                    ref: campaignRef,
                    data: campaignSnap.data(),
                    allocation: c.allocation,
                });
            }

            // Step 2: Calculate updates
            const completedIds = [];
            const updates = [];

            for (const item of campaignReads) {
                const currentRaised = Number(item.data.raised) || 0;
                const newRaised = roundCurrency(currentRaised + item.allocation);
                const goal = Number(item.data.goal) || 0;
                const isCompleted =
                    newRaised >= goal && item.data.status !== 'completed';

                if (isCompleted) {
                    completedIds.push(item.id);
                }

                updates.push({
                    ref: item.ref,
                    newRaised,
                    isCompleted,
                });
            }

            // Step 3: WRITE updates
            for (const update of updates) {
                const updateData = {
                    raised: update.newRaised,
                };
                if (update.isCompleted) {
                    updateData.status = 'completed';
                    updateData.completedAt = FieldValue.serverTimestamp();
                }
                transaction.update(update.ref, updateData);
            }

            // Update Session
            transaction.update(sessionDoc.ref, {
                active: false,
                winnerId: winner.id,
                finalPoolAmount: poolTotal,
                closedAt: FieldValue.serverTimestamp(),
            });

            // Create Weekly Report
            const reportRef = db.collection('weeklyReports').doc(sessionData.weekId);
            transaction.set(reportRef, {
                weekId: sessionData.weekId,
                sessionId: sessionId,
                winnerId: winner.id,
                winnerName: winner.name,
                totalAmount: poolTotal,
                totalVotes: totalVotes,
                startDate: sessionData.startDate,
                endDate: sessionData.endDate,
                closedAt: FieldValue.serverTimestamp(),
                campaigns: campaignAllocations.map((c) => ({
                    id: c.id,
                    name: c.name,
                    votes: c.votes || 0,
                    category: c.category || 'General',
                    earned: c.allocation,
                })),
            });

            return completedIds;
        });

        console.log('Transaction completed successfully.');

        // 6. Send Notifications
        // Notify Completed Campaigns
        if (completedCampaignIds.length > 0) {
            console.log(`Notifying ${completedCampaignIds.length} completed campaigns...`);
            for (const campaignId of completedCampaignIds) {
                const campaignSnap = await db.collection('campaigns').doc(campaignId).get();
                if (campaignSnap.exists) {
                    const data = campaignSnap.data();
                    if (data.organizerId) {
                        await addNotification(
                            data.organizerId,
                            'campaign_completed',
                            `🎉 Goal Reached! Your campaign "${data.name}" has reached its goal!`
                        );
                    }
                }
            }
        }

        // Notify Winner
        const winnerCampaignSnap = await db.collection('campaigns').doc(winner.id).get();
        if (winnerCampaignSnap.exists) {
            const winnerData = winnerCampaignSnap.data();
            if (winnerData.organizerId) {
                console.log(`Notifying winner: ${winnerData.organizerId}`);
                await addNotification(
                    winnerData.organizerId,
                    'campaign_win',
                    `🎉 Congratulations! Your campaign "${winner.name}" won the weekly voting for this week!`
                );
            }
        }

        console.log('✅ Weekly pool closed successfully!');
    } catch (error) {
        console.error('❌ Error closing weekly pool:', error);
        process.exit(1);
    }
}

closeWeeklyPool();
