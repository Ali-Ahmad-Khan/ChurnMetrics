const express = require("express");
const router = express.Router();
const {
  checkDrift,
  getSystemLogs,
  getSystemInfo,
  triggerRetrain,
} = require("../controllers/adminController");
const { adminOnly } = require("../middleware/auth");

router.post("/drift", checkDrift);
router.get("/logs", getSystemLogs);
router.get("/system-info", getSystemInfo);
router.post("/retrain", adminOnly, triggerRetrain); // admin-only

module.exports = router;
