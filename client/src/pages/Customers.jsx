import { useState } from "react";
import { useFetch } from "../hooks/useFetch";
import { getCustomers } from "../services/api";
import { Link } from "react-router-dom";

export default function Customers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, loading, error } = useFetch(
    () => getCustomers(page, 20, search),
    [page, search]
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-white fw-bold mb-0">Customer Directory</h2>
          <p className="text-secondary mb-0">Browse and search customer profiles</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="input-group">
          <input
            type="text"
            className="form-control bg-dark text-white border-secondary"
            placeholder="Search by Customer ID, gender, or contract type..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button className="btn btn-info" type="submit">
            <i className="bi bi-search me-1"></i> Search
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info"></div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <div className="card bg-dark border-secondary">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-dark table-hover mb-0">
                  <thead>
                    <tr className="text-secondary">
                      <th>Customer ID</th>
                      <th>Gender</th>
                      <th>Tenure</th>
                      <th>Contract</th>
                      <th>Monthly $</th>
                      <th>Internet</th>
                      <th>Churn</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers.map((c) => (
                      <tr key={c.customerID}>
                        <td className="text-info fw-bold">{c.customerID}</td>
                        <td>{c.gender}</td>
                        <td>{c.tenure} mo</td>
                        <td>
                          <span className="badge bg-secondary">{c.Contract}</span>
                        </td>
                        <td>${c.MonthlyCharges?.toFixed(2)}</td>
                        <td>{c.InternetService}</td>
                        <td>
                          <span className={`badge bg-${c.Churn === "Yes" ? "danger" : "success"}`}>
                            {c.Churn}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/customers/${c.customerID}`}
                            className="btn btn-sm btn-outline-info"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {data.pagination && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-secondary">
                Showing {(page - 1) * 20 + 1}–
                {Math.min(page * 20, data.pagination.total)} of{" "}
                {data.pagination.total}
              </span>
              <div className="btn-group">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <i className="bi bi-chevron-left"></i> Prev
                </button>
                <button className="btn btn-sm btn-outline-secondary disabled">
                  Page {page} / {data.pagination.totalPages}
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
