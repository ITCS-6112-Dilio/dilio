// src/components/admin/AdminView.jsx
import { useState, useEffect } from "react";
import { getPendingCampaigns, approveCampaign, rejectCampaign, getWeeklyReport } from "../../services/donationService";
import Button from "../Button";

const AdminView = ({ onBack }) => {
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [activeTab, setActiveTab] = useState("campaigns");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const campaigns = await getPendingCampaigns();
      setPendingCampaigns(campaigns);
      const reports = await getWeeklyReport();
      setWeeklyReports(reports);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (campaignId) => {
    try {
      await approveCampaign(campaignId);
      alert("Campaign approved!");
      loadData();
    } catch (error) {
      alert("Error approving campaign: " + error.message);
    }
  };

  const handleReject = async (campaignId) => {
    if (window.confirm("Are you sure you want to reject this campaign?")) {
      try {
        await rejectCampaign(campaignId);
        alert("Campaign rejected");
        loadData();
      } catch (error) {
        alert("Error rejecting campaign: " + error.message);
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
    tabs: {
      display: "flex",
      gap: "8px",
      marginBottom: "20px",
      borderBottom: "1px solid #e2e8f0",
    },
    tab: {
      padding: "8px 16px",
      background: "none",
      border: "none",
      borderBottom: "2px solid transparent",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 500,
      color: "#64748b",
    },
    activeTab: {
      color: "#2563eb",
      borderBottomColor: "#2563eb",
    },
    campaignCard: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "12px",
    },
    campaignTitle: {
      fontSize: "15px",
      fontWeight: 600,
      marginBottom: "8px",
    },
    campaignDesc: {
      fontSize: "13px",
      color: "#64748b",
      marginBottom: "12px",
    },
    campaignMeta: {
      fontSize: "12px",
      color: "#64748b",
      marginBottom: "12px",
    },
    buttonGroup: {
      display: "flex",
      gap: "8px",
    },
    approveBtn: {
      flex: 1,
      padding: "8px",
      background: "#10b981",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 600,
    },
    rejectBtn: {
      flex: 1,
      padding: "8px",
      background: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 600,
    },
    reportCard: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "16px",
      marginBottom: "12px",
    },
    noData: {
      textAlign: "center",
      color: "#64748b",
      padding: "20px",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.noData}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Admin Panel</h2>
      </div>

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "campaigns" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("campaigns")}
        >
          Pending Campaigns ({pendingCampaigns.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === "reports" ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab("reports")}
        >
          Weekly Reports
        </button>
      </div>

      {activeTab === "campaigns" && (
        <div>
          {pendingCampaigns.length === 0 ? (
            <p style={styles.noData}>No pending campaigns</p>
          ) : (
            pendingCampaigns.map((campaign) => (
              <div key={campaign.id} style={styles.campaignCard}>
                <div style={styles.campaignTitle}>{campaign.name}</div>
                <div style={styles.campaignDesc}>{campaign.description}</div>
                <div style={styles.campaignMeta}>
                  Goal: \\ | Category: {campaign.category}
                </div>
                <div style={styles.buttonGroup}>
                  <button
                    style={styles.approveBtn}
                    onClick={() => handleApprove(campaign.id)}
                  >
                    Approve
                  </button>
                  <button
                    style={styles.rejectBtn}
                    onClick={() => handleReject(campaign.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "reports" && (
        <div>
          {weeklyReports.length === 0 ? (
            <p style={styles.noData}>No weekly reports yet</p>
          ) : (
            weeklyReports.map((report) => (
              <div key={report.id} style={styles.reportCard}>
                <div style={styles.campaignTitle}>Week {report.weekId}</div>
                <div style={styles.campaignDesc}>
                  Winner: {report.winnerId}
                  <br />
                  Total Amount: \\
                  <br />
                  Closed: {new Date(report.closedAt?.seconds * 1000).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Button variant="secondary" onClick={onBack} style={{ marginTop: "20px" }}>
        Back to Dashboard
      </Button>
    </div>
  );
};

export default AdminView;
