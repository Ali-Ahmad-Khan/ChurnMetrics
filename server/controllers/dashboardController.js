const Customer = require("../models/Customer");
const Prediction = require("../models/Prediction");
const SystemLog = require("../models/SystemLog");
const fastapi = require("../utils/fastApiClient");

// GET /api/dashboard/summary — main dashboard data
const getDashboardSummary = async (req, res, next) => {
  try {
    const [
      totalCustomers,
      churnedCustomers,
      totalPredictions,
      predictedChurners,
      recentPredictions,
      riskDist,
      aiHealth,
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ Churn: "Yes" }),
      Prediction.countDocuments(),
      Prediction.countDocuments({ churnPrediction: 1 }),
      Prediction.find().sort({ createdAt: -1 }).limit(5).lean(),
      Prediction.aggregate([
        { $group: { _id: "$riskLabel", count: { $sum: 1 } } },
      ]),
      fastapi.healthCheck().catch(() => ({ status: "offline", model_loaded: false })),
    ]);

    res.json({
      customers: {
        total: totalCustomers,
        churned: churnedCustomers,
        churnRate: totalCustomers > 0 ? +(churnedCustomers / totalCustomers).toFixed(4) : 0,
      },
      predictions: {
        total: totalPredictions,
        predictedChurners,
        riskDistribution: riskDist,
      },
      recentPredictions,
      aiEngine: aiHealth,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/analytics — detailed analytics for analytics page
const getAnalytics = async (req, res, next) => {
  try {
    const [
      churnByContract,
      churnByInternet,
      tenureDist,
      chargesByChurn,
      monthlyPredictions,
      modelInfo,
    ] = await Promise.all([
      Customer.aggregate([
        { $group: { _id: { contract: "$Contract", churn: "$Churn" }, count: { $sum: 1 } } },
      ]),
      Customer.aggregate([
        { $group: { _id: { internet: "$InternetService", churn: "$Churn" }, count: { $sum: 1 } } },
      ]),
      Customer.aggregate([
        {
          $bucket: {
            groupBy: "$tenure",
            boundaries: [0, 6, 12, 24, 36, 48, 60, 72, 100],
            default: "72+",
            output: {
              count: { $sum: 1 },
              churnCount: { $sum: { $cond: [{ $eq: ["$Churn", "Yes"] }, 1, 0] } },
            },
          },
        },
      ]),
      Customer.aggregate([
        {
          $group: {
            _id: "$Churn",
            avgMonthly: { $avg: "$MonthlyCharges" },
            avgTotal: { $avg: "$TotalCharges" },
          },
        },
      ]),
      Prediction.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            churners: { $sum: { $cond: [{ $eq: ["$churnPrediction", 1] }, 1, 0] } },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
      fastapi.modelInfo().catch(() => null),
    ]);

    res.json({
      churnByContract,
      churnByInternet,
      tenureDistribution: tenureDist,
      chargesByChurn,
      monthlyPredictions,
      modelInfo,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboardSummary, getAnalytics };
