// src/context/UserContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const UserContext = createContext();

/**
 * Provides `user` object across the app. `user` is the Firebase Auth user
 * merged with a `role` field from Firestore (users/{uid}.role).
 */
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // merged user + role
  const [loading, setLoading] = useState(true);

  const loadRole = async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      return snap.exists() ? snap.data() : {};
    } catch (err) {
      console.error("Error loading user role:", err);
      return {};
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const profile = await loadRole(firebaseUser.uid);
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        role: profile.role || "user",
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
