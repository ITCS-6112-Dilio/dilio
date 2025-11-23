// src/components/profile/ProfileView.jsx
import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import { getPendingRoleRequests, requestOrganizerRole, updateUserRole } from "../../services/userService";
import Input from "../Input";
import Button from "../Button";
import { useUser } from "../../context/UserContext";
import { auth, db } from "../../services/firebase";
import { doc, updateDoc } from "firebase/firestore";

const ProfileView = ({ onLogout }) => {
  const { user, setUser } = useUser();
  const [ displayName, setDisplayName ] = useState(user.displayName || "");
  const [ loading, setLoading ] = useState(false);
  const [ requestReason, setRequestReason ] = useState("");
  const [ pendingRequest, setPendingRequest ] = useState(null);

  useEffect(() => {
    if (user.role === "student") {
      checkPendingRequest();
    }
  }, [ user.uid, user.role ]);

  const checkPendingRequest = async () => {
    try {
      const roleRequests = await getPendingRoleRequests();
      const existingRoleRequest = roleRequests.find(r => r.userId === user.uid);
      setPendingRequest(existingRoleRequest);
    } catch (error) {
      console.error("Error fetching pending role request:", error);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      alert("Please enter a display name");
      return;
    }

    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim()
      });
      setUser(prev => ({ ...prev, displayName: displayName.trim() }));
      alert("✅ Profile updated successfully!");
    } catch (error) {
      alert("Error updating profile: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOrganizer = async () => {
    if (!requestReason.trim()) {
      alert("Please provide a reason for your request");
      return;
    }

    setLoading(true);
    try {
      await requestOrganizerRole(user.uid, requestReason);
      alert("✅ Organizer request submitted! An admin will review it.");
      setRequestReason("");
      checkPendingRequest();
    } catch (error) {
      alert("Error submitting request: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (window.confirm("Make yourself an admin? (Dev only)")) {
      try {
        await updateUserRole(user.uid, "admin");
        setUser(prev => ({ ...prev, role: "admin" }));
        alert("✅ You are now an admin!");
      } catch (error) {
        alert("Error: " + error.message);
      }
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
    section: {
      marginBottom: "20px",
    },
    label: {
      display: "block",
      fontSize: "13px",
      fontWeight: 500,
      marginBottom: "6px",
      color: "#64748b",
    },
    info: {
      fontSize: "14px",
      padding: "10px 12px",
      background: "#f8fafc",
      borderRadius: "6px",
      border: "1px solid #e2e8f0",
    },
    roleBadge: {
      display: "inline-block",
      fontSize: "12px",
      padding: "4px 12px",
      background: "#e0e7ff",
      color: "#3730a3",
      borderRadius: "12px",
      textTransform: "uppercase",
      fontWeight: 600,
    },
    textarea: {
      width: "100%",
      minHeight: "60px",
      padding: "8px",
      borderRadius: 4,
      border: "1px solid #ccc",
      fontSize: "14px",
      fontFamily: "inherit",
      boxSizing: "border-box",
      resize: "vertical",
      background: pendingRequest ? "#f1f5f9" : "white",
      cursor: pendingRequest ? "not-allowed" : "text",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Profile</h2>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Email</label>
        <div style={styles.info}>{user.email}</div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Current Role</label>
        <div>
          <span style={styles.roleBadge}>{user.role}</span>
        </div>
      </div>

      <div style={styles.section}>
        <Input
          label="Display Name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      <Button onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>

      {user.role === "student" && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "8px", fontWeight: 600 }}>
            Request Organizer Role
          </h3>
          <textarea
            style={styles.textarea}
            value={
              pendingRequest
                ? `You have already requested for "${pendingRequest.requestedRole}" at ${new Date(pendingRequest.createdAt.seconds * 1000).toLocaleString()}. Please contact admins for urgent requests.`
                : requestReason
            }
            onChange={e => setRequestReason(e.target.value)}
            placeholder="Why do you want to become an organizer?"
            readOnly={!!pendingRequest}
          />
          <Button
            variant="secondary"
            onClick={handleRequestOrganizer}
            style={{ marginTop: "10px" }}
            disabled={!!pendingRequest || loading}
          >
            {pendingRequest ? "Request Pending" : loading ? "Submitting..." : "Request Organizer Role"}
          </Button>
        </div>
      )}

      <div style={{ marginTop: "20px", padding: "12px", background: "#fef3c7", borderRadius: "8px" }}>
        <p style={{ fontSize: "12px", margin: 0, marginBottom: "8px" }}>
          <strong>Dev Mode:</strong> Test different roles
        </p>
        <Button variant="warning" onClick={handleMakeAdmin} style={{ marginBottom: "8px" }}>
          Make Me Admin (Dev)
        </Button>
        <Button variant="info" style={{ marginTop: "8px" }} onClick={async () => {
          await updateUserRole(user.uid, "student");
          setUser(prev => ({ ...prev, role: "student" }));
          alert("✅ You are now a student!");
        }}>
          Make Me Student (Dev)
        </Button>
        <Button variant="info" onClick={async () => {
          await updateUserRole(user.uid, "organizer");
          setUser(prev => ({ ...prev, role: "organizer" }));
          alert("✅ You are now an organizer!");
        }}>
          Make Me Organizer (Dev)
        </Button>
      </div>

      <Button variant="danger" onClick={onLogout} style={{ marginTop: "20px" }}>
        Logout
      </Button>
    </div>
  );
};

export default ProfileView;
