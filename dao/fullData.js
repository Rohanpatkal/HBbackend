import mongoose from "mongoose";

// Stores the fully enriched data with per-year and per-month details.
// The structure is dynamic (year keys, month keys), so Mixed works best here.
const fullDataSchema = new mongoose.Schema(
  {
    // AllDetails mirrors totalDetails from filteredData
    AllDetails: { type: mongoose.Schema.Types.Mixed },
    // The rest of the document is keyed by year (e.g. "2023", "2024")
    // Each year contains yearDetails + month keys with monthDetails + Daydata
    yearData: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("FullData", fullDataSchema);
