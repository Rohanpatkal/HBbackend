import mongoose from "mongoose";

// Schema for a single day's data
const dayDataSchema = new mongoose.Schema(
  {
    count: { type: String, required: true },
    day: { type: String, required: true },
    month: { type: String, required: true },
    year: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: [] },
  },
  { _id: false }
);

// Schema for the overall summary/details
const totalDetailsSchema = new mongoose.Schema(
  {
    totalCount: { type: Number },
    yearMax: {
      year: { type: String },
      count: { type: Number },
    },
    yearMin: {
      year: { type: String },
      count: { type: Number },
    },
    monthMax: {
      month: { type: String },
      count: { type: Number },
    },
    monthMin: {
      month: { type: String },
      count: { type: Number },
    },
  },
  { _id: false }
);

// Top-level document: one record per data import session
const filteredDataSchema = new mongoose.Schema(
  {
    totalDetails: totalDetailsSchema,
    // data is a nested object: { "2023": { "09-2023": [...dayData] } }
    // Using Mixed lets us store the dynamic year/month keys as-is
    data: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("FilteredData", filteredDataSchema);
