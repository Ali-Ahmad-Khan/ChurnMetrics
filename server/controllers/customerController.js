const Customer = require("../models/Customer");

// GET /api/customers — paginated customer directory
const getCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { customerID: { $regex: search, $options: "i" } },
        { gender: { $regex: search, $options: "i" } },
        { Contract: { $regex: search, $options: "i" } },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter).skip(skip).limit(limit).lean(),
      Customer.countDocuments(filter),
    ]);

    res.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/customers/:id — single customer profile
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      customerID: req.params.id,
    }).lean();

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (err) {
    next(err);
  }
};

// GET /api/customers/stats/summary — aggregate stats for dashboard
const getCustomerStats = async (req, res, next) => {
  try {
    const [total, churned, stats] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ Churn: "Yes" }),
      Customer.aggregate([
        {
          $group: {
            _id: null,
            avgTenure: { $avg: "$tenure" },
            avgMonthlyCharges: { $avg: "$MonthlyCharges" },
            avgTotalCharges: { $avg: "$TotalCharges" },
          },
        },
      ]),
    ]);

    const contractDist = await Customer.aggregate([
      { $group: { _id: "$Contract", count: { $sum: 1 } } },
    ]);

    const internetDist = await Customer.aggregate([
      { $group: { _id: "$InternetService", count: { $sum: 1 } } },
    ]);

    res.json({
      totalCustomers: total,
      churnedCustomers: churned,
      churnRate: total > 0 ? +(churned / total).toFixed(4) : 0,
      averages: stats[0] || { avgTenure: 0, avgMonthlyCharges: 0, avgTotalCharges: 0 },
      contractDistribution: contractDist,
      internetDistribution: internetDist,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCustomers, getCustomerById, getCustomerStats };
