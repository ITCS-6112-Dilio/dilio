// scheduled-tasks/notifyVotingEnd.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../dilio-39ba5-firebase-adminsdk-fbsvc-bfea2c47b1.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function runTask() {
  // Get all users
  const usersSnapshot = await db.collection('users').get();

  // Create a notification for each user
  const batch = db.batch();
  const notificationsRef = db.collection('notifications');

  usersSnapshot.forEach((userDoc) => {
    const newNotificationRef = notificationsRef.doc();
    batch.set(newNotificationRef, {
      userId: userDoc.id,
      type: 'voting_ending_soon',
      message: 'Voting is ending soon! Submit your votes before the deadline.',
      timestamp: new Date(),
      read: false,
    });
  });

  await batch.commit();
  console.log(
    `Voting session ending soon notifications sent to ${usersSnapshot.size} users!`
  );
}

runTask().catch(console.error);
