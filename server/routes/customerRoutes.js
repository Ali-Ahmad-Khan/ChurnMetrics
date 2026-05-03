const express = require("express");
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  getCustomerStats,
} = require("../controllers/customerController");

// GET /api/customers/stats/summary — must be before /:id to avoid conflict
router.get("/stats/summary", getCustomerStats);
router.get("/", getCustomers);
router.get("/:id", getCustomerById);

module.exports = router;
