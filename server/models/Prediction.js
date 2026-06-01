const mongoose = require("mongoose");

// Prediction schema — stores every AI prediction for historical audit
const predictionSchema = new mongoose.Schema(
  {
    customerID: { type: String, required: true, index: true },
    // Input features snapshot
    inputFeatures: { type: mongoose.Schema.Types.Mixed, required: true },
    // AI output
    churnPrediction: { type: Number, enum: [0, 1], required: true },
    churnProbability: { type: Number, required: true },
    riskLabel: { type: String, enum: ["Low", "Medium", "High"], required: true },
    needsReview: { type: Boolean, default: false },
    stageUsed: { type: String, enum: ["stage1", "stage2"], default: "stage1" },
    // SHAP explanations (optional — populated when explain endpoint is used)
    topFeatures: [
      {
        feature: String,
        shapValue: Number,
        impact: Number,
      },
    ],
    // Recommendations
    recommendations: [mongoose.Schema.Types.Mixed],
    // Rescue Plan (LLM-generated)
    rescuePlan: {
      strategy: String,
      plan: String,
      script: String,
      is_ai_generated: Boolean,
    },
    // Feedback loop: actual outcome (set later when ground truth is known)
    actualChurn: { type: Number, enum: [0, 1], default: null },
    feedbackDate: { type: Date, default: null },
    predictionCorrect: { type: Boolean, default: null },
    // Review status (for human-in-the-loop)
    reviewStatus: {
      type: String,
      enum: ["pending", "reviewed", "overridden", "none"],
      default: "none",
    },
    reviewNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prediction", predictionSchema);
