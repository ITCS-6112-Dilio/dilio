// src/components/dashboard/BottomNav.jsx
const BottomNav = ({ currentView, onNavigate, userRole }) => {
  const styles = {
    nav: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      display: "flex",
      background: "white",
      borderTop: "1px solid #e2e8f0",
      zIndex: 1000,
    },
    btn: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "8px",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: "11px",
      transition: "background 0.2s",
    },
    icon: {
      fontSize: "20px",
      marginBottom: "4px",
    },
  };

  const navItems = [
    { id: "dashboard", icon: "🏠", label: "Home" },
    { id: "campaigns", icon: "📢", label: "Campaigns" },
    { id: "voting", icon: "🗳️", label: "Vote" },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  if (userRole === "admin") {
    navItems.push({ id: "admin", icon: "⚙️", label: "Admin" });
  }

  return (
    <nav style={styles.nav}>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          style={{
            ...styles.btn,
            color: currentView === item.id ? "#2563eb" : "#64748b",
            background: currentView === item.id ? "#f8fafc" : "transparent",
          }}
        >
          <span style={styles.icon}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
