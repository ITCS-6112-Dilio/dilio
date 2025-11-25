// src/components/dashboard/QuickActions.jsx
const QuickActions = ({ onManualDonation, onCreateCampaign }) => {
  const styles = {
    section: {
      marginBottom: "20px",
    },
    title: {
      fontSize: "14px",
      marginBottom: "12px",
      color: "#64748b",
      fontWeight: 600,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "10px",
    },
    button: {
      padding: "14px 12px",
      borderRadius: "10px",
      border: "none",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 600,
      textAlign: "center",
      transition: "all 0.2s",
      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    primary: {
      background: "linear-gradient(135deg, #2563eb, #3b82f6)",
      color: "white",
    },
    success: {
      background: "linear-gradient(135deg, #10b981, #059669)",
      color: "white",
    },
  };

  return (
    <div style={styles.section}>
      <h3 style={styles.title}>Quick Actions</h3>
      <div style={styles.grid}>
        <button 
          style={{ ...styles.button, ...styles.primary }}
          onClick={onManualDonation}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
        >
          💰 Manual Donation
        </button>
        
        {onCreateCampaign && (
          <button 
            style={{ ...styles.button, ...styles.success }}
            onClick={onCreateCampaign}
            onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
            onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
          >
            ➕ Create Campaign
          </button>
        )}
      </div>
    </div>
  );
};

export default QuickActions;