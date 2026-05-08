import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const drawerWidthExpanded = 240;
const drawerWidthCollapsed = 70;

export default function PageLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Navbar always on top */}
      <Navbar
        isMobile={isMobile}
        onToggleSidebar={() => setMobileOpen(!mobileOpen)}
      />

      {/* Sidebar (now on RIGHT) */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        style={{
          marginTop: "70px",
          // ⟵ switch to RIGHT margin so content shifts left when drawer open
          marginRight: isMobile
            ? 0
            : collapsed
              ? drawerWidthCollapsed
              : drawerWidthExpanded,
          transition: "margin-right 0.3s ease", // ⟵ update transition
          display: "flex",
          flexDirection: "column",
          minHeight: "calc(100vh - 70px)",
          backgroundColor: "var(--bg-gray)",
        }}
      >
        <div style={{ flexGrow: 1, padding: "20px" }}>{children}</div>
        <Footer />
      </div>
    </div>
  );
}
