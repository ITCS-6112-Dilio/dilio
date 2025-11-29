// src/components/campaigns/CampaignCard.jsx
import { formatCurrency } from '../../utils/formatUtils';
const CampaignCard = ({ campaign, editable = false, onEdit }) => {
  const percentage = Math.min((campaign.raised / campaign.goal) * 100, 100);

  const styles = {
    card: {
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px',
    },
    header: {
      marginBottom: '8px',
    },
    title: {
      fontSize: '15px',
      fontWeight: 600,
      margin: 0,
      marginBottom: '4px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    category: {
      display: 'inline-block',
      fontSize: '11px',
      padding: '2px 8px',
      background: '#e0e7ff',
      color: '#3730a3',
      borderRadius: '4px',
      marginBottom: '8px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    description: {
      fontSize: '13px',
      color: '#64748b',
      marginBottom: '12px',
      lineHeight: 1.5,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    progressBar: {
      width: '100%',
      height: '8px',
      background: '#e2e8f0',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '8px',
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
      borderRadius: '4px',
      transition: 'width 0.3s',
    },
    stats: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '13px',
    },
    statLabel: {
      color: '#64748b',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    statValue: {
      fontWeight: 600,
      color: '#0f172a',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    editBtn: {
      marginTop: 10,
      padding: '4px 14px',
      background: '#f1f5f9',
      border: '1px solid #d1d5db',
      borderRadius: 6,
      fontSize: 13,
      cursor: 'pointer',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>{campaign.name}</h3>
        <span style={styles.category}>{campaign.category}</span>
      </div>
      <p style={styles.description}>{campaign.description}</p>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${percentage}%` }} />
      </div>
      <div style={styles.stats}>
        <span style={styles.statLabel}>
          <span style={styles.statValue}>{formatCurrency(campaign.raised)}</span> raised
        </span>
        <span style={styles.statLabel}>
          Goal: <span style={styles.statValue}>{formatCurrency(campaign.goal)}</span>
        </span>
      </div>
      {editable && (
        <button
          style={styles.editBtn}
          onClick={() => onEdit && onEdit(campaign)}
        >
          Edit
        </button>
      )}
    </div>
  );
};

export default CampaignCard;
