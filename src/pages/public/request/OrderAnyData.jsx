import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import SparkleTwoToneIcon from "@mui/icons-material/AutoAwesomeTwoTone";

export default function OrderAnyData() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 700, mx: "auto" }}>
      <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <SparkleTwoToneIcon sx={{ fontSize: 36, color: "#61C5C3" }} />
          <Typography variant="h4" fontWeight={900}>
            Order Any Data
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Submit a request for any dataset, project, or report you need. Our
          team or AI will help you get the data you want!
        </Typography>
        {/* Add your form or request UI here */}
        <Typography variant="body2" color="text.secondary">
          (Form coming soon)
        </Typography>
      </Paper>
    </Box>
  );
}
