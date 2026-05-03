const Prediction = require("../models/Prediction");
const fastapi = require("../utils/fastApiClient");

// POST /api/predictions/single — predict + persist
const predictSingle = async (req, res, next) => {
  try {
    const customerData = req.body;
    const result = await fastapi.predictExplain(customerData);

    // Persist prediction to MongoDB
    const prediction = await Prediction.create({
      customerID: customerData.customerID || `manual_${Date.now()}`,
      inputFeatures: customerData,
      churnPrediction: result.prediction.churn_prediction,
      churnProbability: result.prediction.churn_probability,
      riskLabel: result.prediction.risk_label,
      needsReview: result.prediction.needs_review,
      stageUsed: result.prediction.stage_used,
      topFeatures: result.top_features.map((f) => ({
        feature: f.feature,
        shapValue: f.shap_value,
        impact: f.impact,
      })),
      recommendations: result.recommendations,
      rescuePlan: result.rescue_plan,
    });

    res.json({
      ...result,
      _id: prediction._id,
      savedAt: prediction.createdAt,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/predictions/batch — batch predict + persist
const predictBatch = async (req, res, next) => {
  try {
    const { customers } = req.body;
    const result = await fastapi.predictBatch(customers);

    // Persist each prediction
    const docs = result.predictions.map((pred, idx) => ({
      customerID: customers[idx].customerID || `batch_${Date.now()}_${idx}`,
      inputFeatures: customers[idx],
      churnPrediction: pred.churn_prediction,
      churnProbability: pred.churn_probability,
      riskLabel: pred.risk_label,
      needsReview: pred.needs_review,
      stageUsed: pred.stage_used,
    }));

    await Prediction.insertMany(docs);

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/predictions — prediction history
const getPredictions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const riskFilter = req.query.risk;
    const reviewFilter = req.query.reviewStatus;

    const filter = {};
    if (riskFilter) filter.riskLabel = riskFilter;
    if (reviewFilter) filter.reviewStatus = reviewFilter;

    const [predictions, total] = await Promise.all([
      Prediction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Prediction.countDocuments(filter),
    ]);

    res.json({
      predictions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/predictions/:id — single prediction detail
const getPredictionById = async (req, res, next) => {
  try {
    const prediction = await Prediction.findById(req.params.id).lean();
    if (!prediction) {
      return res.status(404).json({ error: "Prediction not found" });
    }
    res.json(prediction);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/predictions/:id/feedback — record actual churn outcome
const submitFeedback = async (req, res, next) => {
  try {
    const { actualChurn, reviewNotes } = req.body;

    const prediction = await Prediction.findById(req.params.id);
    if (!prediction) {
      return res.status(404).json({ error: "Prediction not found" });
    }

    prediction.actualChurn = actualChurn;
    prediction.feedbackDate = new Date();
    prediction.predictionCorrect = prediction.churnPrediction === actualChurn;
    prediction.reviewStatus = "reviewed";
    if (reviewNotes) prediction.reviewNotes = reviewNotes;

    await prediction.save();
    res.json(prediction);
  } catch (err) {
    next(err);
  }
};

// GET /api/predictions/stats/summary — prediction analytics
const getPredictionStats = async (req, res, next) => {
  try {
    const [total, churners, riskDist, feedbackStats] = await Promise.all([
      Prediction.countDocuments(),
      Prediction.countDocuments({ churnPrediction: 1 }),
      Prediction.aggregate([
        { $group: { _id: "$riskLabel", count: { $sum: 1 } } },
      ]),
      Prediction.aggregate([
        { $match: { actualChurn: { $ne: null } } },
        {
          $group: {
            _id: null,
            totalFeedback: { $sum: 1 },
            correct: { $sum: { $cond: ["$predictionCorrect", 1, 0] } },
          },
        },
      ]),
    ]);

    const fb = feedbackStats[0] || { totalFeedback: 0, correct: 0 };

    res.json({
      totalPredictions: total,
      predictedChurners: churners,
      riskDistribution: riskDist,
      feedbackLoop: {
        totalFeedback: fb.totalFeedback,
        correctPredictions: fb.correct,
        accuracy: fb.totalFeedback > 0 ? +(fb.correct / fb.totalFeedback).toFixed(4) : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  predictSingle,
  predictBatch,
  getPredictions,
  getPredictionById,
  submitFeedback,
  getPredictionStats,
};
