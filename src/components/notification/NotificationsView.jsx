// src/components/notification/NotificationsView.jsx
import { useState } from "react";
import { markAllNotificationsRead } from "../../services/notificationService";

const NotificationsView = ({ userId, notifications, setNotifications, onBack }) => {
  const [showRead, setShowRead] = useState(false);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(userId);
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const displayedNotifications = showRead 
    ? notifications 
    : unreadNotifications;

  const styles = {
    container: {
      padding: "20px",
      paddingBottom: "100px",
      height: "520px",
      overflowY: "auto",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    header: {
      fontWeight: 600,
      fontSize: "18px",
      marginBottom: "16px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    toggleContainer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
      padding: "12px",
      background: "#f8fafc",
      borderRadius: "8px",
    },
    toggleLabel: {
      fontSize: "13px",
      color: "#64748b",
      fontWeight: 500,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    toggleSwitch: {
      position: "relative",
      width: "48px",
      height: "24px",
      background: showRead ? "#2563eb" : "#e2e8f0",
      borderRadius: "12px",
      cursor: "pointer",
      transition: "background 0.3s",
    },
    toggleKnob: {
      position: "absolute",
      top: "2px",
      left: showRead ? "26px" : "2px",
      width: "20px",
      height: "20px",
      background: "white",
      borderRadius: "50%",
      transition: "left 0.3s",
      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    },
    notification: {
      background: "#eff6ff",
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "12px",
      fontSize: "14px",
      color: "#334155",
      boxShadow: "0 1px 3px rgba(37,99,235,0.08)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      border: "1px solid #bfdbfe",
    },
    notificationRead: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      opacity: 0.7,
    },
    notificationMessage: {
      marginBottom: "6px",
      lineHeight: "1.4",
    },
    timestamp: {
      fontSize: "11px",
      color: "#64748b",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    backBtn: {
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      background: "#2563eb",
      color: "white",
      border: "none",
      marginTop: "16px",
      fontWeight: 600,
      fontSize: "14px",
      cursor: "pointer",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    readBtn: {
      width: "100%",
      background: "#f1f5f9",
      color: "#475569",
      border: "none",
      padding: "10px",
      borderRadius: "8px",
      fontWeight: 600,
      fontSize: "14px",
      cursor: "pointer",
      marginBottom: "12px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    emptyState: {
      textAlign: "center",
      padding: "40px 20px",
      color: "#64748b",
      fontSize: "14px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    badge: {
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "12px",
      fontSize: "11px",
      fontWeight: 600,
      marginLeft: "8px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    unreadBadge: {
      background: "#ef4444",
      color: "white",
    },
    readBadge: {
      background: "#e2e8f0",
      color: "#64748b",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        Notifications
        {unreadNotifications.length > 0 && (
          <span style={{...styles.badge, ...styles.unreadBadge}}>
            {unreadNotifications.length} new
          </span>
        )}
      </div>

      <div style={styles.toggleContainer}>
        <span style={styles.toggleLabel}>
          {showRead ? "Showing all notifications" : "Showing unread only"}
        </span>
        <div 
          style={styles.toggleSwitch}
          onClick={() => setShowRead(!showRead)}
        >
          <div style={styles.toggleKnob} />
        </div>
      </div>

      {unreadNotifications.length > 0 && (
        <button style={styles.readBtn} onClick={handleMarkAllRead}>
          Mark All as Read
        </button>
      )}

      {displayedNotifications.length === 0 ? (
        <div style={styles.emptyState}>
          {showRead 
            ? "No notifications yet!" 
            : "No unread notifications"}
        </div>
      ) : (
        displayedNotifications.map(n => (
          <div 
            key={n.id}
            style={n.read 
              ? {...styles.notification, ...styles.notificationRead}
              : styles.notification
            }
          >
            <div style={styles.notificationMessage}>{n.message}</div>
            <div style={styles.timestamp}>
              {n.timestamp
                ? new Date((n.timestamp.seconds ? n.timestamp.seconds * 1000 : n.timestamp)).toLocaleString()
                : ""}
            </div>
          </div>
        ))
      )}

      <button style={styles.backBtn} onClick={onBack}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default NotificationsView;