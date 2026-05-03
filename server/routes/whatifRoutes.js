const express = require("express");
const router = express.Router();
const { simulateWhatIf, simulateGlobal } = require("../controllers/whatifController");

router.post("/", simulateWhatIf);
router.post("/global", simulateGlobal);

module.exports = router;
