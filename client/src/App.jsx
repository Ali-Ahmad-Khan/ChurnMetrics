import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Predict from "./pages/Predict";
import Predictions from "./pages/Predictions";
import PredictionDetail from "./pages/PredictionDetail";
import WhatIf from "./pages/WhatIf";
import Analytics from "./pages/Analytics";
import Drift from "./pages/Drift";
import About from "./pages/About";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

function ProtectedLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="min-vh-100 bg-dark">
        <Navbar />
        <main className="container-fluid" style={{ paddingTop: "76px" }}>
          <div className="py-4">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/customers" element={<ProtectedLayout><Customers /></ProtectedLayout>} />
          <Route path="/customers/:id" element={<ProtectedLayout><CustomerDetail /></ProtectedLayout>} />
          <Route path="/predict" element={<ProtectedLayout><Predict /></ProtectedLayout>} />
          <Route path="/predictions" element={<ProtectedLayout><Predictions /></ProtectedLayout>} />
          <Route path="/predictions/:id" element={<ProtectedLayout><PredictionDetail /></ProtectedLayout>} />
          <Route path="/whatif" element={<ProtectedLayout><WhatIf /></ProtectedLayout>} />
          <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
          <Route path="/drift" element={<ProtectedLayout><Drift /></ProtectedLayout>} />
          <Route path="/about" element={<ProtectedLayout><About /></ProtectedLayout>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
