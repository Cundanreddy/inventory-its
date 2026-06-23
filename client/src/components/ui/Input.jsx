export default function Input({ label, value, onChange, type = "text", required, options, placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#111827", background: "#fff" }}>
          <option value="">Select…</option>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          required={required}
          style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 14, color: "#111827", boxSizing: "border-box" }} />
      )}
    </div>
  );
}
