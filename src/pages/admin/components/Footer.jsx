export default function Footer() {
  return (
    <footer
      style={{
        textAlign: "center",
        padding: "10px 8px",
        background: "var(--card-bg)",
        borderTop: "1px solid var(--border-color)",
        transition: "background-color 0.3s ease, border-color 0.3s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            color: "var(--text-dark)",
            fontSize: "0.8rem",
            transition: "color 0.3s ease",
          }}
        >
          © {new Date().getFullYear()}{" "}
          <span
            style={{
              color: "#0492C2",
              fontWeight: 600,
            }}
          >
            RADA AGRICULTURE Version 3.0
          </span>
        </span>
      </div>
    </footer>
  );
}
