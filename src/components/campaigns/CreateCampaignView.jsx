// src/components/campaigns/CreateCampaignView.jsx
import { useState } from "react";
import Input from "../Input";
import Button from "../Button";
import { createCampaign, updateCampaign } from "../../services/campaignService";

const CreateCampaignView = ({ onBack, userId, campaign, onSave }) => {
  const [ title, setTitle ] = useState(campaign?.name || "");
  const [ description, setDescription ] = useState(campaign?.description || "");
  const [ goal, setGoal ] = useState(campaign?.goal || "");
  const [ category, setCategory ] = useState(campaign?.category || "Community");
  const [ loading, setLoading ] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !goal) {
      alert("Please fill in all fields");
      return;
    }

    const goalAmount = parseFloat(goal);
    if (isNaN(goalAmount) || goalAmount <= 0) {
      alert("Please enter a valid goal amount");
      return;
    }

    setLoading(true);
    try {
      if (campaign && campaign.id) {
        await updateCampaign(campaign.id, {
          name: title,
          description,
          goal: goalAmount,
          category,
        });
        alert("Campaign updated!");
        onSave && onSave();
      } else {
        await createCampaign({
          name: title,
          description,
          goal: goalAmount,
          category,
          organizerId: userId,
        });
        alert("Campaign submitted for admin approval!");
      }
      onBack && onBack();
    } catch (error) {
      alert("Error creating/updating campaign: " + error.message);
    } finally {
      setLoading(false);
    }
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
      marginBottom: "8px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    subtitle: {
      fontSize: "13px",
      color: "#64748b",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    textarea: {
      width: "100%",
      minHeight: "80px",
      padding: "8px",
      borderRadius: 4,
      border: "1px solid #ccc",
      fontSize: "14px",
      fontFamily: "inherit",
      boxSizing: "border-box",
      resize: "vertical",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    select: {
      width: "100%",
      padding: "8px",
      borderRadius: 4,
      border: "1px solid #ccc",
      fontSize: "14px",
      boxSizing: "border-box",
    },
    backBtn: {
      marginTop: "10px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          {campaign ? "Edit Campaign" : "Create Campaign"}
        </h2>
        <p style={styles.subtitle}>
          {campaign
            ? "Update and refine your pending campaign before admin approval."
            : "Submit a new fundraising campaign for approval."}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <Input
          label="Campaign Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Student Emergency Fund"
          required
        />

        <div>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500, fontSize: "14px" }}>
            Description <span style={{ color: "#b00" }}>*</span>
          </label>
          <textarea
            style={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your campaign and its impact..."
            required
          />
        </div>

        <Input
          label="Goal Amount"
          type="number"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="5000"
          required
        />

        <div>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: 500, fontSize: "14px" }}>
            Category <span style={{ color: "#b00" }}>*</span>
          </label>
          <select
            style={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Community">Community</option>
            <option value="Education">Education</option>
            <option value="Wellness">Wellness</option>
            <option value="Environment">Environment</option>
            <option value="Arts">Arts & Culture</option>
            <option value="Technology">Technology</option>
          </select>
        </div>

        <Button type="submit" disabled={loading}>
          {loading
            ? (campaign ? "Saving..." : "Submitting...")
            : (campaign ? "Save Changes" : "Submit Campaign")}
        </Button>

        <Button variant="secondary" onClick={onBack} style={styles.backBtn}>
          Back to Campaigns
        </Button>
      </form>
    </div>
  );
};

export default CreateCampaignView;
