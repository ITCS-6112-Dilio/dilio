/* global chrome */
// src/components/dashboard/Dashboard.jsx
import { useEffect, useState } from "react";
import { auth } from "../../services/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import StatsCard from "./StatsCard";
import QuickActions from "./QuickActions";
import RecentActivity from "./RecentActivity";
import BottomNav from "./BottomNav";
import CampaignsView from "../campaigns/CampaignsView";
import VotingView from "../voting/VotingView";
import ProfileView from "../profile/ProfileView";
import CreateCampaignView from "../campaigns/CreateCampaignView";
import AdminView from "../admin/AdminView";
import {
  calculateStats,
  deleteDonation,
  getDonations,
  saveDonation,
  updateDonation,
} from "../../services/donationService";
import { BADGE_LABELS, checkAndAwardBadges } from "../../services/userService";
import { getAllCampaigns } from "../../services/campaignService";
import { useUser } from "../../context/UserContext";
import { fetchNotifications } from "../../services/notificationService";
import NotificationsView from "../notification/NotificationsView";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const [ currentView, setCurrentView ] = useState("dashboard");
  const [ donations, setDonations ] = useState([]);
  const [ stats, setStats ] = useState({ totalDonated: 0, points: 0, streak: 0 });
  const [ loading, setLoading ] = useState(true);
  const [ pendingPurchase, setPendingPurchase ] = useState(null);
  const [ recentBadges, setRecentBadges ] = useState([]);
  const [ allCampaigns, setAllCampaigns ] = useState([]);
  const [ showCampaignSelector, setShowCampaignSelector ] = useState(false);
  const [ notifications, setNotifications ] = useState([]);

  const safeChrome = {
    get: (keys, callback) => {
      if (typeof chrome !== "undefined" && chrome?.storage?.local) {
        chrome.storage.local.get(keys, callback);
      } else {
        callback({});
      }
    },
    set: (data) => {
      if (typeof chrome !== "undefined" && chrome?.storage?.local) {
        chrome.storage.local.set(data);
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

  useEffect(() => {
    if (userLoading || !user) return;
    loadData();
    loadAllCampaigns();
    checkPendingPurchase();
    fetchNotifications(user.uid).then(setNotifications);
  }, [ userLoading, user ]);

  const loadAllCampaigns = async () => {
    try {
      const campaigns = await getAllCampaigns("approved");
      setAllCampaigns(campaigns);
    } catch (error) {
      console.error("Error loading all campaigns:", error);
    }
  };

  const checkPendingPurchase = () => {
    safeChrome.get([ "pendingPurchase", "selectedCampaign" ], (result) => {
      if (result.pendingPurchase) {
        const selectedCampaign = result.selectedCampaign || "general";
        setPendingPurchase({
          ...result.pendingPurchase,
          selectedCampaign: selectedCampaign,
        });

        if (selectedCampaign === "choose") {
          setShowCampaignSelector(true);
        }
      }
    });
  };

  const loadData = async () => {
    if (!user) return;

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

  useEffect(() => {
    if (!chrome?.storage?.onChanged) return;

    const handleStorageChange = (changes, area) => {
      if (area !== "local") return;

      if (changes.pendingPurchase?.newValue || changes.selectedCampaign?.newValue) {
        const purchase = changes.pendingPurchase?.newValue;
        const campaign = changes.selectedCampaign?.newValue || "general";

        if (purchase) {
          setPendingPurchase({
            ...purchase,
            selectedCampaign: campaign,
          });

          if (campaign === "choose") {
            setShowCampaignSelector(true);
          }
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleSelectCampaign = (campaignId) => {
    setPendingPurchase(prev => ({
      ...prev,
      selectedCampaign: campaignId,
    }));
    setShowCampaignSelector(false);
  };

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

    // For manual donations, use the full amount; for purchases, calculate round-up
    let donationAmount;
    if (pendingPurchase.isManual) {
      donationAmount = purchaseAmount;
    } else {
      donationAmount = Math.ceil(purchaseAmount) - purchaseAmount;
      if (donationAmount <= 0) {
        alert("This purchase does not generate a round-up amount.");
        handleDeclineDonation();
        return;
      }
    }

    const selectedCampaign = pendingPurchase.selectedCampaign || "general";

    let campaignName = "General Pool";
    if (selectedCampaign !== "general") {
      const campaign = allCampaigns.find(c => c.id === selectedCampaign);
      campaignName = campaign ? campaign.name : "Unknown Campaign";
    }

    const donation = {
      amount: donationAmount,
      campaign: campaignName,
      campaignId: selectedCampaign,
      timestamp: Date.now(),
      userId: user.uid,
      source: pendingPurchase.isManual ? "manual" : pendingPurchase.url,
    };
    
    // Add purchase-specific fields only for non-manual donations
    if (!pendingPurchase.isManual) {
      donation.roundUpAmount = donationAmount;
      donation.purchaseAmount = purchaseAmount;
    }

    try {
      const id = await saveDonation(donation);

      setDonations(prev => {
        const updated = [ { id, ...donation }, ...prev ];
        const newStats = calculateStats(updated);
        setStats(newStats);

        checkAndAwardBadges(user.uid, updated, newStats)
          .then(async (newBadgeTypes) => {
            if (newBadgeTypes.length > 0) {
              const names = newBadgeTypes
                .map(type => BADGE_LABELS[type] || type)
                .join(", ");
              alert(`🎉 New badge${newBadgeTypes.length > 1 ? "s" : ""} unlocked: ${names}\n\nView your badges in Profile → Badges tab!`);

              setRecentBadges(newBadgeTypes);
            }
          })
          .catch(console.error);

        return updated;
      });

      safeChrome.remove([ "pendingPurchase", "pendingPurchaseApproved", "selectedCampaign" ]);
      safeChrome.clearBadge();
      setPendingPurchase(null);
      setShowCampaignSelector(false);

      alert("Thank you! Donation of $" + donationAmount.toFixed(2) + " recorded for " + campaignName + "!");
    } catch (error) {
      alert("Error saving donation: " + error.message);
    }
  };

  const handleDeclineDonation = () => {
    safeChrome.clearBadge();
    setPendingPurchase(null);
    setShowCampaignSelector(false);
  };

  const handleCancelDonation = () => {
    if (!window.confirm("Cancel this round-up donation and remove it from your dashboard?")) {
      return;
    }

    safeChrome.remove([ "pendingPurchase", "pendingPurchaseApproved", "selectedCampaign" ]);
    safeChrome.clearBadge();
    setPendingPurchase(null);
    setShowCampaignSelector(false);
  };

  const handleManualDonation = async () => {
    const amount = prompt("Enter donation amount (e.g., 5.00):");
    if (!amount) return;

    const donationAmount = parseFloat(amount);

    if (isNaN(donationAmount) || donationAmount <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }

    const finalAmount = Math.round(donationAmount * 100) / 100;

    const choice = prompt(
      "Choose where to donate:\n" +
      "0. General Pool (Vote Later)\n" +
      "1. Choose a Campaign\n\n" +
      "Enter number:"
    );

    if (choice === null) return;

    let selectedCampaignId = "general";
    let campaignName = "General Pool";

    if (choice === "1") {
      setPendingPurchase({
        amount: finalAmount,
        url: "manual",
        timestamp: Date.now(),
        selectedCampaign: "choose",
        isManual: true,
      });
      setShowCampaignSelector(true);
      return;
    } else if (choice === "0") {
      selectedCampaignId = "general";
      campaignName = "General Pool";
    } else {
      alert("Invalid choice");
      return;
    }

    const donation = {
      amount: finalAmount,
      campaign: campaignName,
      campaignId: selectedCampaignId,
      timestamp: Date.now(),
      userId: user.uid,
      source: "manual",
    };

    try {
      const id = await saveDonation(donation);

      setDonations(prev => {
        const updated = [ { id, ...donation }, ...prev ];
        const newStats = calculateStats(updated);
        setStats(newStats);

        checkAndAwardBadges(user.uid, updated, newStats)
          .then(async (newBadgeTypes) => {
            if (newBadgeTypes.length > 0) {
              const names = newBadgeTypes
                .map(type => BADGE_LABELS[type] || type)
                .join(", ");
              alert(`🎉 New badge${newBadgeTypes.length > 1 ? "s" : ""} unlocked: ${names}\n\nView your badges in Profile → Badges tab!`);

              setRecentBadges(newBadgeTypes);
            }
          })
          .catch(console.error);

        return updated;
      });

      alert(`Thank you! Donation of $${finalAmount.toFixed(2)} recorded for ${campaignName}!`);
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

      setDonations(prev => {
        const updated = prev.filter(d => d.id !== donationId);
        setStats(calculateStats(updated));
        return updated;
      });

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

      setDonations(prev => {
        const updated = prev.map(d =>
          d.id === donation.id ? { ...d, amount } : d,
        );
        setStats(calculateStats(updated));
        return updated;
      });

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
      height: "520px",
      paddingBottom: "100px",
      background: "#ffffff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
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
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    userName: {
      fontSize: "16px",
      marginBottom: "4px",
      fontWeight: 600,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    userEmail: {
      fontSize: "12px",
      color: "#64748b",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    roleBadge: {
      fontSize: "10px",
      padding: "2px 8px",
      background: "#e0e7ff",
      color: "#3730a3",
      borderRadius: "12px",
      marginLeft: "8px",
      textTransform: "uppercase",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    purchaseAmount: {
      fontSize: "24px",
      fontWeight: 700,
      color: "#2563eb",
      marginBottom: "8px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    campaignBadge: {
      display: "inline-block",
      fontSize: "11px",
      padding: "3px 10px",
      background: "#dbeafe",
      color: "#1e40af",
      borderRadius: "12px",
      marginBottom: "12px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
      fontWeight: 600,
      transition: "0.2s",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    badgeToast: {
      marginBottom: "12px",
      padding: "10px 12px",
      borderRadius: "8px",
      background: "#ecfdf5",
      border: "1px solid #bbf7d0",
      fontSize: "12px",
      color: "#166534",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    campaignSelector: {
      marginTop: "12px",
      padding: "0",
      background: "white",
      borderRadius: "8px",
      maxHeight: "250px",
      overflowY: "auto",
      border: "1px solid #e2e8f0",
    },
    campaignOption: {
      padding: "12px 16px",
      marginBottom: "0",
      background: "white",
      border: "none",
      borderBottom: "1px solid #e2e8f0",
      cursor: "pointer",
      fontSize: "13px",
      transition: "background 0.2s",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    campaignOptionLast: {
      borderBottom: "none",
    },
    campaignTitle: {
      fontWeight: 600,
      marginBottom: "4px",
      color: "#0f172a",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    campaignDesc: {
      fontSize: "11px",
      color: "#64748b",
      lineHeight: "1.4",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    selectorHeader: {
      fontSize: "13px",
      fontWeight: 600,
      color: "#475569",
      marginBottom: "8px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    notification: {
      position: "absolute",
      top: "-6px",
      right: "-8px",
      minWidth: "18px",
      height: "18px",
      lineHeight: "18px",
      background: "#ef4444",
      color: "white",
      borderRadius: "50%",
      padding: "0 5px",
      fontSize: "12px",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
  };

  const getInitials = (email) => {
    const name = email.split("@")[0];
    return name.slice(0, 2).toUpperCase();
  };

  const getCampaignName = (campaignId) => {
    if (campaignId === "general") return "General Pool";
    if (campaignId === "choose") return "Choose Campaign";
    const campaign = allCampaigns.find(c => c.id === campaignId);
    return campaign ? campaign.name : "Unknown Campaign";
  };

  if (loading || userLoading) {
    return (
      <div style={styles.container}>
        <div style={{ padding: "40px", textAlign: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>💰 Dilio</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => setCurrentView("notifications")}
          >
            <span role="img" aria-label="notifications" style={{ fontSize: "24px" }}>🔔</span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span style={styles.notification}>
                {notifications.filter(n => !n.read).length > 9 ? "9+" : notifications.filter(n => !n.read).length}
              </span>
            )}
          </div>
          <button
            style={styles.logoutBtn}
            onClick={handleLogout}
            onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.35)"}
            onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.2)"}
          >
            Logout
          </button>
        </div>
      </header>

      {currentView === "dashboard" && (
        <div style={styles.content}>
          {pendingPurchase && pendingPurchase.amount && (
            <div style={styles.purchaseAlert}>
              <div style={styles.purchaseTitle}>
                {pendingPurchase.isManual ? "💰 Manual Donation" : "🛒 Purchase Detected!"}
              </div>
              <div style={styles.purchaseAmount}>
                ${pendingPurchase.amount.toFixed(2)}
              </div>
              {!showCampaignSelector ? (
                <>
                  <span style={styles.campaignBadge}>
                    → {getCampaignName(pendingPurchase.selectedCampaign)}
                  </span>
                  <p style={{ fontSize: "14px", marginBottom: "12px", color: "#64748b", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                    {pendingPurchase.isManual ? (
                      <>Donate <strong style={{ color: "#2563eb" }}>${pendingPurchase.amount.toFixed(2)}</strong> to support a campus cause.</>
                    ) : (
                      <>
                        Round up to <strong>${Math.ceil(pendingPurchase.amount).toFixed(2)}</strong> and donate{" "}
                        <strong style={{ color: "#2563eb" }}>${(Math.ceil(pendingPurchase.amount) - pendingPurchase.amount).toFixed(2)}</strong>.
                      </>
                    )}
                  </p>
                  {pendingPurchase.selectedCampaign === "choose" && (
                    <button
                      style={{ ...styles.confirmBtn, marginBottom: "8px" }}
                      onClick={() => setShowCampaignSelector(true)}
                    >
                      Select Campaign
                    </button>
                  )}
                  {pendingPurchase.selectedCampaign !== "choose" && (
                    <div style={styles.buttonGroup}>
                      <button style={styles.confirmBtn} onClick={handleConfirmDonation}>
                        Confirm Donation
                      </button>
                      <button style={styles.declineBtn} onClick={handleDeclineDonation}>
                        Not Now
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={styles.selectorHeader}>
                    Choose which campaign to support:
                  </div>
                  <div style={styles.campaignSelector}>
                    <div
                      style={styles.campaignOption}
                      onClick={() => handleSelectCampaign("general")}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#eff6ff"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                    >
                      <div style={styles.campaignTitle}>General Pool</div>
                      <div style={styles.campaignDesc}>Vote later for distribution</div>
                    </div>
                    {allCampaigns.map((campaign, idx) => (
                      <div
                        key={campaign.id}
                        style={idx === allCampaigns.length - 1 ? { ...styles.campaignOption, ...styles.campaignOptionLast } : styles.campaignOption}
                        onClick={() => handleSelectCampaign(campaign.id)}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#eff6ff"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                      >
                        <div style={styles.campaignTitle}>{campaign.name}</div>
                        <div style={styles.campaignDesc}>{campaign.description}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    style={{ ...styles.declineBtn, marginTop: "12px" }}
                    onClick={() => setShowCampaignSelector(false)}
                  >
                    Back
                  </button>
                </>
              )}
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
          {recentBadges.length > 0 && (
            <div style={styles.badgeToast}>
              <div style={{ fontWeight: 600 }}>🎉 New badge unlocked!</div>
              <div>
                {recentBadges
                  .map(type => BADGE_LABELS[type] || type)
                  .join(", ")}
              </div>
              <div style={{ fontSize: "11px", marginTop: "4px", opacity: 0.9 }}>
                View in Profile → Badges tab
              </div>
            </div>
          )}
          <StatsCard stats={stats}/>
          <QuickActions
            onManualDonation={handleManualDonation}
            onCreateCampaign={user.role === "organizer" || user.role === "admin" ? () => setCurrentView("create-campaign") : null}
          />
          <RecentActivity
            donations={donations}
            onDelete={handleDeleteDonation}
            onEdit={handleEditDonation}
          />
        </div>
      )}
      {currentView === "campaigns" && <CampaignsView/>}
      {currentView === "voting" && <VotingView/>}
      {currentView === "create-campaign" && <CreateCampaignView userId={user.uid} onBack={() => setCurrentView("dashboard")}/>}
      {currentView === "admin" && <AdminView onBack={() => setCurrentView("dashboard")}/>}
      {currentView === "profile" && <ProfileView onLogout={handleLogout}/>}
      {currentView === "notifications" && <NotificationsView userId={user.uid} notifications={notifications} setNotifications={setNotifications} onBack={() => setCurrentView("dashboard")}/>}
      <BottomNav currentView={currentView} onNavigate={setCurrentView}/>
    </div>
  );
};

export default Dashboard;
