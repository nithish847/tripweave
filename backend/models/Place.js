import mongoose from "mongoose";

const placeSchema = new mongoose.Schema({
  Zone: { type: String },
  State: { type: String, required: true },
  City: { type: String, required: true },
  Name: { type: String, required: true }, // avoid duplicates
  Type: { type: String },
  EstablishmentYear: { type: String },
  TimeNeededHrs: { type: Number },
  ReviewRating: { type: Number },
  EntranceFee: { type: Number },
  AirportWithin50km: { type: String },
  WeeklyOff: { type: String },
  Significance: { type: String },
  DSLRAllowed: { type: String },
  ReviewCountLakhs: { type: Number },
  BestTime: { type: String },
  Category: { type: String },
  Lat: { type: Number },
  Lon: { type: Number },
  Image: { type: String },
  Wikipedia_URL: { type: String },
  Source: { type: String },
}, { timestamps: true });

const Place = mongoose.model("Place", placeSchema);
export default Place;
