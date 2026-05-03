const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { parse } = require("csv-parse/sync");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Customer = require("../models/Customer");
const connectDB = require("../config/db");

const CSV_PATH = path.join(__dirname, "../../data/raw/IBM_telco_churn.csv");

const seed = async () => {
  console.log("[Seed] Starting database seed...");
  await connectDB();

  // Check if already seeded
  const existing = await Customer.countDocuments();
  if (existing > 0) {
    console.log(`[Seed] Database already has ${existing} customers. Skipping seed.`);
    console.log("[Seed] To re-seed, drop the collection first.");
    process.exit(0);
  }

  // Read and parse CSV
  const csvData = fs.readFileSync(CSV_PATH, "utf-8");
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`[Seed] Parsed ${records.length} records from CSV`);

  // Transform records to match schema
  const customers = records.map((row) => {
    // Normalize internet-dependent services
    const normalize = (val) =>
      val === "No internet service" || val === "No phone service" ? "No" : val;

    return {
      customerID: row.customerID,
      gender: row.gender,
      SeniorCitizen: parseInt(row.SeniorCitizen),
      Partner: row.Partner,
      Dependents: row.Dependents,
      tenure: parseInt(row.tenure),
      PhoneService: row.PhoneService,
      MultipleLines: normalize(row.MultipleLines),
      InternetService: row.InternetService,
      OnlineSecurity: normalize(row.OnlineSecurity),
      OnlineBackup: normalize(row.OnlineBackup),
      DeviceProtection: normalize(row.DeviceProtection),
      TechSupport: normalize(row.TechSupport),
      StreamingTV: normalize(row.StreamingTV),
      StreamingMovies: normalize(row.StreamingMovies),
      Contract: row.Contract,
      PaperlessBilling: row.PaperlessBilling,
      PaymentMethod: row.PaymentMethod,
      MonthlyCharges: parseFloat(row.MonthlyCharges),
      TotalCharges: parseFloat(row.TotalCharges) || 0,
      Churn: row.Churn,
    };
  });

  // Bulk insert
  const result = await Customer.insertMany(customers, { ordered: false });
  console.log(`[Seed] Inserted ${result.length} customers into MongoDB`);
  console.log("[Seed] Database seed complete!");

  process.exit(0);
};

seed().catch((err) => {
  console.error("[Seed] Fatal error:", err);
  process.exit(1);
});
