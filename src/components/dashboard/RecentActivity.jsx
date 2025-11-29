// src/components/dashboard/RecentActivity.jsx
import { useEffect, useState } from 'react';
import { formatCurrency } from '../../utils/formatUtils';

const RecentActivity = ({ donations = [], onDelete, onEdit }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(donations.length / itemsPerPage);
  const startIdx = currentPage * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const currentDonations = donations.slice(startIdx, endIdx);

  const styles = {
    section: {
      marginBottom: '20px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    title: {
      fontSize: '14px',
      marginBottom: '12px',
      color: '#64748b',
      fontWeight: 600,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
    },
    icon: {
      fontSize: '24px',
      marginRight: '12px',
    },
    details: {
      flex: 1,
    },
    itemTitle: {
      fontSize: '14px',
      fontWeight: 500,
      marginBottom: '4px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    itemDate: {
      fontSize: '12px',
      color: '#64748b',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    amount: {
      fontWeight: 600,
      color: '#10b981',
      marginRight: '8px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    actions: {
      display: 'flex',
      gap: '4px',
    },
    actionBtn: {
      padding: '4px 8px',
      fontSize: '11px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      background: '#e2e8f0',
      color: '#64748b',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    deleteBtn: {
      background: '#fee2e2',
      color: '#dc2626',
    },
    noData: {
      textAlign: 'center',
      color: '#64748b',
      fontSize: '14px',
      padding: '20px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    pagination: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      marginTop: '12px',
    },
    pageBtn: {
      padding: '6px 12px',
      fontSize: '12px',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      background: '#ffffff',
      color: '#64748b',
      cursor: 'pointer',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      transition: 'all 0.2s',
    },
    pageBtnActive: {
      background: '#2563eb',
      color: 'white',
      borderColor: '#2563eb',
    },
    pageBtnDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    pageInfo: {
      fontSize: '12px',
      color: '#64748b',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
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
        <>
          <div style={styles.list}>
            {currentDonations.map((donation) => {
              return (
                <div key={donation.id} style={styles.item}>
                  <div style={styles.icon}>💰</div>
                  <div style={styles.details}>
                    <p style={styles.itemTitle}>
                      {donation.campaign || 'General Pool'}
                    </p>
                    <p style={styles.itemDate}>
                      {formatDate(donation.timestamp)}
                    </p>
                  </div>
                  <div style={styles.amount}>
                    {formatCurrency(donation.amount)}
                  </div>
                  <div style={styles.actions}>
                    {donation.canEdit && (
                      <button
                        style={styles.actionBtn}
                        onClick={() => onEdit(donation)}
                      >
                        Edit
                      </button>
                    )}
                    {donation.canDelete && (
                      <button
                        style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                        onClick={() => onDelete(donation.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button
                style={{
                  ...styles.pageBtn,
                  ...(currentPage === 0 ? styles.pageBtnDisabled : {}),
                }}
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
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
                  setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
                disabled={currentPage === totalPages - 1}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RecentActivity;
