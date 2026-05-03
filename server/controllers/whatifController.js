const fastapi = require("../utils/fastApiClient");

// POST /api/whatif — what-if simulation
const simulateWhatIf = async (req, res, next) => {
  try {
    const { original, modified } = req.body;
    const result = await fastapi.predictWhatIf(original, modified);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/whatif/global — global shift simulation
const simulateGlobal = async (req, res, next) => {
  try {
    const { shifts } = req.body;
    const result = await fastapi.simulateGlobal(shifts);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { simulateWhatIf, simulateGlobal };
