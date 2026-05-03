import { useFetch } from "../hooks/useFetch";
import { getAnalytics } from "../services/api";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#adb5bd" } },
  },
  scales: {
    x: { ticks: { color: "#adb5bd" }, grid: { color: "rgba(255,255,255,0.05)" } },
    y: { ticks: { color: "#adb5bd" }, grid: { color: "rgba(255,255,255,0.05)" } },
  },
};

function ChartCard({ title, icon, children, height = 300 }) {
  return (
    <div className="card bg-dark border-secondary h-100">
      <div className="card-header border-secondary">
        <h6 className="text-white mb-0">
          <i className={`bi ${icon} me-2 text-info`}></i>{title}
        </h6>
      </div>
      <div className="card-body" style={{ height }}>
        {children}
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data, loading, error } = useFetch(getAnalytics);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-info" style={{ width: "3rem", height: "3rem" }}></div>
        <div className="text-secondary mt-3">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>Failed to load analytics: {error}
      </div>
    );
  }

  // ── Contract chart data ──
  const contractLabels = [...new Set(data.churnByContract.map((d) => d._id.contract))];
  const contractChurned = contractLabels.map(
    (c) => data.churnByContract.find((d) => d._id.contract === c && d._id.churn === "Yes")?.count || 0
  );
  const contractStayed = contractLabels.map(
    (c) => data.churnByContract.find((d) => d._id.contract === c && d._id.churn === "No")?.count || 0
  );

  // ── Internet chart data ──
  const internetLabels = [...new Set(data.churnByInternet.map((d) => d._id.internet))];
  const internetChurned = internetLabels.map(
    (i) => data.churnByInternet.find((d) => d._id.internet === i && d._id.churn === "Yes")?.count || 0
  );
  const internetStayed = internetLabels.map(
    (i) => data.churnByInternet.find((d) => d._id.internet === i && d._id.churn === "No")?.count || 0
  );

  // ── Tenure distribution data ──
  const tenureData = data.tenureDistribution || [];
  const tenureLabels = tenureData.map((d) =>
    d._id === "72+" ? "72+" : `${d._id}–${d._id + 12}mo`
  );

  return (
    <div>
      <h2 className="text-white fw-bold mb-1">
        <i className="bi bi-graph-up me-2 text-info"></i>Analytics
      </h2>
      <p className="text-secondary mb-4">Churn analysis and customer behavior insights</p>

      {/* Row 1: Contract + Internet */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <ChartCard title="Churn by Contract Type" icon="bi-file-earmark-text">
            <Bar
              options={chartOpts}
              data={{
                labels: contractLabels,
                datasets: [
                  { label: "Churned", data: contractChurned, backgroundColor: "#dc3545" },
                  { label: "Stayed", data: contractStayed, backgroundColor: "#198754" },
                ],
              }}
            />
          </ChartCard>
        </div>

        <div className="col-md-6">
          <ChartCard title="Churn by Internet Service" icon="bi-wifi">
            <Bar
              options={chartOpts}
              data={{
                labels: internetLabels,
                datasets: [
                  { label: "Churned", data: internetChurned, backgroundColor: "#dc3545" },
                  { label: "Stayed", data: internetStayed, backgroundColor: "#198754" },
                ],
              }}
            />
          </ChartCard>
        </div>
      </div>

      {/* Row 2: Tenure + Charges */}
      <div className="row g-3 mb-3">
        <div className="col-md-8">
          <ChartCard title="Churn by Customer Tenure" icon="bi-calendar-range">
            <Bar
              options={chartOpts}
              data={{
                labels: tenureLabels,
                datasets: [
                  { label: "Total Customers", data: tenureData.map((d) => d.count), backgroundColor: "rgba(13,202,240,0.4)" },
                  { label: "Churned", data: tenureData.map((d) => d.churnCount), backgroundColor: "#dc3545" },
                ],
              }}
            />
          </ChartCard>
        </div>

        <div className="col-md-4">
          <div className="card bg-dark border-secondary h-100">
            <div className="card-header border-secondary">
              <h6 className="text-white mb-0">
                <i className="bi bi-currency-dollar me-2 text-info"></i>Avg Charges by Churn Status
              </h6>
            </div>
            <div className="card-body">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr className="text-secondary">
                    <th>Status</th>
                    <th>Avg Monthly</th>
                    <th>Avg Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.chargesByChurn || []).map((c) => (
                    <tr key={c._id}>
                      <td>
                        <span className={`badge bg-${c._id === "Yes" ? "danger" : "success"}`}>
                          {c._id === "Yes" ? "Churned" : "Stayed"}
                        </span>
                      </td>
                      <td className="text-white">${c.avgMonthly?.toFixed(2)}</td>
                      <td className="text-white">${c.avgTotal?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Model Info */}
      {data.modelInfo && (
        <div className="card bg-dark border-secondary">
          <div className="card-header border-secondary">
            <h6 className="text-white mb-0">
              <i className="bi bi-cpu me-2 text-info"></i>Active Model Configuration
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <small className="text-secondary d-block">Model Type</small>
                <span className="text-white fw-bold">{data.modelInfo.model_type}</span>
              </div>
              <div className="col-md-3">
                <small className="text-secondary d-block">Optimal Threshold</small>
                <span className="text-info fw-bold fs-5">{data.modelInfo.optimal_threshold}</span>
              </div>
              <div className="col-md-6">
                <small className="text-secondary d-block">Description</small>
                <span className="text-white">{data.modelInfo.description}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
