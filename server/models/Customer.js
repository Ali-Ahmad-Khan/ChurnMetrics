const mongoose = require("mongoose");

// Customer schema — mirrors the IBM Telco dataset columns
const customerSchema = new mongoose.Schema(
  {
    customerID: { type: String, required: true, unique: true, index: true },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    SeniorCitizen: { type: Number, enum: [0, 1], required: true },
    Partner: { type: String, enum: ["Yes", "No"], required: true },
    Dependents: { type: String, enum: ["Yes", "No"], required: true },
    tenure: { type: Number, required: true, min: 0 },
    PhoneService: { type: String, enum: ["Yes", "No"], required: true },
    MultipleLines: { type: String, required: true },
    InternetService: { type: String, required: true },
    OnlineSecurity: { type: String, required: true },
    OnlineBackup: { type: String, required: true },
    DeviceProtection: { type: String, required: true },
    TechSupport: { type: String, required: true },
    StreamingTV: { type: String, required: true },
    StreamingMovies: { type: String, required: true },
    Contract: { type: String, required: true },
    PaperlessBilling: { type: String, enum: ["Yes", "No"], required: true },
    PaymentMethod: { type: String, required: true },
    MonthlyCharges: { type: Number, required: true },
    TotalCharges: { type: Number, default: 0 },
    Churn: { type: String, enum: ["Yes", "No"], default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
