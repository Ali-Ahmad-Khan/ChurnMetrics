import { useFetch } from "../hooks/useFetch";
import { getSystemInfo } from "../services/api";

export default function About() {
  const { data, loading } = useFetch(getSystemInfo);
  if (loading) return <div className="text-center py-5"><div className="spinner-border text-info"></div></div>;

  return (<div>
    <h2 className="text-white fw-bold mb-1"><i className="bi bi-info-circle me-2 text-info"></i>About ChurnMetrics</h2>
    <p className="text-secondary mb-4">{data?.description}</p>

    <div className="card bg-dark border-secondary mb-3">
      <div className="card-header border-secondary"><h6 className="text-white mb-0">System Architecture</h6></div>
      <div className="card-body">
        <div className="row">{data?.architecture && Object.entries(data.architecture).map(([k, v]) => (
          <div className="col-md-4 mb-3" key={k}>
            <small className="text-secondary text-capitalize">{k}</small>
            <div className="text-white fw-bold">{v}</div>
          </div>
        ))}</div>
      </div>
    </div>

    <div className="card bg-dark border-secondary mb-3">
      <div className="card-header border-secondary"><h6 className="text-white mb-0">Features</h6></div>
      <div className="card-body">
        <div className="row">{(data?.features || []).map((f, i) => (
          <div className="col-md-4 mb-2" key={i}><i className="bi bi-check-circle text-success me-2"></i><span className="text-white">{f}</span></div>
        ))}</div>
      </div>
    </div>

    <div className="row g-3">
      <div className="col-md-6">
        <div className="card bg-dark border-secondary h-100">
          <div className="card-header border-secondary"><h6 className="text-white mb-0">AI Engine Status</h6></div>
          <div className="card-body text-center">
            <span className={`badge bg-${data?.aiEngine?.status === "ok" ? "success" : "danger"} fs-5`}>
              {data?.aiEngine?.status === "ok" ? "Online" : "Offline"}
            </span>
            <div className="mt-2"><small className="text-secondary">Model Loaded: {data?.aiEngine?.model_loaded ? "Yes" : "No"}</small></div>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card bg-dark border-secondary h-100">
          <div className="card-header border-secondary"><h6 className="text-white mb-0">Model Details</h6></div>
          <div className="card-body">
            {data?.modelInfo ? (<>
              <div className="mb-2"><small className="text-secondary">Type:</small> <span className="text-white">{data.modelInfo.model_type}</span></div>
              <div className="mb-2"><small className="text-secondary">Threshold:</small> <span className="text-info fw-bold">{data.modelInfo.optimal_threshold}</span></div>
              <div><small className="text-secondary">Description:</small> <span className="text-white">{data.modelInfo.description}</span></div>
            </>) : <span className="text-secondary">Unavailable</span>}
          </div>
        </div>
      </div>
    </div>
  </div>);
}
