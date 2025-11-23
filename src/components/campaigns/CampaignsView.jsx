// src/components/campaigns/CampaignsView.jsx
import { useEffect, useState } from "react";
import CampaignCard from "./CampaignCard";
import { getAllCampaigns, getOrganizerTotalRaised, getCampaignsByOrganizer } from "../../services/campaignService";
import { useUser } from "../../context/UserContext";
import CreateCampaignView from "./CreateCampaignView";

const CampaignsView = () => {
  const { user } = useUser();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [yourCampaignsStatus, setYourCampaignsStatus] = useState("pending");
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [organizerTotal, setOrganizerTotal] = useState(0);

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    // Load organizer total when viewing "yours" tab
    if (activeTab === "yours" && (user.role === "organizer" || user.role === "admin")) {
      loadOrganizerTotal();
    }
  }, [activeTab, user.uid, user.role]);

  const loadCampaigns = async () => {
    try {
      const data = await getAllCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizerTotal = async () => {
    try {
      const total = await getOrganizerTotalRaised(user.uid);
      setOrganizerTotal(total);
    } catch (error) {
      console.error("Error loading organizer total:", error);
    }
  };

  const yourCampaigns = campaigns.filter(c => c.organizerId === user.uid);
  const pendingCampaigns = yourCampaigns.filter(c => c.status === "pending");
  const approvedCampaigns = yourCampaigns.filter(c => c.status === "approved");
  const rejectedCampaigns = yourCampaigns.filter(c => c.status === "rejected");

  const styles = {
    container: {
      padding: "20px",
      paddingBottom: "100px",
      height: "520px",
      overflowY: "auto",
    },
    header: {
      marginBottom: "20px",
    },
    title: {
      fontSize: "18px",
      fontWeight: 600,
      margin: 0,
    },
    list: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    organizerStats: {
      background: "linear-gradient(135deg, #10b981, #059669)",
      color: "white",
      padding: "16px",
      borderRadius: "12px",
      marginBottom: "20px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
    statTitle: {
      fontSize: "13px",
      opacity: 0.9,
      marginBottom: "4px",
    },
    statAmount: {
      fontSize: "28px",
      fontWeight: 700,
      marginBottom: "4px",
    },
    statSubtext: {
      fontSize: "12px",
      opacity: 0.85,
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 20 }}>
        <button
          style={{
            fontWeight: activeTab === "active" ? 700 : 400,
            borderBottom: activeTab === "active" ? "2px solid #2563eb" : "none",
            background: "none", border: "none", fontSize: "18px", cursor: "pointer",
          }}
          onClick={() => setActiveTab("active")}
        >
          Active Campaigns
        </button>
        {(user.role === "organizer" || user.role === "admin") && (
          <button
            style={{
              fontWeight: activeTab === "yours" ? 700 : 400,
              borderBottom: activeTab === "yours" ? "2px solid #2563eb" : "none",
              background: "none", border: "none", fontSize: "18px", cursor: "pointer",
            }}
            onClick={() => setActiveTab("yours")}
          >
            Your Campaigns
          </button>
        )}
      </div>

      {activeTab === "active" && (
        <div style={styles.list}>
          {campaigns
            .filter(c => c.status === "approved")
            .map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign}/>
            ))}
        </div>
      )}

      {activeTab === "yours" && (
        <div>
          {/* Organizer Total Stats Card */}
          <div style={styles.organizerStats}>
            <div style={styles.statTitle}>Total Raised Across All Campaigns</div>
            <div style={styles.statAmount}>${organizerTotal.toFixed(2)}</div>
            <div style={styles.statSubtext}>
              {yourCampaigns.length} campaign{yourCampaigns.length !== 1 ? 's' : ''} created
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <button
              style={{
                fontWeight: yourCampaignsStatus === "pending" ? 700 : 400,
                borderBottom: yourCampaignsStatus === "pending" ? "2px solid #2563eb" : "none",
                background: "none", border: "none", fontSize: "15px", cursor: "pointer",
              }}
              onClick={() => setYourCampaignsStatus("pending")}
            >
              Pending ({pendingCampaigns.length})
            </button>
            <button
              style={{
                fontWeight: yourCampaignsStatus === "approved" ? 700 : 400,
                borderBottom: yourCampaignsStatus === "approved" ? "2px solid #2563eb" : "none",
                background: "none", border: "none", fontSize: "15px", cursor: "pointer",
              }}
              onClick={() => setYourCampaignsStatus("approved")}
            >
              Approved ({approvedCampaigns.length})
            </button>
            <button
              style={{
                fontWeight: yourCampaignsStatus === "rejected" ? 700 : 400,
                borderBottom: yourCampaignsStatus === "rejected" ? "2px solid #2563eb" : "none",
                background: "none", border: "none", fontSize: "15px", cursor: "pointer",
              }}
              onClick={() => setYourCampaignsStatus("rejected")}
            >
              Rejected ({rejectedCampaigns.length})
            </button>
          </div>

          {yourCampaignsStatus === "pending" && editingCampaign ? (
            <CreateCampaignView
              campaign={editingCampaign}
              userId={user.uid}
              onBack={() => setEditingCampaign(null)}
              onSave={() => {
                setEditingCampaign(null);
                loadCampaigns();
                loadOrganizerTotal();
              }}
            />
          ) : (
            <div style={styles.list}>
              {(yourCampaignsStatus === "pending"
                  ? pendingCampaigns
                  : yourCampaignsStatus === "approved"
                    ? approvedCampaigns
                    : rejectedCampaigns
              ).map(c => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  editable={yourCampaignsStatus === "pending"}
                  onEdit={setEditingCampaign}
                  showDonations={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignsView;