import React, { useState } from 'react';
import { formatDateRange } from '../../utils/formatUtils';

const PastVotingResults = ({ sessions }) => {
    const [expandedSessions, setExpandedSessions] = useState([]);

    const toggleSession = (sessionId) => {
        setExpandedSessions((prev) =>
            prev.includes(sessionId)
                ? prev.filter((id) => id !== sessionId)
                : [...prev, sessionId]
        );
    };

    const styles = {
        historyToggle: {
            width: '100%',
            padding: '10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            color: '#475569',
            marginBottom: '20px',
            marginTop: '20px',
            textAlign: 'center',
            fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        historySection: {
            marginTop: '20px',
            marginBottom: '20px',
        },
        historyTitle: {
            fontSize: '15px',
            fontWeight: 600,
            marginBottom: '12px',
            color: '#0f172a',
            fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        historyCard: {
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
        },
        historyWeek: {
            fontSize: '13px',
            fontWeight: 600,
            color: '#475569',
            fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        distributionItem: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            borderBottom: '1px solid #e2e8f0',
        },
        distributionItemLast: {
            borderBottom: 'none',
        },
        distributionName: {
            fontSize: '12px',
            color: '#0f172a',
            flex: 1,
            fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        distributionBar: {
            flex: 2,
            height: '6px',
            background: '#e2e8f0',
            borderRadius: '3px',
            margin: '0 8px',
            overflow: 'hidden',
        },
        distributionFill: {
            height: '100%',
            background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
            borderRadius: '3px',
        },
        distributionPercent: {
            fontSize: '12px',
            fontWeight: 600,
            color: '#2563eb',
            minWidth: '60px',
            textAlign: 'right',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
    };

    const [showHistory, setShowHistory] = useState(false);

    if (!sessions || sessions.length === 0) return null;

    return (
        <>
            <button
                style={styles.historyToggle}
                onClick={() => setShowHistory(!showHistory)}
            >
                {showHistory ? '▼' : '►'} Past Voting Results
            </button>

            {showHistory && (
                <div style={styles.historySection}>
                    <h3 style={styles.historyTitle}>Previous Weeks</h3>
                    {sessions.map((pastSession) => {
                        const isExpanded = expandedSessions.includes(pastSession.id);
                        return (
                            <div key={pastSession.id} style={styles.historyCard}>
                                <div
                                    style={{
                                        ...styles.historyWeek,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: isExpanded ? '8px' : '0',
                                    }}
                                    onClick={() => toggleSession(pastSession.id)}
                                >
                                    <span>
                                        {isExpanded ? '▼ ' : '► '}
                                        {formatDateRange(pastSession.startDate, pastSession.endDate)}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        Total Votes: {pastSession.totalVotes || 0}
                                    </span>
                                </div>
                                {isExpanded &&
                                    pastSession.campaigns &&
                                    pastSession.campaigns
                                        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                                        .map((campaign, idx) => {
                                            const percentage =
                                                pastSession.totalVotes > 0
                                                    ? (
                                                        ((campaign.votes || 0) / pastSession.totalVotes) *
                                                        100
                                                    ).toFixed(1)
                                                    : 0;
                                            const isLast = idx === pastSession.campaigns.length - 1;
                                            return (
                                                <div
                                                    key={campaign.id}
                                                    style={
                                                        isLast
                                                            ? {
                                                                ...styles.distributionItem,
                                                                ...styles.distributionItemLast,
                                                            }
                                                            : styles.distributionItem
                                                    }
                                                >
                                                    <div style={styles.distributionName}>
                                                        {campaign.name}
                                                    </div>
                                                    <div style={styles.distributionBar}>
                                                        <div
                                                            style={{
                                                                ...styles.distributionFill,
                                                                width: `${percentage}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={styles.distributionPercent}>
                                                        <div>{campaign.votes || 0} votes</div>
                                                        <div style={{ fontSize: '11px', fontWeight: 400, color: '#64748b' }}>
                                                            ({percentage}%)
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};

export default PastVotingResults;
