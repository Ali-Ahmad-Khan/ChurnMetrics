const express = require("express");
const router = express.Router();
const {
  getDashboardSummary,
  getAnalytics,
} = require("../controllers/dashboardController");

router.get("/summary", getDashboardSummary);
router.get("/analytics", getAnalytics);

module.exports = router;
