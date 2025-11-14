// src/components/campaigns/CampaignsView.jsx
import { useState, useEffect } from "react";
import { getAllCampaigns } from "../../services/donationService";
import CampaignCard from "./CampaignCard";

const CampaignsView = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const styles = {
    container: {
      padding: "20px",
      paddingBottom: "20px",
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
      <div style={styles.header}>
        <h2 style={styles.title}>Active Campaigns</h2>
      </div>
      <div style={styles.list}>
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </div>
  );
};

export default CampaignsView;
