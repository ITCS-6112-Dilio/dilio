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
import { useUser } from "../context/UserContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [currentView, setCurrentView] = useState("dashboard");
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ totalDonated: 0, points: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [pendingPurchase, setPendingPurchase] = useState(null);

  useEffect(() => {
    loadData();
    checkPendingPurchase();
  }, []);

  const safeChrome = {
    get: (key, callback) => {
      if (typeof chrome !== "undefined" && chrome?.storage?.local) {
        chrome.storage.local.get(key, callback);
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

  const checkPendingPurchase = async () => {
    safeChrome.get(["pendingPurchase"], (result) => {
      if (result.pendingPurchase) {
        setPendingPurchase(result.pendingPurchase);
      }
    });
  };

  const loadData = async () => {
    try {
      const userDonations = await getDonations(user.uid);
      setDonations(userDonations);
      setStats(calculateStats(userDonations));
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDonation = async () => {
    if (!pendingPurchase || !pendingPurchase.amount) {
      alert("No purchase amount detected");
      return;
    }

    const purchaseAmount = pendingPurchase.amount;
    const roundUpAmount = Math.ceil(purchaseAmount) - purchaseAmount;

    if (roundUpAmount === 0) {
      alert("This purchase is already a whole dollar amount!");
      handleDeclineDonation();
      return;
    }

    const donation = {
      amount: roundUpAmount,
      purchaseAmount: purchaseAmount,
      campaign: "General Pool",
      timestamp: Date.now(),
      userId: user.uid,
      source: pendingPurchase.url,
    };

    try {
      await saveDonation(donation);
      await loadData();
      safeChrome.remove(["pendingPurchase"]);
      safeChrome.clearBadge();
      setPendingPurchase(null);
      alert("Thank you! Donation of \\$" + roundUpAmount.toFixed(2) + " recorded!");
    } catch (error) {
      alert("Error saving donation: " + error.message);
    }
  };

  const handleDeclineDonation = () => {
    safeChrome.remove(["pendingPurchase"]);
    safeChrome.clearBadge();
    setPendingPurchase(null);
  };

  const handleMockPurchase = async () => {
    const amount = prompt("Enter mock purchase amount (e.g., 24.73):");
    if (!amount) return;

    const purchaseAmount = parseFloat(amount);
    if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const roundUpAmount = Math.ceil(purchaseAmount) - purchaseAmount;

    if (roundUpAmount === 0) {
      alert("This is already a whole dollar amount!");
      return;
    }

    const donation = {
      amount: roundUpAmount,
      purchaseAmount: purchaseAmount,
      campaign: "General Pool",
      timestamp: Date.now(),
      userId: user.uid,
    };

    try {
      await saveDonation(donation);
      await loadData();
      alert("Donation Successful!\\nYou donated \\$" + roundUpAmount.toFixed(2));
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
      await loadData();
      alert("Donation deleted successfully");
    } catch (error) {
      alert("Error deleting donation: " + error.message);
    }
  };

  const handleEditDonation = async (donation) => {
    const newAmount = prompt("Enter new donation amount:", donation.amount.toFixed(2));
    if (!newAmount) return;

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await updateDonation(donation.id, { amount });
      await loadData();
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
      border: "1px solid rgba(255,255,255,0.3)",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 500,
      transition: "0.2s",
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
              <div style={styles.purchaseAmount}>
                \\
              </div>
              <p style={{ fontSize: "14px", marginBottom: "12px", color: "#64748b" }}>
                Round up to \\ and donate{" "}
                <strong style={{ color: "#2563eb" }}>
                  \\
                </strong>
              </p>
              <div style={styles.buttonGroup}>
                <button style={styles.confirmBtn} onClick={handleConfirmDonation}>
                  Confirm Donation
                </button>
                <button style={styles.declineBtn} onClick={handleDeclineDonation}>
                  Not Now
                </button>
              </div>
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
