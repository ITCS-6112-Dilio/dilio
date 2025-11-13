// src/components/Card.jsx
import React from "react";

const defaultStyle = {
  maxWidth: 340,
  minWidth: 200,
  margin: "2rem auto",
  padding: "1rem",
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
  background: "#fff",
};

const Card = ({ children, style = {} }) => (
  <div style={{ ...defaultStyle, ...style }}>{children}</div>
);

export default Card;
