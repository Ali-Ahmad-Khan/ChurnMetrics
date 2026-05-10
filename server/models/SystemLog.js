const mongoose = require("mongoose");

// SystemLog schema — stores drift alerts and model health metrics
const systemLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["drift_alert", "model_health", "error", "info", "campaign_deployment", "seed", "retrain"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SystemLog", systemLogSchema);
