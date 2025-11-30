// src/components/campaigns/CampaignsView.jsx
import { useEffect, useState } from 'react';
import CampaignCard from './CampaignCard';
import {
  getAllCampaigns,
  getOrganizerTotalRaised,
} from '../../services/campaignService';
import { formatCurrency } from '../../utils/formatUtils';
import { useUser } from '../../context/UserContext';
import CreateCampaignView from './CreateCampaignView';

const CampaignsView = () => {
  const { user } = useUser();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [yourCampaignsStatus, setYourCampaignsStatus] = useState('pending');
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [organizerTotal, setOrganizerTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (
      activeTab === 'yours' &&
      (user.role === 'organizer' || user.role === 'admin')
    ) {
      loadOrganizerTotal();
    }
  }, [activeTab, user.uid, user.role]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, activeTab]);

  const loadCampaigns = async () => {
    try {
      const data = await getAllCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizerTotal = async () => {
    try {
      const total = await getOrganizerTotalRaised(user.uid);
      setOrganizerTotal(total);
    } catch (error) {
      console.error('Error loading organizer total:', error);
    }
  };

  const yourCampaigns = campaigns.filter((c) => c.organizerId === user.uid);
  const pendingCampaigns = yourCampaigns.filter((c) => c.status === 'pending');
  const approvedCampaigns = yourCampaigns.filter(
    (c) => c.status === 'approved'
  );
  const rejectedCampaigns = yourCampaigns.filter(
    (c) => c.status === 'rejected'
  );

  const activeCampaigns = campaigns.filter((c) => c.status === 'approved');

  const filterCampaigns = (campaignList) => {
    if (!searchQuery.trim()) return campaignList;
    const query = searchQuery.toLowerCase();
    return campaignList.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
    );
  };

  const getDisplayedCampaigns = () => {
    if (activeTab === 'active') {
      return filterCampaigns(activeCampaigns);
    }
    if (yourCampaignsStatus === 'pending')
      return filterCampaigns(pendingCampaigns);
    if (yourCampaignsStatus === 'approved')
      return filterCampaigns(approvedCampaigns);
    return filterCampaigns(rejectedCampaigns);
  };

  const displayedCampaigns = getDisplayedCampaigns();
  const totalPages = Math.ceil(displayedCampaigns.length / itemsPerPage);
  const startIdx = currentPage * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentCampaigns = displayedCampaigns.slice(startIdx, endIdx);

  const styles = {
    container: {
      padding: '20px',
      paddingBottom: '100px',
      height: '520px',
      overflowY: 'auto',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
    searchBox: {
      width: '100%',
      padding: '10px 12px',
      fontSize: '14px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      marginBottom: '16px',
      boxSizing: 'border-box',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '16px',
    },
    organizerStats: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: 'white',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '20px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    statTitle: {
      fontSize: '13px',
      opacity: 0.9,
      marginBottom: '4px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    statAmount: {
      fontSize: '28px',
      fontWeight: 700,
      marginBottom: '4px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    statSubtext: {
      fontSize: '12px',
      opacity: 0.85,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
    noResults: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#64748b',
      fontSize: '14px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    tabButton: {
      fontWeight: 400,
      borderBottom: 'none',
      background: 'none',
      border: 'none',
      fontSize: '18px',
      cursor: 'pointer',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    tabButtonActive: {
      fontWeight: 700,
      borderBottom: '2px solid #2563eb',
    },
    subTabButton: {
      fontWeight: 400,
      borderBottom: 'none',
      background: 'none',
      border: 'none',
      fontSize: '15px',
      cursor: 'pointer',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    subTabButtonActive: {
      fontWeight: 700,
      borderBottom: '2px solid #2563eb',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading campaigns...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div
        style={{
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'active' ? styles.tabButtonActive : {}),
          }}
          onClick={() => setActiveTab('active')}
        >
          Active Campaigns
        </button>
        {(user.role === 'organizer' || user.role === 'admin') && (
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'yours' ? styles.tabButtonActive : {}),
            }}
            onClick={() => setActiveTab('yours')}
          >
            Your Campaigns
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search campaigns..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={styles.searchBox}
      />

      {activeTab === 'active' && (
        <>
          {currentCampaigns.length === 0 ? (
            <div style={styles.noResults}>
              {searchQuery
                ? 'No campaigns match your search.'
                : 'No active campaigns.'}
            </div>
          ) : (
            <>
              <div style={styles.list}>
                {currentCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>

              {totalPages > 1 && (
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
                    {currentPage + 1} / {totalPages}
                  </span>

                  <button
                    style={{
                      ...styles.pageBtn,
                      ...(currentPage === totalPages - 1
                        ? styles.pageBtnDisabled
                        : {}),
                    }}
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(totalPages - 1, prev + 1)
                      )
                    }
                    disabled={currentPage === totalPages - 1}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'yours' && (
        <div>
          <div style={styles.organizerStats}>
            <div style={styles.statTitle}>
              Total Raised Across All Campaigns
            </div>
            <div style={styles.statAmount}>
              {formatCurrency(organizerTotal)}
            </div>
            <div style={styles.statSubtext}>
              {yourCampaigns.length} campaign
              {yourCampaigns.length !== 1 ? 's' : ''} created
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button
              style={{
                ...styles.subTabButton,
                ...(yourCampaignsStatus === 'pending'
                  ? styles.subTabButtonActive
                  : {}),
              }}
              onClick={() => setYourCampaignsStatus('pending')}
            >
              Pending ({pendingCampaigns.length})
            </button>
            <button
              style={{
                ...styles.subTabButton,
                ...(yourCampaignsStatus === 'approved'
                  ? styles.subTabButtonActive
                  : {}),
              }}
              onClick={() => setYourCampaignsStatus('approved')}
            >
              Approved ({approvedCampaigns.length})
            </button>
            <button
              style={{
                ...styles.subTabButton,
                ...(yourCampaignsStatus === 'rejected'
                  ? styles.subTabButtonActive
                  : {}),
              }}
              onClick={() => setYourCampaignsStatus('rejected')}
            >
              Rejected ({rejectedCampaigns.length})
            </button>
          </div>

          {yourCampaignsStatus === 'pending' && editingCampaign ? (
            <CreateCampaignView
              campaign={editingCampaign}
              userId={user.uid}
              onBack={() => setEditingCampaign(null)}
              onSave={() => {
                setEditingCampaign(null);
                loadCampaigns();
                loadOrganizerTotal();
              }}
            />
          ) : (
            <>
              {currentCampaigns.length === 0 ? (
                <div style={styles.noResults}>
                  {searchQuery
                    ? 'No campaigns match your search.'
                    : 'No campaigns in this category.'}
                </div>
              ) : (
                <>
                  <div style={styles.list}>
                    {currentCampaigns.map((c) => (
                      <CampaignCard
                        key={c.id}
                        campaign={c}
                        editable={yourCampaignsStatus === 'pending'}
                        onEdit={setEditingCampaign}
                        showDonations={true}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
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
                        {currentPage + 1} / {totalPages}
                      </span>

                      <button
                        style={{
                          ...styles.pageBtn,
                          ...(currentPage === totalPages - 1
                            ? styles.pageBtnDisabled
                            : {}),
                        }}
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages - 1, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages - 1}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignsView;
