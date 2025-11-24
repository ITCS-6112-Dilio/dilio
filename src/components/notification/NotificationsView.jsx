// src/components/notifications/NotificationsView.jsx
import { markAllNotificationsRead } from "../../services/notificationService";

const NotificationsView = ({ userId, notifications, setNotifications, onBack }) => {
  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(userId);
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const styles = {
    container: {
      padding: "24px",
      maxWidth: 480,
      margin: "28px auto",
      background: "white",
      borderRadius: 14,
      minHeight: 300,
      boxShadow: "0 3px 18px rgba(0,0,0,0.12)",
    },
    header: {
      fontWeight: 600,
      fontSize: 22,
      marginBottom: 24,
      textAlign: "center",
      letterSpacing: "0.5px",
    },
    notification: {
      background: "#dbeafe",
      borderRadius: 8,
      padding: "13px",
      marginBottom: 12,
      fontSize: 14,
      color: "#334155",
      boxShadow: "0 2px 12px rgba(37,99,235,0.04)",
    },
    timestamp: {
      fontSize: 11,
      color: "#64748b",
      marginTop: 6,
    },
    backBtn: {
      width: "100%",
      padding: "10px",
      borderRadius: 8,
      background: "#2563eb",
      color: "white",
      border: "none",
      marginTop: 16,
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer",
    },
    readBtn: {
      width: "100%",
      background: "#e5e7eb",
      color: "#374151",
      border: "none",
      padding: "8px",
      borderRadius: 6,
      fontWeight: 600,
      cursor: "pointer",
      marginTop: 10,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>Notifications</div>
      {notifications.length === 0 && (
        <div style={{ color: "#64748b", fontSize: 15, textAlign: "center" }}>
          No notifications yet!
        </div>
      )}
      {notifications.map(n => (
        <div key={n.id}
             style={{
               ...styles.notification,
               opacity: n.read ? 0.72 : 1,
               background: n.read ? "#f1f5f9" : "#dbeafe",
             }}>
          <div>{n.message}</div>
          <div style={styles.timestamp}>
            {n.timestamp
              ? new Date((n.timestamp.seconds ? n.timestamp.seconds * 1000 : n.timestamp)).toLocaleString()
              : ""}
          </div>
        </div>
      ))}
      <button style={styles.readBtn} onClick={handleMarkAllRead}>
        Mark All as Read
      </button>
      <button style={styles.backBtn} onClick={onBack}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default NotificationsView;
