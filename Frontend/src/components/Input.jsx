import React from "react";

const Input = ({ label, type, value, onChange }) => {
  return (
    <div className="input-group" style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontWeight: "bold" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: "5px",
          border: "1px solid #ccc"
        }}
      />
    </div>
  );
};

export default Input;
