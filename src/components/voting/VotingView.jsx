// src/components/voting/VotingView.jsx
import { useState, useEffect } from "react";
import { getCurrentVotingSession, submitVote as submitVoteToDb, getUserVote, getPastVotingSessions } from "../../services/votingService";
import Button from "../Button";
import { useUser } from "../../context/UserContext";

const VotingView = () => {
  const { user } = useUser();
  const [session, setSession] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isUpdatingVote, setIsUpdatingVote] = useState(false);

  useEffect(() => {
    loadVotingSession();
    loadPastSessions();
  }, [user.uid]);

  const loadVotingSession = async () => {
    setLoading(true);
    try {
      const sessionData = await getCurrentVotingSession();
      setSession(sessionData);

      // Check if user has already voted and get their vote
      const userVote = await getUserVote(user.uid, sessionData.id);
      if (userVote) {
        setHasVoted(true);
        setSelectedCampaign(userVote.campaignId);
      } else {
        setHasVoted(false);
        setSelectedCampaign(null);
      }
    } catch (error) {
      console.error("Error loading voting session:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPastSessions = async () => {
    try {
      const past = await getPastVotingSessions(4);
      setPastSessions(past);
    } catch (error) {
      console.error("Error loading past sessions:", error);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedCampaign) {
      alert("Please select a campaign to vote for");
      return;
    }

    setSubmitting(true);
    try {
      await submitVoteToDb(user.uid, selectedCampaign, session.id);
      setHasVoted(true);
      setIsUpdatingVote(false);
      alert(hasVoted ? "✅ Vote Updated!" : "✅ Vote Submitted! Thank you for participating!");

      // Reload session to get updated vote counts
      await loadVotingSession();
    } catch (error) {
      alert("Error submitting vote: " + error.message);
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

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const options = { month: 'short', day: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);

    return `${startStr} - ${endStr}`;
  };

  const styles = {
    container: {
      padding: "20px",
      paddingBottom: "100px",
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
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    info: {
      background: "#f8fafc",
      padding: "16px",
      borderRadius: "8px",
      marginBottom: "20px",
      textAlign: "center",
    },
    infoText: {
      fontSize: "14px",
      color: "#64748b",
      marginBottom: "8px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    weekInfo: {
      fontSize: "13px",
      color: "#475569",
      marginTop: "8px",
      fontWeight: 500,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    totalVotes: {
      fontSize: "14px",
      fontWeight: 600,
      color: "#2563eb",
      marginTop: "8px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    options: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      marginBottom: "20px",
    },
    option: {
      position: "relative",
    },
    radio: {
      position: "absolute",
      opacity: 0,
    },
    label: {
      display: "block",
      padding: "12px",
      background: "#f8fafc",
      border: "2px solid #e2e8f0",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    labelDisabled: {
      cursor: "default",
      opacity: 0.7,
    },
    labelChecked: {
      borderColor: "#2563eb",
      background: "#eff6ff",
    },
    campaignHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "4px",
    },
    campaignName: {
      fontSize: "14px",
      fontWeight: 600,
      flex: 1,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    category: {
      fontSize: "10px",
      padding: "2px 8px",
      background: "#e0e7ff",
      color: "#3730a3",
      borderRadius: "4px",
      marginLeft: "8px",
      flexShrink: 0,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    campaignDesc: {
      fontSize: "12px",
      color: "#64748b",
      marginBottom: "8px",
      lineHeight: "1.4",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    voteCount: {
      fontSize: "12px",
      color: "#64748b",
      fontWeight: 500,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    buttonGroup: {
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
    },
    secondaryButton: {
      flex: 1,
      padding: "12px",
      background: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 500,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    changeVoteButton: {
      width: "100%",
      padding: "12px",
      background: "#2563eb",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: 600,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      marginBottom: "20px",
    },
    historyToggle: {
      width: "100%",
      padding: "10px",
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: 500,
      color: "#475569",
      marginBottom: "20px",
      textAlign: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    historySection: {
      marginTop: "20px",
      marginBottom: "20px",
    },
    historyTitle: {
      fontSize: "15px",
      fontWeight: 600,
      marginBottom: "12px",
      color: "#0f172a",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    historyCard: {
      background: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "12px",
    },
    historyWeek: {
      fontSize: "13px",
      fontWeight: 600,
      color: "#475569",
      marginBottom: "8px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    distributionItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid #e2e8f0",
    },
    distributionItemLast: {
      borderBottom: "none",
    },
    distributionName: {
      fontSize: "12px",
      color: "#0f172a",
      flex: 1,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    distributionBar: {
      flex: 2,
      height: "6px",
      background: "#e2e8f0",
      borderRadius: "3px",
      margin: "0 8px",
      overflow: "hidden",
    },
    distributionFill: {
      height: "100%",
      background: "linear-gradient(90deg, #2563eb, #3b82f6)",
      borderRadius: "3px",
    },
    distributionPercent: {
      fontSize: "12px",
      fontWeight: 600,
      color: "#2563eb",
      minWidth: "50px",
      textAlign: "right",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
          <p style={{ fontSize: "13px", color: "#64748b", marginTop: "8px" }}>
            Check back later or contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  // Show locked view if voted and not updating
  if (hasVoted && !isUpdatingVote) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Weekly Voting</h2>
        </div>
        <div style={styles.info}>
          <p style={styles.infoText}>
            ✅ You have voted in this session!
          </p>
          <p style={styles.weekInfo}>
            {formatDateRange(session.startDate, session.endDate)}
          </p>
          <p style={styles.totalVotes}>
            Total Votes: {session.totalVotes || 0}
          </p>
        </div>

        <button style={styles.changeVoteButton} onClick={handleChangeVote}>
          Change My Vote
        </button>

        <div style={styles.options}>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>
            Current standings:
          </p>
          {session.campaigns
            .sort((a, b) => (b.votes || 0) - (a.votes || 0))
            .map((campaign) => {
              const percentage = session.totalVotes > 0
                ? ((campaign.votes || 0) / session.totalVotes * 100).toFixed(1)
                : 0;
              const isUserVote = campaign.id === selectedCampaign;
              return (
                <div key={campaign.id} style={styles.option}>
                  <div style={{
                    ...styles.label,
                    ...styles.labelDisabled,
                    ...(isUserVote ? { borderColor: "#16a34a", background: "#f0fdf4" } : {})
                  }}>
                    <div style={styles.campaignHeader}>
                      <div style={styles.campaignName}>
                        {campaign.name}
                        {isUserVote && " ✓"}
                      </div>
                      <span style={styles.category}>{campaign.category}</span>
                    </div>
                    <div style={styles.campaignDesc}>{campaign.description}</div>
                    <div style={styles.voteCount}>
                      {campaign.votes || 0} vote{campaign.votes !== 1 ? 's' : ''} ({percentage}% of pool)
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {pastSessions.length > 0 && (
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
                {pastSessions.map((pastSession) => (
                  <div key={pastSession.id} style={styles.historyCard}>
                    <div style={styles.historyWeek}>
                      {formatDateRange(pastSession.startDate, pastSession.endDate)}
                    </div>
                    {pastSession.campaigns
                      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                      .map((campaign, idx) => {
                        const percentage = pastSession.totalVotes > 0
                          ? ((campaign.votes || 0) / pastSession.totalVotes * 100).toFixed(1)
                          : 0;
                        const isLast = idx === pastSession.campaigns.length - 1;
                        return (
                          <div
                            key={campaign.id}
                            style={isLast ? {...styles.distributionItem, ...styles.distributionItemLast} : styles.distributionItem}
                          >
                            <div style={styles.distributionName}>{campaign.name}</div>
                            <div style={styles.distributionBar}>
                              <div style={{ ...styles.distributionFill, width: `${percentage}%` }} />
                            </div>
                            <div style={styles.distributionPercent}>{percentage}%</div>
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Show voting/updating view
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Weekly Voting</h2>
      </div>

      <div style={styles.info}>
        <p style={styles.infoText}>
          {isUpdatingVote ? "Update your vote for this week's pooled donations" : "Vote for which campaign should receive this week's pooled donations"}
        </p>
        <p style={styles.weekInfo}>
          {formatDateRange(session.startDate, session.endDate)}
        </p>
        <p style={styles.totalVotes}>
          Total Votes So Far: {session.totalVotes || 0}
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
          <Button onClick={handleSubmitVote} disabled={submitting || !selectedCampaign}>
            {submitting ? "Updating..." : "Update Vote"}
          </Button>
        </div>
      ) : (
        <Button onClick={handleSubmitVote} disabled={submitting || !selectedCampaign}>
          {submitting ? "Submitting..." : "Submit Vote"}
        </Button>
      )}

      {pastSessions.length > 0 && (
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
              {pastSessions.map((pastSession) => (
                <div key={pastSession.id} style={styles.historyCard}>
                  <div style={styles.historyWeek}>
                    {formatDateRange(pastSession.startDate, pastSession.endDate)}
                  </div>
                  {pastSession.campaigns
                    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                    .map((campaign, idx) => {
                      const percentage = pastSession.totalVotes > 0
                        ? ((campaign.votes || 0) / pastSession.totalVotes * 100).toFixed(1)
                        : 0;
                      const isLast = idx === pastSession.campaigns.length - 1;
                      return (
                        <div
                          key={campaign.id}
                          style={isLast ? {...styles.distributionItem, ...styles.distributionItemLast} : styles.distributionItem}
                        >
                          <div style={styles.distributionName}>{campaign.name}</div>
                          <div style={styles.distributionBar}>
                            <div style={{ ...styles.distributionFill, width: `${percentage}%` }} />
                          </div>
                          <div style={styles.distributionPercent}>{percentage}%</div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VotingView;