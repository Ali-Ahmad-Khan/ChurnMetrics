import React, { useState, useEffect } from "react";
import api from "../services/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";

const WhatIf = () => {
  const [shifts, setShifts] = useState([
    { feature: "MonthlyCharges", percentage_change: 0 },
    { feature: "tenure", percentage_change: 0 },
    { feature: "TotalCharges", percentage_change: 0 }
  ]);
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePercentageChange = (feature, value) => {
    setShifts(prev => prev.map(s => 
      s.feature === feature ? { ...s, percentage_change: parseFloat(value) } : s
    ));
  };

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      // Filter out zero shifts
      const activeShifts = shifts.filter(s => s.percentage_change !== 0);
      const response = await api.post("/whatif/global", { shifts: activeShifts });
      setResults(response.data);
    } catch (err) {
      setError("Failed to run global simulation. Ensure the AI Engine is connected.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetShifts = () => {
    setShifts(prev => prev.map(s => ({ ...s, percentage_change: 0 })));
    setResults(null);
  };

  // Run initial simulation with zero shifts to get baseline
  useEffect(() => {
    runSimulation();
  }, []);

  const chartData = results ? [
    { name: "Current", count: results.original_churn_count, rate: (results.original_churn_rate * 100).toFixed(1) },
    { name: "Simulated", count: results.modified_churn_count, rate: (results.modified_churn_rate * 100).toFixed(1) }
  ] : [];

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 text-gradient">Global Churn Simulation</h1>
          <p className="text-muted small">Simulate property shifts across the entire customer base using mathematical deduction.</p>
        </div>
        <div className="badge bg-primary-soft p-2">
          <i className="bi bi-cpu-fill me-2"></i>
          Deductive Inference Mode
        </div>
      </div>

      <div className="row g-4">
        {/* Controls Panel */}
        <div className="col-lg-4">
          <div className="glass-card p-4 h-100">
            <h5 className="mb-4">Simulation Parameters</h5>
            <p className="text-muted small mb-4">
              Adjust the percentage shift for key customer properties to see the aggregate impact on churn.
            </p>

            {shifts.map((s) => (
              <div key={s.feature} className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0 fw-bold">{s.feature}</label>
                  <span className={`badge ${s.percentage_change >= 0 ? "bg-success" : "bg-danger"}`}>
                    {s.percentage_change > 0 ? "+" : ""}{s.percentage_change}%
                  </span>
                </div>
                <input
                  type="range"
                  className="form-range"
                  min="-50"
                  max="50"
                  step="1"
                  value={s.percentage_change}
                  onChange={(e) => handlePercentageChange(s.feature, e.target.value)}
                />
                <div className="d-flex justify-content-between text-muted x-small">
                  <span>-50%</span>
                  <span>0%</span>
                  <span>+50%</span>
                </div>
              </div>
            ))}

            <div className="d-grid gap-2 mt-5">
              <button 
                className="btn btn-primary" 
                onClick={runSimulation}
                disabled={loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-play-fill me-2"></i>}
                Run Global Analysis
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={resetShifts}>
                Reset Baseline
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="col-lg-8">
          {error && (
            <div className="alert alert-danger glass-card border-danger mb-4">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </div>
          )}

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="glass-card p-3 text-center">
                <p className="text-muted small mb-1">Churn Count Change</p>
                <h2 className={`mb-0 ${results?.change_count > 0 ? "text-danger" : results?.change_count < 0 ? "text-success" : ""}`}>
                  {results ? (results.change_count > 0 ? "+" : "") + results.change_count : "--"}
                </h2>
                <p className="x-small text-muted mb-0">Total Customers Affected</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-3 text-center border-start-highlight">
                <p className="text-muted small mb-1">Churn Rate Shift</p>
                <h2 className={`mb-0 ${results?.change_percentage > 0 ? "text-danger" : results?.change_percentage < 0 ? "text-success" : ""}`}>
                  {results ? (results.change_percentage > 0 ? "+" : "") + results.change_percentage : "--"}%
                </h2>
                <p className="x-small text-muted mb-0">Percentage Point Basis</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card p-3 text-center">
                <p className="text-muted small mb-1">New Global Churn</p>
                <h2 className="mb-0">
                  {results ? (results.modified_churn_rate * 100).toFixed(1) : "--"}%
                </h2>
                <p className="x-small text-muted mb-0">Estimated Final Rate</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 mb-4" style={{ height: "350px" }}>
            <h5 className="mb-4">Distribution Comparison</h5>
            {results ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                  <XAxis dataKey="name" stroke="#888" axisLine={false} tickLine={false} />
                  <YAxis stroke="#888" axisLine={false} tickLine={false} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1a1c23", border: "1px solid #ffffff20", borderRadius: "8px" }}
                    cursor={{ fill: "#ffffff05" }}
                  />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={60} label={{ position: 'top', fill: '#fff', fontSize: 12, formatter: (val) => `${val}%` }}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#4361ee" : (results.change_count > 0 ? "#ef233c" : "#2ecc71")} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="d-flex justify-content-center align-items-center h-100">
                <div className="spinner-border text-primary"></div>
              </div>
            )}
          </div>

          {/* Methodology Box */}
          <div className="glass-card p-4 bg-primary-soft-dark border-0">
            <div className="d-flex align-items-center mb-3">
              <div className="bg-primary p-2 rounded-3 me-3">
                <i className="bi bi-function text-white"></i>
              </div>
              <h6 className="mb-0">Mathematical Implementation Details</h6>
            </div>
            <div className="text-muted small">
              <p className="mb-2">
                This result has been <strong>deduced by mathematical implementation</strong> using the model's internal coefficients.
              </p>
              <div className="bg-dark-soft p-3 rounded mb-3 font-monospace x-small text-light">
                P_new = Sigmoid( Logit_baseline + Σ ( Weight_j * (Percentage_j * Value_j / Scale_j) ) )
              </div>
              <p className="mb-0 italic">
                {results?.math_details || "Loading methodology documentation..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIf;
