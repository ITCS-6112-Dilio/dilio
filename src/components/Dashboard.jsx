/* global chrome */
// src/components/Dashboard.jsx
import { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import StatsCard from "./dashboard/StatsCard";
import QuickActions from "./dashboard/QuickActions";
import RecentActivity from "./dashboard/RecentActivity";
import BottomNav from "./dashboard/BottomNav";
import CampaignsView from "./campaigns/CampaignsView";
import VotingView from "./voting/VotingView";
import ProfileView from "./profile/ProfileView";
import CreateCampaignView from "./campaigns/CreateCampaignView";
import AdminView from "./admin/AdminView";
import {
  getDonations,
  saveDonation,
  calculateStats,
  deleteDonation,
  updateDonation,
} from "../services/donationService";
import {
  checkAndAwardBadges,
  getUserBadges,
  BADGE_LABELS,
} from "../services/userService";
import { useUser } from "../context/UserContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [currentView, setCurrentView] = useState("dashboard");
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ totalDonated: 0, points: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [badges, setBadges] = useState([]);
  const [recentBadges, setRecentBadges] = useState([]);

  // Safe wrapper for chrome APIs
  const safeChrome = {
    get: (keys, callback) => {
      if (typeof chrome !== "undefined" && chrome?.storage?.local) {
        chrome.storage.local.get(keys, callback);
      } else {
        callback({});
      }
    },
    remove: (keys) => {
      if (typeof chrome !== "undefined" && chrome?.storage?.local) {
        chrome.storage.local.remove(keys);
      }
    },
    clearBadge: () => {
      if (typeof chrome !== "undefined" && chrome?.action?.setBadgeText) {
        chrome.action.setBadgeText({ text: "" });
      }
    },
  };

  // Initial load of donations + check for any existing pending purchase
  useEffect(() => {
    if (userLoading || !user) return;
    loadData();
    checkPendingPurchase();
  }, [userLoading, user]);

  const checkPendingPurchase = () => {
    safeChrome.get(["pendingPurchase"], (result) => {
      if (result.pendingPurchase) {
        console.log("Dilio: pendingPurchase loaded on init:", result.pendingPurchase);
        setPendingPurchase(result.pendingPurchase);
      }
    });
  };

  const loadData = async () => {
    if (!user) return;

    try {
      console.log("Dilio: current user uid:", user.uid);
      const userDonations = await getDonations(user.uid);
      console.log("Dilio: donations loaded in Dashboard:", userDonations);

      const userBadges = await getUserBadges(user.uid);

      setDonations(userDonations);
      setStats(calculateStats(userDonations));
      setBadges(userBadges);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chrome?.storage?.onChanged) return;

    const handleStorageChange = (changes, area) => {
      if (area !== "local") return;

      if (changes.pendingPurchase?.newValue) {
        console.log("Dilio: pendingPurchase updated:", changes.pendingPurchase.newValue);
        setPendingPurchase(changes.pendingPurchase.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleConfirmDonation = async () => {
    if (!pendingPurchase || !pendingPurchase.amount) {
      alert("No purchase amount detected");
      return;
    }

    const purchaseAmount = Number(pendingPurchase.amount);
    if (isNaN(purchaseAmount) || purchaseAmount < 0) {
      alert("Invalid purchase amount");
      return;
    }

    const roundUpAmount = Math.ceil(purchaseAmount) - purchaseAmount;

    if (roundUpAmount <= 0) {
      alert("This purchase does not generate a round-up amount.");
      handleDeclineDonation();
      return;
    }

    const donation = {
      amount: roundUpAmount,
      roundUpAmount,
      purchaseAmount,
      campaign: "General Pool",
      timestamp: Date.now(),
      userId: user.uid,
      source: pendingPurchase.url,
    };

    try {
      const id = await saveDonation(donation);

      setDonations(prev => {
        const updated = [{ id, ...donation }, ...prev];
        const newStats = calculateStats(updated);
        setStats(newStats);

        // 🔥 Check for new badges after this real round-up
        checkAndAwardBadges(user.uid, updated, newStats)
          .then(async (newBadgeTypes) => {
            if (newBadgeTypes.length > 0) {
              const names = newBadgeTypes
                .map(type => BADGE_LABELS[type] || type)
                .join(", ");

              // Toast-style alert for now
              alert(`🎉 New badge${newBadgeTypes.length > 1 ? "s" : ""} unlocked: ${names}`);

              // Refresh badges for UI
              const freshBadges = await getUserBadges(user.uid);
              setBadges(freshBadges);

              // Show just-earned badges in the dashboard banner
              setRecentBadges(newBadgeTypes);
            }
          })
          .catch(console.error);

        return updated;
      });

      // Clear storage + UI
      safeChrome.remove(["pendingPurchase", "pendingPurchaseApproved"]);
      safeChrome.clearBadge();
      setPendingPurchase(null);

      alert("Thank you! Donation of $" + roundUpAmount.toFixed(2) + " recorded!");
    } catch (error) {
      alert("Error saving donation: " + error.message);
    }
  };

  const handleDeclineDonation = () => {
    // Snooze for this popup only
    safeChrome.clearBadge();
    setPendingPurchase(null);
  };

  const handleCancelDonation = () => {
    if (!window.confirm("Cancel this round-up donation and remove it from your dashboard?")) {
      return;
    }

    // Permanently clear this pending purchase
    safeChrome.remove(["pendingPurchase", "pendingPurchaseApproved"]);
    safeChrome.clearBadge();
    setPendingPurchase(null);
  };

  const handleMockPurchase = async () => {
    const amount = prompt("Enter mock purchase amount (e.g., 24.73, or 0 to skip):");
    if (!amount) return;

    const purchaseAmount = parseFloat(amount);

    if (isNaN(purchaseAmount) || purchaseAmount < 0) {
      alert("Please enter a valid amount (0 or greater).");
      return;
    }

    // Round-up still computed (will be 0 for whole amounts and for 0)
    const roundUpAmount = Math.ceil(purchaseAmount) - purchaseAmount;

    // Message for whole or zero purchase amounts
    if (roundUpAmount === 0) {
      alert(
        "This purchase does not generate a round-up amount.\n" +
        "You can still add an additional donation in the next step."
      );
    }

    // Ask user for extra donation
    const extraInput = prompt(
      `Round-up amount is $${roundUpAmount.toFixed(2)}.\n` +
      "Enter any additional donation (optional, e.g., 1.00):"
    );

    let extraDonation = parseFloat(extraInput);

    if (extraInput && (isNaN(extraDonation) || extraDonation < 0)) {
      alert("Invalid additional donation.");
      return;
    }

    if (!extraInput) extraDonation = 0;

    const finalAmount = roundUpAmount + extraDonation;

    // If purchase was 0 and extra was 0, don’t create a donation
    if (finalAmount <= 0) {
      alert("No donation amount detected.");
      return;
    }

    const donation = {
      amount: finalAmount,
      roundUpAmount,
      extraDonation,
      purchaseAmount,
      campaign: "General Pool",
      timestamp: Date.now(),
      userId: user.uid,
    };

    try {
      const id = await saveDonation(donation);

      setDonations(prev => {
        const updated = [{ id, ...donation }, ...prev];
        const newStats = calculateStats(updated);
        setStats(newStats);

        // Check for new badges after this donation
        checkAndAwardBadges(user.uid, updated, newStats)
          .then(async (newBadgeTypes) => {
            if (newBadgeTypes.length > 0) {
              // 1) Notification (before they just see it sitting in the UI)
              const names = newBadgeTypes
                .map(type => BADGE_LABELS[type] || type)
                .join(", ");

              alert(`🎉 New badge${newBadgeTypes.length > 1 ? "s" : ""} unlocked: ${names}`);

              // 2) Refresh full badge list for display
              const freshBadges = await getUserBadges(user.uid);
              setBadges(freshBadges);

              // 3) Save which ones were just earned (optional banner in UI)
              setRecentBadges(newBadgeTypes);
            }
          })
          .catch(console.error);

        return updated;
      });

      safeChrome.remove(["pendingPurchase", "pendingPurchaseApproved"]);
      safeChrome.clearBadge();
      setPendingPurchase(null);

      alert("Thank you! Donation of $" + roundUpAmount.toFixed(2) + " recorded!");
    } catch (error) {
      alert("Error saving donation: " + error.message);
    }
  };

  const handleDeleteDonation = async (donationId) => {
    if (!window.confirm("Are you sure you want to delete this donation?")) {
      return;
    }

    try {
      await deleteDonation(donationId);

      // Update local state so only ONE donation disappears
      setDonations(prev => {
        const updated = prev.filter(d => d.id !== donationId);
        setStats(calculateStats(updated));
        return updated;
      });

      // Optional: sync from Firestore if you care about other-device changes
      // await loadData();

      alert("Donation deleted successfully");
    } catch (error) {
      alert("Error deleting donation: " + error.message);
    }
  };

  const handleEditDonation = async (donation) => {
    const newAmount = prompt("Enter new donation amount:", donation.amount.toFixed(2));
    if (newAmount === null) return;

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await updateDonation(donation.id, { amount });

      // update local state + stats immediately
      setDonations(prev => {
        const updated = prev.map(d =>
          d.id === donation.id ? { ...d, amount } : d
        );
        setStats(calculateStats(updated));
        return updated;
      });

      // Optional: keep this if you want a fresh read from Firestore
      // await loadData();

      alert("Donation updated successfully");
    } catch (error) {
      alert("Error updating donation: " + error.message);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      await signOut(auth);
      navigate("/login");
    }
  };

  const styles = {
    container: {
      width: "100%",
      height: "600px",
      background: "#ffffff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    header: {
      padding: "16px 20px",
      background: "linear-gradient(135deg, #2563eb, #3b82f6)",
      color: "white",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      flexShrink: 0,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: "20px",
      fontWeight: 600,
      margin: 0,
    },
    content: {
      padding: "20px",
      paddingBottom: "20px",
      flex: 1,
      overflowY: "auto",
      overflowX: "hidden",
    },
    userInfo: {
      display: "flex",
      alignItems: "center",
      padding: "16px",
      background: "#f8fafc",
      borderRadius: "12px",
      marginBottom: "20px",
    },
    avatarCircle: {
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      background: "#2563eb",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 600,
      marginRight: "12px",
      fontSize: "16px",
    },
    userName: {
      fontSize: "16px",
      marginBottom: "4px",
      fontWeight: 600,
    },
    userEmail: {
      fontSize: "12px",
      color: "#64748b",
    },
    roleBadge: {
      fontSize: "10px",
      padding: "2px 8px",
      background: "#e0e7ff",
      color: "#3730a3",
      borderRadius: "12px",
      marginLeft: "8px",
      textTransform: "uppercase",
    },
    purchaseAlert: {
      background: "#eff6ff",
      border: "2px solid #2563eb",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "20px",
    },
    purchaseTitle: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#1e40af",
      marginBottom: "8px",
    },
    purchaseAmount: {
      fontSize: "24px",
      fontWeight: 700,
      color: "#2563eb",
      marginBottom: "12px",
    },
    buttonGroup: {
      display: "flex",
      gap: "8px",
    },
    confirmBtn: {
      flex: 1,
      padding: "10px",
      background: "#2563eb",
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontWeight: 600,
      cursor: "pointer",
    },
    declineBtn: {
      flex: 1,
      padding: "10px",
      background: "#f1f5f9",
      color: "#64748b",
      border: "none",
      borderRadius: "6px",
      fontWeight: 600,
      cursor: "pointer",
    },
    logoutBtn: {
      marginLeft: "auto",
      background: "rgba(255,255,255,0.2)",
      color: "white",
      border: "1px solid rgba(255,255,255,0.5)",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 800,
      transition: "0.2s",
    },
    cancelBtn: {
      marginTop: "8px",
      width: "100%",
      padding: "6px 0",
      background: "transparent",
      border: "none",
      color: "#94a3b8",
      fontSize: "12px",
      textDecoration: "underline",
      cursor: "pointer",
      textAlign: "center",
    },
    badgeToast: {
      marginBottom: "12px",
      padding: "10px 12px",
      borderRadius: "8px",
      background: "#ecfdf5",
      border: "1px solid #bbf7d0",
      fontSize: "12px",
      color: "#166534",
    },

    badgeRow: {
      marginBottom: "16px",
    },

    badgeChip: {
      display: "inline-block",
      marginRight: "6px",
      marginBottom: "4px",
      padding: "4px 10px",
      borderRadius: "999px",
      background: "#e0f2fe",
      color: "#0369a1",
      fontSize: "11px",
      fontWeight: 600,
    }
  };

  const getInitials = (email) => {
    const name = email.split("@")[0];
    return name.slice(0, 2).toUpperCase();
  };

  if (loading || userLoading) {
    return (
      <div style={styles.container}>
        <div style={{ padding: "40px", textAlign: "center" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>💰 Dilio</h1>
        <button
          style={styles.logoutBtn}
          onClick={handleLogout}
          onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.35)"}
          onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.2)"}
        >
          Logout
        </button>
      </header>

      {currentView === "dashboard" && (
        <div style={styles.content}>
          {pendingPurchase && pendingPurchase.amount && (
            <div style={styles.purchaseAlert}>
              <div style={styles.purchaseTitle}>🛒 Purchase Detected!</div>

              {/* Purchase total */}
              <div style={styles.purchaseAmount}>
                ${pendingPurchase.amount.toFixed(2)}
              </div>

              {/* Round-up + donation */}
              <p style={{ fontSize: "14px", marginBottom: "12px", color: "#64748b" }}>
                Round up to{" "}
                <strong>
                  ${Math.ceil(pendingPurchase.amount).toFixed(2)}
                </strong>{" "}
                and donate{" "}
                <strong style={{ color: "#2563eb" }}>
                  ${(Math.ceil(pendingPurchase.amount) - pendingPurchase.amount).toFixed(2)}
                </strong>
                .
              </p>

              <div style={styles.buttonGroup}>
                <button style={styles.confirmBtn} onClick={handleConfirmDonation}>
                  Confirm Donation
                </button>
                <button style={styles.declineBtn} onClick={handleDeclineDonation}>
                  Not Now
                </button>
              </div>

              <button style={styles.cancelBtn} onClick={handleCancelDonation}>
                Cancel this Donation
              </button>

            </div>
          )}

          <div style={styles.userInfo}>
            <div style={styles.avatarCircle}>{getInitials(user.email)}</div>
            <div style={{ flex: 1 }}>
              <div style={styles.userName}>
                {user.displayName || user.email.split("@")[0]}
                <span style={styles.roleBadge}>{user.role}</span>
              </div>
              <div style={styles.userEmail}>{user.email}</div>
            </div>
          </div>

          {/* 🔔 Just-earned badge notification */}
          {recentBadges.length > 0 && (
            <div style={styles.badgeToast}>
              <div style={{ fontWeight: 600 }}>🎉 New badge unlocked!</div>
              <div>
                {recentBadges
                  .map(type => BADGE_LABELS[type] || type)
                  .join(", ")}
              </div>
            </div>
          )}

          {/* All badges */}
          {badges.length > 0 && (
            <div style={styles.badgeRow}>
              {badges.map(badge => (
                <span key={badge.id} style={styles.badgeChip}>
                  {BADGE_LABELS[badge.badgeType] || badge.badgeType}
                </span>
              ))}
            </div>
          )}

          <StatsCard stats={stats} />

          <QuickActions
            onMockPurchase={handleMockPurchase}
            onViewCampaigns={() => setCurrentView("campaigns")}
            onVote={() => setCurrentView("voting")}
            onCreateCampaign={user.role === "organizer" || user.role === "admin" ? () => setCurrentView("create-campaign") : null}
            onAdminPanel={user.role === "admin" ? () => setCurrentView("admin") : null}
          />

          <RecentActivity
            donations={donations}
            onDelete={handleDeleteDonation}
            onEdit={handleEditDonation}
          />
        </div>
      )}

      {currentView === "campaigns" && <CampaignsView />}
      {currentView === "voting" && <VotingView />}
      {currentView === "create-campaign" && <CreateCampaignView onBack={() => setCurrentView("dashboard")} userId={user.uid} />}
      {currentView === "admin" && <AdminView onBack={() => setCurrentView("dashboard")} />}
      {currentView === "profile" && <ProfileView onLogout={handleLogout} />}

      <BottomNav currentView={currentView} onNavigate={setCurrentView} />
    </div>
  );
};

export default Dashboard;
