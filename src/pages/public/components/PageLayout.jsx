import { Box } from "@mui/material";
import NavBar, { NAVBAR_HEIGHT } from "./NavBars";
import Footer from "./Footer";

export default function PageLayout({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-gray)",
        display: "flex",
        flexDirection: "column",
        transition: "background-color 0.3s ease",
      }}
    >
      <NavBar />

      <Box sx={{ flex: 1, paddingTop: `${NAVBAR_HEIGHT}px` }}>{children}</Box>

      <Footer />
    </Box>
  );
}
