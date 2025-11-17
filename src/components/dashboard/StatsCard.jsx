// src/components/dashboard/StatsCard.jsx
const StatsCard = ({ stats }) => {
  const styles = {
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "12px",
      marginBottom: "20px",
    },
    card: {
      background: "#f8fafc",
      padding: "16px",
      borderRadius: "8px",
      textAlign: "center",
      border: "1px solid #e2e8f0",
    },
    label: {
      display: "block",
      fontSize: "11px",
      color: "#64748b",
      marginBottom: "8px",
      textTransform: "uppercase",
    },
    value: {
      display: "block",
      fontSize: "18px",
      fontWeight: 700,
      color: "#2563eb",
    },
  };

  return (
    <div style={styles.grid}>
      <div style={styles.card}>
        <span style={styles.label}>Total Donated</span>
        <span style={styles.value}>${stats.totalDonated.toFixed(2)}</span>
      </div>
      <div style={styles.card}>
        <span style={styles.label}>Points</span>
        <span style={styles.value}>{stats.points}</span>
      </div>
      <div style={styles.card}>
        <span style={styles.label}>Streak</span>
        <span style={styles.value}>{stats.streak} 🔥</span>
      </div>
    </div>
  );
};

export default StatsCard;
