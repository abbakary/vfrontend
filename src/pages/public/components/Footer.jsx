import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box
      sx={{
        py: 3,
        textAlign: "center",
        borderTop: "1px solid var(--border-color)",
        backgroundColor: "var(--card-bg)",
        transition: "background-color 0.3s ease, border-color 0.3s ease",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} DaliData. All rights reserved.
      </Typography>
    </Box>
  );
}
