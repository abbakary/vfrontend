import { useThemeColors } from "../../../utils/useThemeColors";

export default function ChartCard({ title, children, action, style }) {
  const colors = useThemeColors();

  return (
    <div
      style={{
        borderRadius: 16,
        backgroundColor: colors.card,
        padding: "24px",
        border: `1px solid ${colors.border}`,
        boxShadow: colors.isDarkMode
          ? "0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)"
          : "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: colors.text,
            margin: 0,
          }}
        >
          {title}
        </h3>
        {action}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
