// src/components/dashboard/RecentActivity.jsx
const RecentActivity = ({ donations = [] }) => {
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
    list: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    item: {
      display: "flex",
      alignItems: "center",
      padding: "12px",
      background: "#f8fafc",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
    },
    icon: {
      fontSize: "24px",
      marginRight: "12px",
    },
    details: {
      flex: 1,
    },
    itemTitle: {
      fontSize: "14px",
      fontWeight: 500,
      marginBottom: "4px",
    },
    itemDate: {
      fontSize: "12px",
      color: "#64748b",
    },
    amount: {
      fontWeight: 600,
      color: "#10b981",
    },
    noData: {
      textAlign: "center",
      color: "#64748b",
      fontSize: "14px",
      padding: "20px",
    },
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={styles.section}>
      <h3 style={styles.title}>Recent Donations</h3>
      {donations.length === 0 ? (
        <p style={styles.noData}>
          No donations yet. Start supporting campus causes!
        </p>
      ) : (
        <div style={styles.list}>
          {donations.slice(0, 5).map((donation) => (
            <div key={donation.id} style={styles.item}>
              <div style={styles.icon}>💰</div>
              <div style={styles.details}>
                <p style={styles.itemTitle}>{donation.campaign || "General Pool"}</p>
                <p style={styles.itemDate}>{formatDate(donation.timestamp)}</p>
              </div>
              <div style={styles.amount}>${donation.amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
