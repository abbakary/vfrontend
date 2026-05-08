import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";

export default function RequestPage() {
  return (
    <Box sx={{ maxWidth: 480, mx: "auto", mt: 6, p: 2 }}>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 4 }}>
        <Typography
          variant="h5"
          fontWeight={900}
          gutterBottom
          sx={{
            background: "linear-gradient(90deg, #61C5C3, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Request Any Data
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Submit a request for a dataset, project, or report. Our team will
          review and respond promptly.
        </Typography>
        <form>
          <TextField
            label="Request Type"
            select
            fullWidth
            required
            margin="normal"
            defaultValue="dataset"
            name="type"
          >
            <MenuItem value="dataset">Dataset</MenuItem>
            <MenuItem value="project">Project</MenuItem>
            <MenuItem value="report">Report</MenuItem>
          </TextField>
          <TextField
            label="Title"
            fullWidth
            required
            margin="normal"
            name="title"
          />
          <TextField
            label="Description"
            fullWidth
            required
            margin="normal"
            name="description"
            multiline
            minRows={3}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{
              mt: 2,
              background: "linear-gradient(90deg, #61C5C3, #8b5cf6)",
              color: "#fff",
              fontWeight: 700,
            }}
            fullWidth
          >
            Submit Request
          </Button>
        </form>
      </Paper>
    </Box>
  );
}
