export default function Button({ children, onClick, variant = "primary", size = "md", icon, disabled, type = "button" }) {
  const styles = {
    primary: { background: "#2563eb", color: "#fff", border: "none" },
    secondary: { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" },
    danger: { background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5" },
    success: { background: "#dcfce7", color: "#16a34a", border: "1px solid #86efac" },
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 12 },
    md: { padding: "9px 16px", fontSize: 14 },
    lg: { padding: "12px 24px", fontSize: 15 },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
        ...styles[variant],
        ...sizes[size],
      }}>
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
