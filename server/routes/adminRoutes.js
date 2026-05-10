const express = require("express");
const router = express.Router();
const {
  seedDatabase,
  checkDrift,
  getSystemLogs,
  getSystemInfo,
  triggerRetrain,
  deployCampaign,
} = require("../controllers/adminController");
const { adminOnly } = require("../middleware/auth");

router.post("/seed", seedDatabase);
router.post("/drift", checkDrift);
router.get("/logs", getSystemLogs);
router.get("/system-info", getSystemInfo);
router.post("/retrain", adminOnly, triggerRetrain);
router.post("/campaign/deploy", deployCampaign);

module.exports = router;
