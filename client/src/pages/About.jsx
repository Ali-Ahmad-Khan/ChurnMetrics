import { useFetch } from "../hooks/useFetch";
import { getSystemInfo } from "../services/api";
import { useReveal } from "../hooks/useReveal";

export default function About() {
  const { data, loading } = useFetch(getSystemInfo);
  const revealRef = useReveal();

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-info"></div>
    </div>
  );

  return (
    <div className="reveal" ref={revealRef}>
      <div className="panel-header mb-4">
        <div>
          <h1 className="panel-title fs-2">Platform Overview</h1>
          <p className="text-secondary small">Technical specifications and system status of the ChurnMetrics environment.</p>
        </div>
      </div>

      <div className="card-custom mb-4">
        <h2 className="panel-title mb-3">System Description</h2>
        <p className="text-secondary" style={{ lineHeight: 1.7 }}>{data?.description}</p>
      </div>

      <div className="row g-4 reveal-group">
        <div className="col-lg-8">
          <div className="card-custom">
            <div className="panel-header">
              <h2 className="panel-title">System Architecture</h2>
            </div>
            <div className="row g-4">
              {data?.architecture && Object.entries(data.architecture).map(([k, v]) => (
                <div className="col-md-4" key={k}>
                  <div className="text-secondary small text-capitalize mb-1">{k}</div>
                  <div className="fw-bold">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-custom mt-4">
            <div className="panel-header">
              <h2 className="panel-title">Core Capabilities</h2>
            </div>
            <div className="row g-3">
              {(data?.features || []).map((f, i) => (
                <div className="col-md-6" key={i}>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-check2-circle text-success"></i>
                    <span className="text-secondary small">{f}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card-custom h-100">
            <div className="panel-header">
              <h2 className="panel-title">AI Engine Status</h2>
            </div>
            <div className="text-center py-4">
              <div className={`badge-custom fs-6 mb-3 ${data?.aiEngine?.status === "ok" ? "badge-success" : "badge-danger"}`}>
                {data?.aiEngine?.status === "ok" ? "Operational" : "Degraded"}
              </div>
              <div className="text-secondary small">Model: {data?.aiEngine?.modelLoaded ? "Fully Loaded" : "Pending"}</div>

              <div className="mt-5 text-start pt-4 border-top border-subtle">
                <h3 className="panel-title fs-6 mb-3">Intelligence Details</h3>
                {data?.modelInfo ? (
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <div className="text-secondary small mb-1">Architecture</div>
                      <div className="fw-bold">{data.modelInfo.modelType}</div>
                    </div>
                    <div>
                      <div className="text-secondary small mb-1">Confidence Threshold</div>
                      <div className="fw-bold text-accent" style={{ color: 'var(--accent)' }}>{data.modelInfo.optimalThreshold}</div>
                    </div>
                    <p className="text-muted extra-small mt-2" style={{ fontSize: '0.75rem' }}>{data.modelInfo.description}</p>
                  </div>
                ) : <span className="text-secondary">Details unavailable</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
