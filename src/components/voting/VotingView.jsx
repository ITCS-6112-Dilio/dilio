// src/components/voting/VotingView.jsx
import { useState, useEffect } from "react";
import { getVotingSession, submitVote } from "../../services/donationService";
import { auth } from "../../services/firebase";
import Button from "../Button";

const VotingView = () => {
  const [session, setSession] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    loadVotingSession();
  }, []);

  const loadVotingSession = async () => {
    try {
      const data = await getVotingSession();
      setSession(data);
    } catch (error) {
      console.error("Error loading voting session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedOrg) {
      alert("Please select an organization to vote for");
      return;
    }

    try {
      await submitVote(auth.currentUser.uid, selectedOrg, session.id);
      setHasVoted(true);
      alert("✅ Vote Submitted! Thank you for participating!");
    } catch (error) {
      if (error.message.includes("already voted")) {
        setHasVoted(true);
        alert("You have already voted in this session");
      } else {
        alert("Error submitting vote: " + error.message);
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
      marginBottom: "12px",
    },
    poolAmount: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#2563eb",
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
    labelChecked: {
      borderColor: "#2563eb",
      background: "#eff6ff",
    },
    orgName: {
      fontSize: "14px",
      fontWeight: 600,
      marginBottom: "4px",
    },
    orgDesc: {
      fontSize: "12px",
      color: "#64748b",
      marginBottom: "8px",
    },
    voteCount: {
      fontSize: "12px",
      color: "#64748b",
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading voting session...</p>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Weekly Voting</h2>
        </div>
        <div style={styles.info}>
          <p style={styles.infoText}>
            ✅ You have already voted in this session!
          </p>
          <p style={{ fontSize: "13px", color: "#64748b" }}>
            Check back next week to vote again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Weekly Voting</h2>
      </div>
      <div style={styles.info}>
        <p style={styles.infoText}>
          Vote for which organization should receive pooled donations
        </p>
        <p style={styles.poolAmount}>
          Current Pool: {session.pool ?? 0}
        </p>
      </div>
      <div style={styles.options}>
        {session.organizations.map((org) => (
          <div key={org.id} style={styles.option}>
            <input
              type="radio"
              id={`org-${org.id}`}
              name="vote"
              value={org.id}
              checked={selectedOrg === org.id}
              onChange={() => setSelectedOrg(org.id)}
              style={styles.radio}
            />
            <label
              htmlFor={`org-${org.id}`}
              style={
                selectedOrg === org.id
                  ? { ...styles.label, ...styles.labelChecked }
                  : styles.label
              }
            >
              <div style={styles.orgName}>{org.name}</div>
              <div style={styles.orgDesc}>{org.description}</div>
              <div style={styles.voteCount}>{org.votes} votes so far</div>
            </label>
          </div>
        ))}
      </div>
      <Button onClick={handleSubmitVote}>Submit Vote</Button>
    </div>
  );
};

export default VotingView;
