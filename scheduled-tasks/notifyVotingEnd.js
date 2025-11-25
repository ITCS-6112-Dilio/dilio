const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("../dilio-39ba5-firebase-adminsdk-fbsvc-bfea2c47b1.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function runTask() {
  await db.collection("notifications").add({
    userId: "all",
    type: "voting_ending_soon",
    message: "Voting is ending soon! Submit your votes before the deadline.",
    timestamp: new Date(),
    read: false,
  });
  console.log("Voting session end notification written!");
}

runTask().catch(console.error);
