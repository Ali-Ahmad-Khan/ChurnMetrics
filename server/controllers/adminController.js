const SystemLog = require("../models/SystemLog");
const Customer = require("../models/Customer");
const fastapi = require("../utils/fastApiClient");
const { spawn } = require("child_process");
const path = require("path");

// POST /api/admin/drift — run drift detection on a sample of customers
const checkDrift = async (req, res, next) => {
  try {
    // Get a random sample of customers for drift comparison
    const sampleSize = parseInt(req.query.sampleSize) || 100;
    const customers = await Customer.aggregate([
      { $sample: { size: sampleSize } },
    ]);

    if (customers.length < 2) {
      return res.status(400).json({
        error: "Not enough customers in database for drift detection",
      });
    }

    // Prepare customer data for FastAPI (remove MongoDB-specific fields)
    const cleanedCustomers = customers.map((c) => ({
      gender: c.gender,
      SeniorCitizen: c.SeniorCitizen,
      Partner: c.Partner,
      Dependents: c.Dependents,
      tenure: c.tenure,
      PhoneService: c.PhoneService,
      MultipleLines: c.MultipleLines,
      InternetService: c.InternetService,
      OnlineSecurity: c.OnlineSecurity,
      OnlineBackup: c.OnlineBackup,
      DeviceProtection: c.DeviceProtection,
      TechSupport: c.TechSupport,
      StreamingTV: c.StreamingTV,
      StreamingMovies: c.StreamingMovies,
      Contract: c.Contract,
      PaperlessBilling: c.PaperlessBilling,
      PaymentMethod: c.PaymentMethod,
      MonthlyCharges: c.MonthlyCharges,
      TotalCharges: c.TotalCharges || 0,
    }));

    const result = await fastapi.checkDrift(cleanedCustomers);

    // Log drift result
    if (result.drift_detected) {
      await SystemLog.create({
        type: "drift_alert",
        severity: result.severity,
        message: `Data drift detected: ${result.num_drifted_features} features drifted`,
        metadata: result,
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/logs — system logs
const getSystemLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const type = req.query.type;
    const skip = (page - 1) * limit;

    const filter = {};
    if (type) filter.type = type;

    const [logs, total] = await Promise.all([
      SystemLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SystemLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/system/info — system architecture info (for the About page)
const getSystemInfo = async (req, res, next) => {
  try {
    const aiHealth = await fastapi.healthCheck().catch(() => ({
      status: "offline",
      model_loaded: false,
    }));

    const aiModel = await fastapi.modelInfo().catch(() => null);

    res.json({
      projectName: "ChurnMetrics",
      description:
        "End-to-end AI-powered churn prediction and decision-support system for telecom data",
      architecture: {
        frontend: "React SPA + Bootstrap 5",
        backend: "Express.js (MVC)",
        aiEngine: "FastAPI (Python)",
        database: "MongoDB Atlas",
        models: "Logistic Regression (Stage 1) + XGBoost (Stage 2)",
      },
      features: [
        "Two-stage cascade prediction",
        "SHAP explainability",
        "What-if simulation",
        "Drift detection",
        "Human-in-the-loop review",
        "Feedback loop",
        "Risk segmentation",
        "Rule-based recommendations",
      ],
      aiEngine: aiHealth,
      modelInfo: aiModel,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { checkDrift, getSystemLogs, getSystemInfo, triggerRetrain };

// ── POST /api/admin/retrain ──────────────────────────────────────────────────
// Spawns "python src/train.py" in the project root, streams stdout/stderr,
// and resolves when the process exits.
function triggerRetrain(req, res, next) {
  const projectRoot = path.resolve(__dirname, "../../");
  const trainScript = path.join(projectRoot, "src", "train.py");

  // Detect python binary (venv or system)
  const venvPython = path.join(projectRoot, "api", "venv", "bin", "python");
  const pythonBin = require("fs").existsSync(venvPython) ? venvPython : "python3";

  console.log(`[Retrain] Spawning: ${pythonBin} ${trainScript}`);

  const child = spawn(pythonBin, [trainScript], {
    cwd: projectRoot,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });

  const logs = [];
  const startTime = Date.now();

  child.stdout.on("data", (data) => {
    const line = data.toString().trim();
    if (line) { logs.push(line); console.log(`[Retrain stdout] ${line}`); }
  });

  child.stderr.on("data", (data) => {
    const line = data.toString().trim();
    if (line) { logs.push(`[stderr] ${line}`); console.error(`[Retrain stderr] ${line}`); }
  });

  child.on("close", async (code) => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const success = code === 0;

    await SystemLog.create({
      type: "retrain",
      severity: success ? "info" : "high",
      message: success
        ? `Model retrained successfully in ${duration}s`
        : `Retraining failed with exit code ${code}`,
      metadata: { exitCode: code, duration, tail: logs.slice(-20) },
    });

    if (res.headersSent) return;
    if (success) {
      res.json({ success: true, duration, message: `Retraining completed in ${duration}s`, logs: logs.slice(-30) });
    } else {
      res.status(500).json({ success: false, exitCode: code, message: "Training script exited with an error", logs: logs.slice(-30) });
    }
  });

  child.on("error", (err) => {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: `Failed to spawn training process: ${err.message}` });
    }
  });
}
