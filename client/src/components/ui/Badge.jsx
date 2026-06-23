const STATUS_COLOR = {
  Available: "#16a34a",
  Reserved: "#d97706",
  Allocated: "#2563eb",
  Returned: "#059669",
  Lost: "#dc2626",
  Damaged: "#ea580c",
  Repair: "#7c3aed",
  Retired: "#6b7280",
};

export default function Badge({ status }) {
  return (
    <span style={{
      background: STATUS_COLOR[status] + "20",
      color: STATUS_COLOR[status],
      border: `1px solid ${STATUS_COLOR[status]}40`,
      padding: "2px 10px",
      borderRadius: 99,
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}>{status}</span>
  );
}
