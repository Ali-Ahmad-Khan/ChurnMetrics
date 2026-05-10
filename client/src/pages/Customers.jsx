import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { getCustomers } from "../services/api";
import { useReveal } from "../hooks/useReveal";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const revealRef = useReveal();

  const fetchCustomers = useCallback((p, s) => {
    setLoading(true);
    getCustomers(p, 20, s).then((res) => {
      const { customers: list, pagination } = res.data;
      setCustomers(Array.isArray(list) ? list : []);
      setTotalPages(pagination?.totalPages || 1);
      setTotalRecords(pagination?.total || 0);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to fetch customers:", err);
      setCustomers([]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(page, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search, fetchCustomers]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  if (loading && customers.length === 0) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-info"></div>
    </div>
  );

  return (
    <div className="reveal" ref={revealRef}>
      <div className="panel-header mb-4">
        <div>
          <h1 className="panel-title fs-2">Customer Intelligence</h1>
          <p className="text-secondary small">Monitor behavioral trends and risk scores across {totalRecords.toLocaleString()} customers.</p>
        </div>
        <div style={{ width: 300 }}>
          <div className="position-relative">
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
            <input
              type="text"
              className="form-input-custom ps-5"
              placeholder="Search ID or Contract..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      <div className="card-custom p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="table-custom">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Contract</th>
                <th>Monthly Charge</th>
                <th>Total Charges</th>
                <th>Risk Profile</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
              {customers.map((c) => (
                <tr key={c.customerID}>
                  <td>
                    <div className="fw-bold">{c.customerID}</div>
                    <div className="text-secondary small">{c.gender} | {c.Partner === 'Yes' ? 'Partnered' : 'Single'}</div>
                  </td>
                  <td>{c.Contract}</td>
                  <td className="fw-medium">${c.MonthlyCharges}</td>
                  <td className="fw-medium">${c.TotalCharges?.toLocaleString() || 0}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="progress flex-grow-1" style={{ height: 6, maxWidth: 60, background: 'var(--bg-surface-2)' }}>
                        <div 
                          className={`progress-bar ${c.Churn === 'Yes' ? 'bg-danger' : 'bg-success'}`} 
                          style={{ width: c.Churn === 'Yes' ? '100%' : '10%' }}
                        ></div>
                      </div>
                      <span className="fw-bold" style={{ fontSize: '0.85rem' }}>{c.Churn === 'Yes' ? 'High' : 'Low'}</span>
                    </div>
                  </td>
                  <td>
                    <Link 
                      to={`/customers/${c.customerID}`} 
                      className="btn-ghost-custom py-1 px-3 text-decoration-none"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Analyze
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {customers.length === 0 && !loading && (
          <div className="text-center py-5">
            <i className="bi bi-person-x text-muted fs-1 mb-3 d-block"></i>
            <p className="text-secondary">No customers found matching your search.</p>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="p-3 border-top border-subtle d-flex justify-content-between align-items-center bg-surface-1">
          <div className="text-secondary small">
            Showing page {page} of {totalPages} | Total: {totalRecords.toLocaleString()}
          </div>
          <div className="d-flex gap-2">
            <button 
              className="btn-ghost-custom px-3 py-1" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              Previous
            </button>
            <button 
              className="btn-ghost-custom px-3 py-1" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
