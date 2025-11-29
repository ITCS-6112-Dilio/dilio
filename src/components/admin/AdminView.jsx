// src/components/admin/AdminView.jsx
import { useEffect, useState } from 'react';
import {
  approveRoleRequest,
  getAllUsers,
  getPendingRoleRequests,
  getUserById,
  getWeeklyReport,
  rejectRoleRequest,
  updateUserRole,
} from '../../services/userService';
import { formatCurrency, formatDateRange } from '../../utils/formatUtils';
import Button from '../Button';
import { useUser } from '../../context/UserContext';
import {
  approveCampaign,
  getPendingCampaigns,
  rejectCampaign,
} from '../../services/campaignService';

const AdminView = ({ onBack }) => {
  const { user } = useUser();
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [loading, setLoading] = useState(true);
  const [roleChanges, setRoleChanges] = useState({});
  const [expandedReports, setExpandedReports] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  const toggleReport = (reportId) => {
    setExpandedReports((prev) => ({
      ...prev,
      [reportId]: !prev[reportId],
    }));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const campaigns = await getPendingCampaigns();
      setPendingCampaigns(campaigns);

      const roleRequests = await getPendingRoleRequests();
      const enrichedRoleRequests = await Promise.all(
        roleRequests.map(async (roleRequest) => {
          const user = await getUserById(roleRequest.userId);
          return { ...roleRequest, user };
        })
      );
      setRoleRequests(enrichedRoleRequests);

      const users = await getAllUsers();
      setAllUsers(users);

      const reports = await getWeeklyReport();
      setWeeklyReports(reports);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (campaignId) => {
    try {
      await approveCampaign(campaignId);
      alert('Campaign approved!');
      loadData();
    } catch (error) {
      alert('Error approving campaign: ' + error.message);
    }
  };

  const handleReject = async (campaignId) => {
    if (window.confirm('Are you sure you want to reject this campaign?')) {
      try {
        await rejectCampaign(campaignId);
        alert('Campaign rejected');
        loadData();
      } catch (error) {
        alert('Error rejecting campaign: ' + error.message);
      }
    }
  };

  const handleApproveRole = async (req) => {
    try {
      await approveRoleRequest(req.id, req.userId, req.requestedRole);
      alert('Role request approved');
      loadData();
    } catch (e) {
      alert('Error approving role: ' + e.message);
    }
  };

  const handleRejectRole = async (reqId) => {
    try {
      await rejectRoleRequest(reqId);
      alert('Role request rejected');
      loadData();
    } catch (e) {
      alert('Error rejecting role: ' + e.message);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    setRoleChanges((prev) => ({ ...prev, [userId]: newRole }));
  };

  const handleSaveRole = async (user) => {
    const newRole = roleChanges[user.id];
    if (!newRole || newRole === user.role) return;
    try {
      await updateUserRole(user.id, newRole);
      alert('User role updated!');
      loadData();
      setRoleChanges((prev) => {
        const updated = { ...prev };
        delete updated[user.id];
        return updated;
      });
    } catch (e) {
      alert('Failed to update role: ' + e.message);
    }
  };

  const styles = {
    container: {
      padding: '20px',
      paddingBottom: '100px',
      height: '520px',
      overflowY: 'auto',
    },
    header: {
      marginBottom: '20px',
    },
    title: {
      fontSize: '18px',
      fontWeight: 600,
      margin: 0,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    tabs: {
      display: 'flex',
      gap: '8px',
      marginBottom: '20px',
      borderBottom: '1px solid #e2e8f0',
    },
    tab: {
      padding: '8px 16px',
      background: 'none',
      border: 'none',
      borderBottom: '2px solid transparent',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      color: '#64748b',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    activeTab: {
      color: '#2563eb',
      borderBottomColor: '#2563eb',
    },
    campaignCard: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
    },
    campaignTitle: {
      fontSize: '15px',
      fontWeight: 600,
      marginBottom: '8px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    campaignDesc: {
      fontSize: '13px',
      color: '#64748b',
      marginBottom: '12px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    campaignMeta: {
      fontSize: '12px',
      color: '#64748b',
      marginBottom: '12px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    buttonGroup: {
      display: 'flex',
      gap: '8px',
    },
    approveBtn: {
      flex: 1,
      padding: '8px',
      background: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 600,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    rejectBtn: {
      flex: 1,
      padding: '8px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 600,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    reportCard: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px',
    },
    noData: {
      textAlign: 'center',
      color: '#64748b',
      padding: '20px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    roleCard: {
      background: '#f1f5f9',
      border: '1px solid #cbd5e1',
      borderRadius: '10px',
      padding: '16px',
      marginBottom: '12px',
    },
    roleTitle: {
      fontSize: '15px',
      fontWeight: 600,
      marginBottom: '6px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    roleDetails: {
      fontSize: '13px',
      color: '#475569',
      marginBottom: '10px',
      lineHeight: '1.5',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    backBtn: {
      width: '100%',
      padding: '10px',
      borderRadius: '8px',
      background: '#2563eb',
      color: 'white',
      border: 'none',
      marginTop: '16px',
      fontWeight: 600,
      fontSize: '14px',
      cursor: 'pointer',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    reportHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
    },
    reportHeaderContent: {
      flex: 1,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    reportTitle: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#1e293b',
    },
    reportMeta: {
      fontSize: '13px',
      color: '#64748b',
    },
    toggleIcon: {
      marginRight: '12px',
      color: '#64748b',
      fontSize: '12px',
    },
    reportDetails: {
      borderTop: '1px solid #e2e8f0',
      paddingTop: '16px',
      marginTop: '16px',
    },
    winnerSection: {
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '8px',
      padding: '12px',
      marginTop: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    winnerIcon: {
      fontSize: '20px',
    },
    winnerText: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#166534',
    },
    breakdownTable: {
      width: '100%',
      fontSize: '13px',
      borderCollapse: 'collapse',
    },
    breakdownHeader: {
      textAlign: 'left',
      padding: '8px',
      color: '#64748b',
      fontWeight: 500,
      borderBottom: '1px solid #e2e8f0',
    },
    breakdownCell: {
      padding: '8px',
      borderBottom: '1px solid #f1f5f9',
      color: '#334155',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      marginTop: '16px',
    },
    pageBtn: {
      padding: '8px 16px',
      fontSize: '13px',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      background: '#ffffff',
      color: '#64748b',
      cursor: 'pointer',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      transition: 'all 0.2s',
      fontWeight: 500,
    },
    pageBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    pageInfo: {
      fontSize: '13px',
      color: '#64748b',
      fontWeight: 500,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
    <div style={styles.container} >
      <div style={styles.header}>
        <h2 style={styles.title}>Admin Panel</h2>
      </div>

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'campaigns' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('campaigns')}
        >
          Pending Campaigns ({pendingCampaigns.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'roles' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('roles')}
        >
          User Roles & Role Requests ({roleRequests.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'reports' ? styles.activeTab : {}),
          }}
          onClick={() => setActiveTab('reports')}
        >
          Weekly Reports
        </button>
      </div>

      {activeTab === 'campaigns' && (
        <div>
          {pendingCampaigns.length === 0 ? (
            <p style={styles.noData}>No pending campaigns</p>
          ) : (
            pendingCampaigns.map((campaign) => (
              <div key={campaign.id} style={styles.campaignCard}>
                <div style={styles.campaignTitle}>{campaign.name}</div>
                <div style={styles.campaignDesc}>{campaign.description}</div>
                <div style={styles.campaignMeta}>
                  Raised: {formatCurrency(campaign.raised)} <br />
                  Goal: {formatCurrency(campaign.goal)} <br />
                  Category: {campaign.category}
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
      )
      }

      {
        activeTab === 'roles' && (
          <div>
            {roleRequests.length === 0 ? (
              <p style={styles.noData}>No pending role requests</p>
            ) : (
              roleRequests.map((req) => {
                const user = req.user;
                const displayName = user?.displayName;
                const email = user?.email;
                const currentRole = user?.role || 'user';

                return (
                  <div key={req.id} style={styles.roleCard}>
                    <div style={styles.roleTitle}>
                      {displayName ? (
                        <>
                          {displayName}{' '}
                          <span style={{ color: '#334155' }}>
                            &lt;{email}&gt;
                          </span>
                        </>
                      ) : (
                        email
                      )}
                    </div>

                    <div style={styles.roleDetails}>
                      <b>Current Role:</b> {currentRole} <br />
                      <b>Requested Role:</b> {req.requestedRole} <br />
                      <b>Reason:</b> {req.reason || '—'} <br />
                      <b>Requested At:</b>{' '}
                      {req.createdAt?.seconds
                        ? new Date(req.createdAt.seconds * 1000).toLocaleString()
                        : new Date(req.createdAt).toLocaleString()}
                    </div>

                    <div style={styles.buttonGroup}>
                      <button
                        style={styles.approveBtn}
                        onClick={() =>
                          handleApproveRole({
                            id: req.id,
                            userId: req.userId,
                            requestedRole: req.requestedRole,
                          })
                        }
                      >
                        Approve
                      </button>

                      <button
                        style={styles.rejectBtn}
                        onClick={() => handleRejectRole(req.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/*  new code start here */}
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                Manage User Roles
              </h3>
              {allUsers.length === 0 ? (
                <p className="noData">No users found</p>
              ) : (
                <table
                  style={{
                    width: '100%',
                    fontSize: 13,
                    borderCollapse: 'collapse',
                  }}
                >
                  <thead>
                    <tr>
                      <th align="left">Name / Email</th>
                      <th align="left">Current Role</th>
                      <th align="left">Assign Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers
                      .filter((u) => u.id !== user.uid)
                      .map((user) => (
                        <tr
                          key={user.id}
                          style={{ borderBottom: '1px solid #e2e8f0' }}
                        >
                          <td>
                            {user.displayName ? (
                              <>
                                {user.displayName}
                                <br />
                                <span style={{ color: '#475569' }}>
                                  {user.email}
                                </span>
                              </>
                            ) : (
                              user.email
                            )}
                          </td>
                          <td>{user.role}</td>
                          <td>
                            <select
                              value={roleChanges[user.id] || ''}
                              onChange={(e) =>
                                handleRoleChange(user.id, e.target.value)
                              }
                              style={{ marginRight: 8 }}
                            >
                              <option value="" disabled>
                                Select Role
                              </option>
                              {['student', 'organizer', 'admin']
                                .filter((role) => role !== user.role)
                                .map((role) => (
                                  <option key={role} value={role}>
                                    {role}
                                  </option>
                                ))}
                            </select>
                            <button
                              className={roleChanges[user.id] ? 'approveBtn' : ''}
                              style={{
                                padding: '4px 12px',
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                background: roleChanges[user.id]
                                  ? '#2563eb'
                                  : '#e2e8f0',
                                color: roleChanges[user.id] ? '#fff' : '#64748b',
                              }}
                              disabled={!roleChanges[user.id]}
                              onClick={() => handleSaveRole(user)}
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
            {/*  new code end here */}
          </div>
        )
      }

      {
        activeTab === 'reports' && (
          <div>
            {weeklyReports.length === 0 ? (
              <p style={styles.noData}>No weekly reports yet</p>
            ) : (
              <>
                {weeklyReports
                  .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
                  .map((report) => (
                    <div key={report.id} style={styles.reportCard}>
                      <div
                        style={styles.reportHeader}
                        onClick={() => toggleReport(report.id)}
                      >
                        <div style={styles.toggleIcon}>
                          {expandedReports[report.id] ? '▼' : '►'}
                        </div>
                        <div style={styles.reportHeaderContent}>
                          <div>
                            <div style={styles.reportTitle}>
                              {report.startDate && report.endDate
                                ? formatDateRange(report.startDate, report.endDate)
                                : `Week ${report.weekId}`}
                            </div>
                            <div style={styles.reportMeta}>
                              Closed:{' '}
                              {report.closedAt?.seconds
                                ? new Date(
                                  report.closedAt.seconds * 1000
                                ).toLocaleDateString()
                                : new Date(report.closedAt).toLocaleDateString()}
                            </div>

                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#2563eb',
                              }}
                            >
                              {formatCurrency(report.totalAmount || 0)}
                            </div>
                            <div style={styles.reportMeta}>
                              {report.totalVotes || 0} Votes
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={styles.winnerSection}>
                        <span style={styles.winnerIcon}>🏆</span>
                        <div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#166534',
                              fontWeight: 500,
                            }}
                          >
                            WINNER
                          </div>
                          <div style={styles.winnerText}>
                            {report.winnerName || 'Unknown Campaign'}
                          </div>
                        </div>
                      </div>

                      {expandedReports[report.id] && (
                        <div style={styles.reportDetails}>
                          {report.campaigns && report.campaigns.length > 0 && (
                            <div>
                              <div
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  marginBottom: '8px',
                                  color: '#475569',
                                }}
                              >
                                Vote Breakdown
                              </div>
                              <table style={styles.breakdownTable}>
                                <thead>
                                  <tr>
                                    <th style={styles.breakdownHeader}>Campaign</th>
                                    <th style={styles.breakdownHeader}>Votes</th>
                                    <th style={styles.breakdownHeader}>%</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {report.campaigns
                                    .sort(
                                      (a, b) => (b.votes || 0) - (a.votes || 0)
                                    )
                                    .map((campaign) => {
                                      const percentage =
                                        report.totalVotes > 0
                                          ? (
                                            ((campaign.votes || 0) /
                                              report.totalVotes) *
                                            100
                                          ).toFixed(1)
                                          : 0;
                                      return (
                                        <tr key={campaign.id}>
                                          <td style={styles.breakdownCell}>
                                            {campaign.name}
                                            {campaign.id === report.winnerId &&
                                              ' 🏆'}
                                          </td>
                                          <td style={styles.breakdownCell}>
                                            {campaign.votes || 0}
                                          </td>
                                          <td style={styles.breakdownCell}>
                                            {percentage}%
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                {Math.ceil(weeklyReports.length / itemsPerPage) > 1 && (
                  <div style={styles.pagination}>
                    <button
                      style={{
                        ...styles.pageBtn,
                        ...(currentPage === 0 ? styles.pageBtnDisabled : {}),
                      }}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(0, prev - 1))
                      }
                      disabled={currentPage === 0}
                    >
                      ← Prev
                    </button>

                    <span style={styles.pageInfo}>
                      {currentPage + 1} /{' '}
                      {Math.ceil(weeklyReports.length / itemsPerPage)}
                    </span>

                    <button
                      style={{
                        ...styles.pageBtn,
                        ...(currentPage ===
                          Math.ceil(weeklyReports.length / itemsPerPage) - 1
                          ? styles.pageBtnDisabled
                          : {}),
                      }}
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(
                            Math.ceil(weeklyReports.length / itemsPerPage) - 1,
                            prev + 1
                          )
                        )
                      }
                      disabled={
                        currentPage ===
                        Math.ceil(weeklyReports.length / itemsPerPage) - 1
                      }
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )
      }

      <Button variant="secondary" onClick={onBack} style={styles.backBtn}>
        Back to Dashboard
      </Button>
    </div >
  );
};

export default AdminView;
