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
import { 
  getDonations, 
  saveDonation, 
  calculateStats 
} from "../services/donationService";

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("dashboard");
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({ totalDonated: 0, points: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    loadData();
  }, []);

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

  const handleMockPurchase = async () => {
    const amount = prompt("Enter mock purchase amount (e.g., 24.73):");
    if (!amount) return;

    const purchaseAmount = parseFloat(amount);
    if (isNaN(purchaseAmount) || purchaseAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    const roundUpAmount = Math.ceil(purchaseAmount) - purchaseAmount;
    
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
      alert('Donation Successful!\nYou donated $' + roundUpAmount.toFixed(2));
    } catch (error) {
      alert("Error saving donation: " + error.message);
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
      minHeight: "600px",
      background: "#ffffff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    header: {
      padding: "16px 20px",
      background: "linear-gradient(135deg, #2563eb, #3b82f6)",
      color: "white",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    headerTitle: {
      fontSize: "20px",
      fontWeight: 600,
      margin: 0,
    },
    content: {
      padding: "20px",
      paddingBottom: "80px",
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
  };

  const getInitials = (email) => {
    const name = email.split("@")[0];
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ padding: "40px", textAlign: "center" }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>💰 Dilio</h1>
      </header>

      {currentView === "dashboard" && (
        <div style={styles.content}>
          <div style={styles.userInfo}>
            <div style={styles.avatarCircle}>
              {getInitials(user.email)}
            </div>
            <div>
              <div style={styles.userName}>
                {user.displayName || user.email.split("@")[0]}
              </div>
              <div style={styles.userEmail}>{user.email}</div>
            </div>
          </div>

          <StatsCard stats={stats} />
          
          <QuickActions 
            onMockPurchase={handleMockPurchase}
            onViewCampaigns={() => setCurrentView("campaigns")}
            onVote={() => setCurrentView("voting")}
          />
          
          <RecentActivity donations={donations} />
        </div>
      )}

      {currentView === "campaigns" && (
        <CampaignsView />
      )}

      {currentView === "voting" && (
        <VotingView />
      )}

      {currentView === "profile" && (
        <ProfileView user={user} onLogout={handleLogout} />
      )}

      <BottomNav 
        currentView={currentView} 
        onNavigate={setCurrentView} 
      />
    </div>
  );
};

export default Dashboard;
