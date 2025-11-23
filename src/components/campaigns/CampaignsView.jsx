// src/components/campaigns/CampaignsView.jsx
import { useEffect, useState } from "react";
import CampaignCard from "./CampaignCard";
import { getAllCampaigns } from "../../services/campaignService";
import { useUser } from "../../context/UserContext";
import CreateCampaignView from "./CreateCampaignView";

const CampaignsView = () => {
  const { user } = useUser();
  const [ campaigns, setCampaigns ] = useState([]);
  const [ loading, setLoading ] = useState(true);
  const [ activeTab, setActiveTab ] = useState("active");
  const [ yourCampaignsStatus, setYourCampaignsStatus ] = useState("pending");
  const [ editingCampaign, setEditingCampaign ] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

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
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <button
              style={{
                fontWeight: yourCampaignsStatus === "pending" ? 700 : 400,
                borderBottom: yourCampaignsStatus === "pending" ? "2px solid #2563eb" : "none",
                background: "none", border: "none", fontSize: "15px", cursor: "pointer",
              }}
              onClick={() => setYourCampaignsStatus("pending")}
            >
              Pending
            </button>
            <button
              style={{
                fontWeight: yourCampaignsStatus === "approved" ? 700 : 400,
                borderBottom: yourCampaignsStatus === "approved" ? "2px solid #2563eb" : "none",
                background: "none", border: "none", fontSize: "15px", cursor: "pointer",
              }}
              onClick={() => setYourCampaignsStatus("approved")}
            >
              Approved
            </button>
            <button
              style={{
                fontWeight: yourCampaignsStatus === "rejected" ? 700 : 400,
                borderBottom: yourCampaignsStatus === "rejected" ? "2px solid #2563eb" : "none",
                background: "none", border: "none", fontSize: "15px", cursor: "pointer",
              }}
              onClick={() => setYourCampaignsStatus("rejected")}
            >
              Rejected
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
