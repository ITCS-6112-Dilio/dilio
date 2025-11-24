// src/services/notificationService.js
import { addDoc, collection, doc, getDocs, getFirestore, orderBy, query, updateDoc, where } from "firebase/firestore";
import app from "./firebase";

const db = getFirestore(app);

// Fetch notifications for a user, newest first
export const fetchNotifications = async (userId) => {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
};

// Mark a notification as read
export const markNotificationRead = async (notificationId) => {
  await updateDoc(doc(db, "notifications", notificationId), { read: true });
};

// Mark all notifications read for a user
export const markAllNotificationsRead = async (userId) => {
  const notifications = await fetchNotifications(userId);
  const unread = notifications.filter(n => !n.read);
  for (let note of unread) {
    await markNotificationRead(note.id);
  }
};

// Add a new notification
export const addNotification = async (userId, type, message) => {
  await addDoc(collection(db, "notifications"), {
    userId,
    type,
    message,
    timestamp: new Date(),
    read: false,
  });
};
