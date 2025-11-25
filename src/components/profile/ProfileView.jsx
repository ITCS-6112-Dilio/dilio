// src/components/profile/ProfileView.jsx
import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import { getPendingRoleRequests, requestOrganizerRole, updateUserRole, getUserBadges, BADGE_LABELS } from "../../services/userService";
import Input from "../Input";
import Button from "../Button";
import { useUser } from "../../context/UserContext";
import { auth, db } from "../../services/firebase";
import { doc, updateDoc, collection, getDocs } from "firebase/firestore";

const ProfileView = ({ onLogout }) => {
  const { user, setUser } = useUser();
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [loading, setLoading] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [pendingRequest, setPendingRequest] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [badges, setBadges] = useState([]); 

  useEffect(() => {
    if (user?.role === "student") {
      checkPendingRequest();
    }
    loadBadges();
  }, [user]);

  const loadBadges = async () => {
    try {
      const userBadges = await getUserBadges(user.uid);
      setBadges(userBadges);
    } catch (error) {
      console.error("Error loading badges:", error);
    }
  };

  const checkPendingRequest = async () => {
    try {
      const roleRequests = await getPendingRoleRequests();
      const existingRoleRequest = roleRequests.find(r => r.userId === user.uid);
      setPendingRequest(existingRoleRequest);
    } catch (error) {
      console.error("Error fetching pending role request:", error);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      alert("Please enter a display name");
      return;
    }

    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      await updateDoc(doc(db, "users", user.uid), { displayName: displayName.trim() });
      setUser(prev => ({ ...prev, displayName: displayName.trim() }));
      alert("✅ Profile updated successfully!");
    } catch (error) {
      alert("Error updating profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOrganizer = async () => {
    if (!requestReason.trim()) {
      alert("Please provide a reason for your request");
      return;
    }

    setLoading(true);
    try {
      await requestOrganizerRole(user.uid, requestReason);
      alert("✅ Organizer request submitted! An admin will review it.");
      setRequestReason("");
      checkPendingRequest();
    } catch (error) {
      alert("Error submitting request: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (window.confirm("Make yourself an admin? (Dev only)")) {
      try {
        await updateUserRole(user.uid, "admin");
        setUser(prev => ({ ...prev, role: "admin" }));
        alert("✅ You are now an admin!");
      } catch (error) {
        alert("Error: " + error.message);
      }
    }
  };

  const handleMigrateDonations = async () => {
    if (!window.confirm("This will recalculate all campaign raised amounts from existing donations. Continue?")) {
      return;
    }

    setMigrating(true);
    try {
      console.log("Starting migration of existing donations...");
      
      const campaignsSnapshot = await getDocs(collection(db, "campaigns"));
      const campaignTotals = {};
      campaignsSnapshot.forEach(docSnap => {
        campaignTotals[docSnap.id] = 0;
      });
      
      const donationsSnapshot = await getDocs(collection(db, "donations"));
      donationsSnapshot.forEach(docSnap => {
        const donation = docSnap.data();
        if (donation.campaignId && donation.campaignId !== "general") {
          const amount = Number(donation.amount) || 0;
          if (campaignTotals[donation.campaignId] !== undefined) {
            campaignTotals[donation.campaignId] += amount;
          }
        }
      });

      for (const [campaignId, total] of Object.entries(campaignTotals)) {
        const campaignRef = doc(db, "campaigns", campaignId);
        const roundedTotal = Math.round(total * 100) / 100;
        await updateDoc(campaignRef, { raised: roundedTotal });
      }
      
      console.log("✅ Migration complete!");
      alert("✅ Migration complete! Campaign totals have been recalculated. Refresh to see changes.");
    } catch (error) {
      console.error("❌ Migration error:", error);
      alert("Migration failed: " + error.message);
    } finally {
      setMigrating(false);
    }
  };

  const styles = {
    container: { padding: "20px", paddingBottom: "100px", height: "520px", overflowY: "auto" },
    header: { marginBottom: "20px" },
    title: { fontSize: "18px", fontWeight: 600, margin: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
    section: { marginBottom: "20px" },
    label: { display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px", color: "#64748b", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
    info: { fontSize: "14px", padding: "10px 12px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
    roleBadge: { display: "inline-block", fontSize: "12px", padding: "4px 12px", background: "#e0e7ff", color: "#3730a3", borderRadius: "12px", textTransform: "uppercase", fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
    textarea: { width: "100%", minHeight: "60px", padding: "8px", borderRadius: 4, border: "1px solid #ccc", fontSize: "14px", boxSizing: "border-box", resize: "vertical", background: pendingRequest ? "#f1f5f9" : "white", cursor: pendingRequest ? "not-allowed" : "text", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
    devSection: { marginTop: "20px", padding: "16px", background: "linear-gradient(135deg, #fef3c7, #fde68a)", borderRadius: "12px", border: "1px solid #fbbf24" },
    devTitle: { fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: "#92400e" },
    devButton: { width: "100%", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, marginBottom: "8px", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
    migrateBtn: { background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white" },
    roleBtn: { background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "white" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Profile</h2>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #e2e8f0" }}>
        <button
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "profile" ? "2px solid #2563eb" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "profile" ? 600 : 500,
            color: activeTab === "profile" ? "#2563eb" : "#64748b",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        <button
          style={{
            padding: "8px 16px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "badges" ? "2px solid #2563eb" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "badges" ? 600 : 500,
            color: activeTab === "badges" ? "#2563eb" : "#64748b",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          }}
          onClick={() => setActiveTab("badges")}
        >
          Badges
        </button>
      </div>

      {activeTab === "profile" && (
        <>
          <div style={styles.section}>
            <label style={styles.label}>Email</label>
            <div style={styles.info}>{user.email}</div>
          </div>

          <div style={styles.section}>
            <label style={styles.label}>Current Role</label>
            <div>
              <span style={styles.roleBadge}>{user.role}</span>
            </div>
          </div>

          <div style={styles.section}>
            <Input
              label="Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>

          {user.role === "student" && (
            <div style={{ marginTop: "20px" }}>
              <h3 style={{ fontSize: "14px", marginBottom: "8px", fontWeight: 600 }}>Request Organizer Role</h3>
              <textarea
                style={styles.textarea}
                value={pendingRequest
                  ? `You have already requested for "${pendingRequest.requestedRole}" at ${new Date(pendingRequest.createdAt.seconds * 1000).toLocaleString()}. Please contact admins for urgent requests.`
                  : requestReason
                }
                onChange={e => setRequestReason(e.target.value)}
                placeholder="Why do you want to become an organizer?"
                readOnly={!!pendingRequest}
              />
              <Button
                variant="secondary"
                onClick={handleRequestOrganizer}
                style={{ marginTop: "10px" }}
                disabled={!!pendingRequest || loading}
              >
                {pendingRequest ? "Request Pending" : loading ? "Submitting..." : "Request Organizer Role"}
              </Button>
            </div>
          )}

          <div style={styles.devSection}>
            <div style={styles.devTitle}>🔧 Developer Tools</div>

            <button
              style={{ ...styles.devButton, ...styles.migrateBtn }}
              onClick={handleMigrateDonations}
              disabled={migrating}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              {migrating ? "Migrating..." : "🔄 Migrate Campaign Totals"}
            </button>

            <button
              style={{ ...styles.devButton, ...styles.roleBtn }}
              onClick={handleMakeAdmin}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              Make Me Admin
            </button>

            <button
              style={{ ...styles.devButton, ...styles.roleBtn }}
              onClick={async () => {
                await updateUserRole(user.uid, "student");
                setUser(prev => ({ ...prev, role: "student" }));
                alert("✅ You are now a student!");
              }}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              Make Me Student
            </button>

            <button
              style={{ ...styles.devButton, ...styles.roleBtn }}
              onClick={async () => {
                await updateUserRole(user.uid, "organizer");
                setUser(prev => ({ ...prev, role: "organizer" }));
                alert("✅ You are now an organizer!");
              }}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              Make Me Organizer
            </button>
          </div>

          <Button variant="danger" onClick={onLogout} style={{ marginTop: "20px" }}>
            Logout
          </Button>
        </>
      )}

      {activeTab === "badges" && (
        <div>
          {/* Add these new styles at the top of component if not present */}
          {badges.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", fontSize: "14px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏅</div>
              <div style={{ fontWeight: 600, marginBottom: "8px" }}>No badges yet!</div>
              <div>Keep donating to earn your first badge</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginTop: "12px" }}>
              {badges.map(badge => (
                <div key={badge.id} style={{ background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "2px solid #3b82f6", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}>
                    {badge.badgeType === "first_donation" && "🎉"}
                    {badge.badgeType === "five_donations" && "⭐"}
                    {badge.badgeType === "big_50" && "💎"}
                    {badge.badgeType === "streak_3" && "🔥"}
                    {badge.badgeType === "streak_7" && "🏆"}
                    {!["first_donation", "five_donations", "big_50", "streak_3", "streak_7"].includes(badge.badgeType) && "🏅"}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e40af", marginBottom: "4px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                    {badge.badgeType === "first_donation" && "First Donation"}
                    {badge.badgeType === "five_donations" && "5 Donations"}
                    {badge.badgeType === "big_50" && "$50 Donated"}
                    {badge.badgeType === "streak_3" && "3-Day Streak"}
                    {badge.badgeType === "streak_7" && "7-Day Streak"}
                    {!["first_donation", "five_donations", "big_50", "streak_3", "streak_7"].includes(badge.badgeType) && badge.badgeType}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                    {badge.awardedAt?.seconds 
                      ? new Date(badge.awardedAt.seconds * 1000).toLocaleDateString()
                      : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileView;
