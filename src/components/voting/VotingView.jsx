// src/components/voting/VotingView.jsx
import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentVotingSession,
  submitVote as submitVoteToDb,
  getUserVote,
  getPastVotingSessions,
} from '../../services/votingService';
import Button from '../Button';
import { useUser } from '../../context/UserContext';
import { formatCurrency, formatDateRange } from '../../utils/formatUtils';
import PastVotingResults from './PastVotingResults';

const VotingView = () => {
  const { user } = useUser();
  const [session, setSession] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [isUpdatingVote, setIsUpdatingVote] = useState(false);

  const loadVotingSession = useCallback(async () => {
    setLoading(true);
    try {
      const sessionData = await getCurrentVotingSession();
      setSession(sessionData);

      if (sessionData) {
        // Check if user has already voted and get their vote
        const userVote = await getUserVote(user.uid, sessionData.id);
        if (userVote) {
          setHasVoted(true);
          setSelectedCampaign(userVote.campaignId);
        } else {
          setHasVoted(false);
          setSelectedCampaign(null);
        }
      } else {
        setHasVoted(false);
        setSelectedCampaign(null);
      }
    } catch (error) {
      console.error('Error loading voting session:', error);
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  const loadPastSessions = useCallback(async () => {
    try {
      const past = await getPastVotingSessions(4);
      setPastSessions(past);
    } catch (error) {
      console.error('Error loading past sessions:', error);
    }
  }, []);

  useEffect(() => {
    loadVotingSession();
    loadPastSessions();
  }, [user.uid, loadVotingSession, loadPastSessions]);

  const handleSubmitVote = async () => {
    if (!selectedCampaign) {
      alert('Please select a campaign to vote for');
      return;
    }

    setSubmitting(true);
    try {
      await submitVoteToDb(user.uid, selectedCampaign, session.id);
      setHasVoted(true);
      setIsUpdatingVote(false);
      alert(
        hasVoted
          ? '✅ Vote Updated!'
          : '✅ Vote Submitted! Thank you for participating!'
      );

      // Reload session to get updated vote counts
      await loadVotingSession();
    } catch (error) {
      alert('Error submitting vote: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeVote = () => {
    setIsUpdatingVote(true);
  };

  const handleCancelChange = () => {
    setIsUpdatingVote(false);
    // Reset to original vote
    loadVotingSession();
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
    info: {
      background: '#f8fafc',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center',
    },
    infoText: {
      fontSize: '14px',
      color: '#64748b',
      marginBottom: '8px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    weekInfo: {
      fontSize: '13px',
      color: '#475569',
      marginTop: '8px',
      fontWeight: 500,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    totalVotes: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#2563eb',
      marginTop: '8px',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    options: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '20px',
    },
    option: {
      position: 'relative',
    },
    radio: {
      position: 'absolute',
      opacity: 0,
    },
    label: {
      display: 'block',
      padding: '12px',
      background: '#f8fafc',
      border: '2px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    labelDisabled: {
      cursor: 'default',
      opacity: 0.7,
    },
    labelChecked: {
      borderColor: '#2563eb',
      background: '#eff6ff',
    },
    campaignHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '4px',
    },
    campaignName: {
      fontSize: '14px',
      fontWeight: 600,
      flex: 1,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    category: {
      fontSize: '10px',
      padding: '2px 8px',
      background: '#e0e7ff',
      color: '#3730a3',
      borderRadius: '4px',
      marginLeft: '8px',
      flexShrink: 0,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    campaignDesc: {
      fontSize: '12px',
      color: '#64748b',
      marginBottom: '8px',
      lineHeight: '1.4',
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    voteCount: {
      fontSize: '12px',
      color: '#64748b',
      fontWeight: 500,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
    },
    secondaryButton: {
      flex: 1,
      padding: '12px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    changeVoteButton: {
      width: '100%',
      padding: '12px',
      background: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 600,
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      marginBottom: '20px',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.info}>
          <p style={styles.infoText}>Loading voting session...</p>
        </div>
      </div>
    );
  }

  // 1. No Active Session
  if (!session || !session.campaigns || session.campaigns.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Weekly Voting</h2>
        </div>
        <div style={styles.info}>
          <p style={styles.infoText}>
            No campaigns available for voting this week.
          </p>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
            Check back later or contact an administrator.
          </p>
        </div>
        <PastVotingResults sessions={pastSessions} />
      </div>
    );
  }

  // 2. Voted State (Locked)
  if (hasVoted && !isUpdatingVote) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Weekly Voting</h2>
        </div>
        <div style={styles.info}>
          <p style={styles.infoText}>✅ You have voted in this session!</p>
          <p style={styles.weekInfo}>
            {formatDateRange(session.startDate, session.endDate)}
          </p>
          <p style={styles.totalVotes}>
            Total Votes: {session.totalVotes || 0}
          </p>
          <p style={{ ...styles.totalVotes, color: '#059669' }}>
            Current Pool: {formatCurrency(session.poolAmount || 0)}
          </p>
        </div>

        <button style={styles.changeVoteButton} onClick={handleChangeVote}>
          Change My Vote
        </button>

        <div style={styles.options}>
          <p
            style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}
          >
            Current standings:
          </p>
          {session.campaigns
            .sort((a, b) => (b.votes || 0) - (a.votes || 0))
            .map((campaign) => {
              const percentage =
                session.totalVotes > 0
                  ? (
                      ((campaign.votes || 0) / session.totalVotes) *
                      100
                    ).toFixed(1)
                  : 0;
              const isUserVote = campaign.id === selectedCampaign;
              return (
                <div key={campaign.id} style={styles.option}>
                  <div
                    style={{
                      ...styles.label,
                      ...styles.labelDisabled,
                      ...(isUserVote
                        ? { borderColor: '#16a34a', background: '#f0fdf4' }
                        : {}),
                    }}
                  >
                    <div style={styles.campaignHeader}>
                      <div style={styles.campaignName}>
                        {campaign.name}
                        {isUserVote && ' ✓'}
                      </div>
                      <span style={styles.category}>{campaign.category}</span>
                    </div>
                    <div style={styles.campaignDesc}>
                      {campaign.description}
                    </div>
                    <div style={styles.voteCount}>
                      {campaign.votes || 0} vote
                      {campaign.votes !== 1 ? 's' : ''} ({percentage}% of pool)
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        <PastVotingResults sessions={pastSessions} />
      </div>
    );
  }

  // 3. Voting State (Active or Updating)
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Weekly Voting</h2>
      </div>

      <div style={styles.info}>
        <p style={styles.infoText}>
          {isUpdatingVote
            ? "Update your vote for this week's pooled donations"
            : "Vote for which campaign should receive this week's pooled donations"}
        </p>
        <p style={styles.weekInfo}>
          {formatDateRange(session.startDate, session.endDate)}
        </p>
        <p style={styles.totalVotes}>
          Total Votes So Far: {session.totalVotes || 0}
        </p>
        <p style={{ ...styles.totalVotes, color: '#059669' }}>
          Current Pool: {formatCurrency(session.poolAmount || 0)}
        </p>
      </div>

      <div style={styles.options}>
        {session.campaigns.map((campaign) => (
          <div key={campaign.id} style={styles.option}>
            <input
              type="radio"
              id={`campaign-${campaign.id}`}
              name="vote"
              value={campaign.id}
              checked={selectedCampaign === campaign.id}
              onChange={() => setSelectedCampaign(campaign.id)}
              style={styles.radio}
            />
            <label
              htmlFor={`campaign-${campaign.id}`}
              style={
                selectedCampaign === campaign.id
                  ? { ...styles.label, ...styles.labelChecked }
                  : styles.label
              }
            >
              <div style={styles.campaignHeader}>
                <div style={styles.campaignName}>{campaign.name}</div>
                <span style={styles.category}>{campaign.category}</span>
              </div>
              <div style={styles.campaignDesc}>{campaign.description}</div>
              <div style={styles.voteCount}>
                {campaign.votes || 0} vote{campaign.votes !== 1 ? 's' : ''}
              </div>
            </label>
          </div>
        ))}
      </div>

      {isUpdatingVote ? (
        <div style={styles.buttonGroup}>
          <button style={styles.secondaryButton} onClick={handleCancelChange}>
            Cancel
          </button>
          <Button
            onClick={handleSubmitVote}
            disabled={submitting || !selectedCampaign}
          >
            {submitting ? 'Updating...' : 'Update Vote'}
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleSubmitVote}
          disabled={submitting || !selectedCampaign}
        >
          {submitting ? 'Submitting...' : 'Submit Vote'}
        </Button>
      )}

      <PastVotingResults sessions={pastSessions} />
    </div>
  );
};

export default VotingView;
