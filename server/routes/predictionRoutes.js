const express = require("express");
const router = express.Router();
const {
  predictSingle,
  predictBatch,
  getPredictions,
  getPredictionById,
  submitFeedback,
  getPredictionStats,
} = require("../controllers/predictionController");

router.get("/stats/summary", getPredictionStats);
router.post("/single", predictSingle);
router.post("/batch", predictBatch);
router.get("/", getPredictions);
router.get("/:id", getPredictionById);
router.patch("/:id/feedback", submitFeedback);

module.exports = router;
