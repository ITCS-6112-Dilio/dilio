// src/services/campaignService.js
import { addDoc, collection, doc, getDocs, getFirestore, query, updateDoc, where } from "firebase/firestore";
import app from "./firebase";

const db = getFirestore(app);

const VALID_STATUSES = [ "approved", "pending", "rejected" ];

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

export const getAllCampaigns = async (status) => {
  try {
    let q;
    if (status === undefined) {
      q = query(collection(db, "campaigns"));
    } else if (VALID_STATUSES.includes(status)) {
      q = query(collection(db, "campaigns"), where("status", "==", status));
    } else {
      throw new Error(
        `Invalid campaign status '${status}'. Must be one of: ${VALID_STATUSES.join(", ")}`,
      );
    }

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
