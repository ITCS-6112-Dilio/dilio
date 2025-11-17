// src/components/dashboard/QuickActions.jsx
import Button from "../Button";

const QuickActions = ({ onMockPurchase, onViewCampaigns, onVote, onCreateCampaign, onAdminPanel }) => {
  const styles = {
    section: {
      marginBottom: "20px",
    },
    title: {
      fontSize: "14px",
      marginBottom: "12px",
      color: "#64748b",
      fontWeight: 600,
    },
  };

  return (
    <div style={styles.section}>
      <h3 style={styles.title}>Quick Actions</h3>
      <Button onClick={onMockPurchase} style={{ marginBottom: "10px" }}>
        🛒 Mock Purchase & Donate
      </Button>
      <Button variant="secondary" onClick={onViewCampaigns} style={{ marginBottom: "10px" }}>
        📢 Browse Campaigns
      </Button>
      <Button variant="secondary" onClick={onVote} style={{ marginBottom: "10px" }}>
        🗳️ Weekly Voting
      </Button>
      {onCreateCampaign && (
        <Button variant="success" onClick={onCreateCampaign} style={{ marginBottom: "10px" }}>
          ➕ Create Campaign
        </Button>
      )}
      {onAdminPanel && (
        <Button variant="warning" onClick={onAdminPanel} style={{ marginBottom: "10px" }}>
          ⚙️ Admin Panel
        </Button>
      )}
    </div>
  );
};

export default QuickActions;
