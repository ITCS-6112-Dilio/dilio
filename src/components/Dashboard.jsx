// src/components/Dashboard.jsx
import { useMemo, useState } from "react";
import { auth } from "../services/firebase";
import { signOut } from "firebase/auth";
import Button from "./Button";

const isInLast7Days = (isoDate) => {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now - then;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [manualAmount, setManualAmount] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");

  const handleLogout = async () => {
    await signOut(auth);
    // PrivateRoute will redirect them to login page after logout
  };

  // Create a transaction from user-entered amount (+ optional merchant)
  const createManualPurchase = () => {
    const amount = Number(manualAmount);

    if (Number.isNaN(amount) || amount <= 0) {
      alert("Enter a valid purchase amount greater than 0.");
      return null;
    }

    const nextWhole = Math.ceil(amount);
    const donationAmount = Number((nextWhole - amount).toFixed(2));

    return {
      id: crypto.randomUUID(),
      merchant: merchantName.trim() || "User Purchase",
      purchaseAmount: Number(amount.toFixed(2)),
      donationAmount,
      createdAt: new Date().toISOString(),
    };
  };

  const handleAddManualPurchase = () => {
    // PRE: student is logged in; user enters a purchase and confirms
    const tx = createManualPurchase();
    if (!tx) return;

    setTransactions((prev) => [tx, ...prev]);

    // Clear inputs
    setManualAmount("");
    setMerchantName("");
    // POST: donation is logged; metrics & points update via derived state
  };

  const handleDelete = (id) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    // POST: selected record removed; weekly total recalculated
  };

  const startEditing = (tx) => {
    setEditingId(tx.id);
    setEditAmount(tx.purchaseAmount.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditAmount("");
  };

  const saveEdit = (id) => {
    const newAmount = Number(editAmount);
    if (Number.isNaN(newAmount) || newAmount <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }

    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id !== id) return tx;

        const nextWhole = Math.ceil(newAmount);
        const donationAmount = Number(
          (nextWhole - newAmount).toFixed(2)
        );

        return {
          ...tx,
          purchaseAmount: Number(newAmount.toFixed(2)),
          donationAmount,
        };
      })
    );

    // POST: record updated; weekly total recalculated
    setEditingId(null);
    setEditAmount("");
  };

  // === Derived metrics ===
  const { weeklyTotal, weeklyCount, totalPoints } = useMemo(() => {
    const weeklyTx = transactions.filter((tx) =>
      isInLast7Days(tx.createdAt)
    );
    const weeklyTotal = weeklyTx.reduce(
      (sum, tx) => sum + tx.donationAmount,
      0
    );
    // Simple gamification: 1 point per cent donated
    const totalPoints = Math.round(weeklyTotal * 100);

    return {
      weeklyTotal: Number(weeklyTotal.toFixed(2)),
      weeklyCount: weeklyTx.length,
      totalPoints,
    };
  }, [transactions]);

  const weeklyGoal = 10; // $10 weekly donation goal
  const progressPct = Math.min(
    100,
    (weeklyTotal / weeklyGoal) * 100 || 0
  );

  const isAddDisabled =
    !manualAmount || Number(manualAmount) <= 0 || Number.isNaN(Number(manualAmount));

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "2rem auto",
        padding: "1.5rem",
        borderRadius: 12,
        border: "1px solid #ddd",
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <p style={{ margin: 0, fontSize: 14, color: "#555" }}>
            Welcome! You are logged in and ready to give back.
          </p>
        </div>
        <Button onClick={handleLogout}>Log Out</Button>
      </header>

      {/* Round-Up Input Section */}
      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: 10,
          background: "#f8fafc",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Round-Up Transactions</h3>
        <p style={{ fontSize: 14, color: "#555", marginBottom: "0.75rem" }}>
          Enter a purchase amount and we&apos;ll round it up to the next
          dollar as a donation.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
            marginBottom: "0.5rem",
          }}
        >
          <input
            type="text"
            inputMode="decimal"
            placeholder="Amount (e.g. 4.37)"
            value={manualAmount}
            onChange={(e) => setManualAmount(e.target.value)}
            style={{
              padding: "6px 8px",
              fontSize: 14,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              width: 120,
            }}
          />
          <input
            type="text"
            placeholder="Merchant (optional)"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            style={{
              padding: "6px 8px",
              fontSize: 14,
              borderRadius: 6,
              border: "1px solid #d1d5db",
              flex: 1,
              minWidth: 160,
            }}
          />
          <Button onClick={handleAddManualPurchase} disabled={isAddDisabled}>
            Add Purchase
          </Button>
        </div>

        {manualAmount && !Number.isNaN(Number(manualAmount)) && Number(manualAmount) > 0 && (
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 0 }}>
            Preview:&nbsp;
            {(() => {
              const amount = Number(manualAmount);
              const nextWhole = Math.ceil(amount);
              const donation = Number((nextWhole - amount).toFixed(2));
              return (
                <>
                  Purchase ${amount.toFixed(2)} → Donation&nbsp;
                  <strong>${donation.toFixed(2)}</strong>
                </>
              );
            })()}
          </p>
        )}
      </section>

      {/* Weekly Metrics */}
      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: 10,
          background: "#f1f5f9",
        }}
      >
        <h3 style={{ marginTop: 0 }}>This Week&apos;s Impact</h3>
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            flexWrap: "wrap",
            marginBottom: "0.75rem",
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "#555" }}>
              Weekly Total Donated
            </div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              ${weeklyTotal.toFixed(2)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#555" }}>
              Donations (last 7 days)
            </div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {weeklyCount}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#555" }}>Your Points</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {totalPoints}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>
          Progress toward weekly goal (${weeklyGoal.toFixed(2)})
        </div>
        <div
          style={{
            width: "100%",
            height: 10,
            borderRadius: 999,
            background: "#e2e8f0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              background: "#22c55e",
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <p
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#64748b",
          }}
        >
          Leaderboard and campus-wide stats can be connected later to a
          real backend service.
        </p>
      </section>

      {/* Transactions List */}
      <section>
        <h3 style={{ marginTop: 0 }}>Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p style={{ fontSize: 14, color: "#555" }}>
            No transactions yet. Add a purchase above to see your
            round-up donations.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: 4,
                  }}
                >
                  Merchant
                </th>
                <th
                  style={{
                    textAlign: "right",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: 4,
                  }}
                >
                  Purchase
                </th>
                <th
                  style={{
                    textAlign: "right",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: 4,
                  }}
                >
                  Donation
                </th>
                <th
                  style={{
                    textAlign: "center",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: 4,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isEditing = editingId === tx.id;
                return (
                  <tr key={tx.id}>
                    <td style={{ padding: "6px 4px" }}>{tx.merchant}</td>
                    <td style={{ padding: "6px 4px", textAlign: "right" }}>
                      {isEditing ? (
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) =>
                            setEditAmount(e.target.value)
                          }
                          style={{
                            width: "80px",
                            padding: "2px 4px",
                            fontSize: 13,
                          }}
                        />
                      ) : (
                        `$${tx.purchaseAmount.toFixed(2)}`
                      )}
                    </td>
                    <td style={{ padding: "6px 4px", textAlign: "right" }}>
                      ${tx.donationAmount.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "6px 4px",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(tx.id)}
                            style={{
                              marginRight: 6,
                              fontSize: 12,
                              padding: "2px 6px",
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            style={{
                              fontSize: 12,
                              padding: "2px 6px",
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(tx)}
                            style={{
                              marginRight: 6,
                              fontSize: 12,
                              padding: "2px 6px",
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            style={{
                              fontSize: 12,
                              padding: "2px 6px",
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
