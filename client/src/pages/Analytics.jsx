import { useEffect, useState } from "react";
import { getAnalytics } from "../services/api";
import { useReveal } from "../hooks/useReveal";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';

// Colors matching the design tokens
const COLORS = {
  accent: '#7c3aed',
  accentHover: '#6d28d9',
  secondary: '#8b8aa8',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#55546e'
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const revealRef = useReveal();

  useEffect(() => {
    getAnalytics().then((res) => {
      console.log("Analytics Response:", res.data);
      const raw = res.data || {};
      
      // Transform Churn by Contract
      const contractMap = {};
      (raw.churnByContract || []).forEach(item => {
        const id = item._id || {};
        const contract = id.contract || 'Unknown';
        const churn = id.churn || 'No';
        if (!contractMap[contract]) contractMap[contract] = { name: contract, active: 0, churned: 0 };
        if (churn === 'Yes') contractMap[contract].churned = item.count;
        else contractMap[contract].active = item.count;
      });
      
      // Transform Churn by Internet
      const internetMap = {};
      (raw.churnByInternet || []).forEach(item => {
        const id = item._id || {};
        const internet = id.internet || 'Unknown';
        const churn = id.churn || 'No';
        if (!internetMap[internet]) internetMap[internet] = { name: internet, active: 0, churned: 0 };
        if (churn === 'Yes') internetMap[internet].churned = item.count;
        else internetMap[internet].active = item.count;
      });

      const analyticsData = res.data;
      
      // 1. Contract Distribution
      let contracts = [];
      if (analyticsData.churnByContract) {
        // Aggregate from customers
        const map = {};
        analyticsData.churnByContract.forEach(item => {
          const type = item._id.contract;
          if (!map[type]) map[type] = { name: type, value: 0 };
          map[type].value += item.count;
        });
        contracts = Object.values(map);
      } else {
        // Fallback or explicit mapping
        contracts = (analyticsData.contractData || analyticsData.contract_distribution || []).map(item => ({
          name: item._id || item.type || 'Unknown',
          value: item.count || item.value || 0
        }));
      }

      // 2. Internet Service Distribution
      let internet = [];
      if (analyticsData.churnByInternet) {
        const map = {};
        analyticsData.churnByInternet.forEach(item => {
          const type = item._id.internet;
          if (!map[type]) map[type] = { name: type, value: 0 };
          map[type].value += item.count;
        });
        internet = Object.values(map);
      } else {
        internet = (analyticsData.internetData || analyticsData.internet_service_distribution || []).map(item => ({
          name: item._id || item.type || 'Unknown',
          value: item.count || item.value || 0
        }));
      }

      // 3. Tenure Distribution
      const tenure = (analyticsData.tenureDistribution || analyticsData.tenure_distribution || []).map(item => ({
        name: typeof item._id === 'string' ? item._id : `${item._id}mo`,
        count: item.count || 0,
        churned: item.churnCount || item.churned || 0,
      })).sort((a, b) => parseInt(a.name) - parseInt(b.name));

      setData({
        ...raw,
        contractData: Object.values(contractMap).length > 0 ? Object.values(contractMap) : contracts,
        internetData: Object.values(internetMap).length > 0 ? Object.values(internetMap) : internet,
        tenureData: tenure,
        predictionsData: (raw.monthlyPredictions || []).slice().reverse().map(p => ({
          ...p,
          name: p._id,
          count: p.count || 0,
          churners: p.churners || 0
        }))
      });
      setLoading(false);
    }).catch(err => {
      console.error("Analytics fetch failed:", err);
      setError("Failed to load analytics data. Please ensure the backend and database are active.");
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-info"></div>
    </div>
  );

  if (error) return (
    <div className="container mt-5">
      <div className="alert alert-warning border-0 card-custom shadow-sm">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
      </div>
    </div>
  );

  const hasData = data && (data.contractData.length > 0 || data.internetData.length > 0 || data.tenureData.length > 0);

  return (
    <div className="reveal" ref={revealRef}>
      <div className="panel-header mb-4">
        <div>
          <h1 className="panel-title fs-2">Deep Analytics</h1>
          <p className="text-secondary small">Comprehensive breakdown of churn drivers and performance metrics.</p>
        </div>
      </div>

      {!hasData ? (
        <div className="card-custom text-center py-5">
          <i className="bi bi-bar-chart text-muted fs-1 mb-3 d-block"></i>
          <p className="text-secondary">Insufficient data to generate analytics. Start by running some predictions or uploading customer data.</p>
        </div>
      ) : (
        <div className="row g-4 reveal-group">
          {/* Churn by Contract Type */}
          <div className="col-lg-6">
            <div className="card-custom">
              <h3 className="panel-title mb-4">Churn by Contract</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.contractData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bg-surface-2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="active" fill={COLORS.success} radius={[4, 4, 0, 0]} name="Active" />
                    <Bar dataKey="churned" fill={COLORS.danger} radius={[4, 4, 0, 0]} name="Churned" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Internet Service Impact */}
          <div className="col-lg-6">
            <div className="card-custom">
              <h3 className="panel-title mb-4">Internet Service Impact</h3>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.internetData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--bg-surface-2)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="active" fill={COLORS.accent} radius={[4, 4, 0, 0]} name="Active" />
                    <Bar dataKey="churned" fill={COLORS.warning} radius={[4, 4, 0, 0]} name="Churned" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tenure Distribution */}
          <div className="col-12">
            <div className="card-custom">
              <h3 className="panel-title mb-4">Tenure Distribution & Churn Risk</h3>
              <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.tenureData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-surface-2)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" />
                    <Line type="monotone" dataKey="count" stroke={COLORS.accent} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Total Customers" />
                    <Line type="monotone" dataKey="churned" stroke={COLORS.danger} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Churned" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
