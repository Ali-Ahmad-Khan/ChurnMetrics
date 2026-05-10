import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import './Landing.css';

const FAQ_DATA = [
  {
    question: "How accurate are the churn predictions?",
    answer: "Our models utilize state-of-the-art XGBoost and Logistic Regression architectures, achieving over 85% recall on historical datasets. We continuously monitor model drift to ensure accuracy remains high as user behavior evolves."
  },
  {
    question: "What kind of data do I need to provide?",
    answer: "The platform analyzes customer engagement metrics, subscription details, support interaction history, and usage frequency. You can upload CSV data or connect directly to your database for real-time analysis."
  },
  {
    question: "Can I simulate different business scenarios?",
    answer: "Yes! Our 'What-If' simulation engine allows you to adjust parameters like pricing, feature engagement, and support response times to see the predicted impact on your overall churn rate."
  },
  {
    question: "How does the AI identify 'At-Risk' customers?",
    answer: "Our AI looks for subtle patterns in behavioral shifts—such as decreasing login frequency or reduced feature depth—that often precede a cancellation, categorizing customers into Low, Medium, and High risk segments."
  },
  {
    question: "Is there an API for integration?",
    answer: "Absolutely. We provide a full REST API that allows you to trigger predictions programmatically and ingest the results back into your CRM or marketing automation tools."
  },
  {
    question: "What is 'Drift Detection'?",
    answer: "Drift detection monitors the performance of your AI models over time. If customer behavior changes significantly from the data the model was trained on, we alert you so you can retrain the model for better accuracy."
  }
];
export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useReveal();
  const featuresRef = useReveal();
  const featuresGridRef = useReveal();
  const howItWorksRef = useReveal();
  const stepsRef = useReveal();
  const faqRef = useReveal();
  const ctaRef = useReveal();
  
  const [activeFaq, setActiveFaq] = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="landing-wrapper">
      <Navbar />
      <div className="landing-container">
        {/* --- HERO SECTION --- */}
        <section className="hero reveal" ref={heroRef}>
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <i className="bi bi-stars me-2"></i>
                AI-Powered Churn Intelligence
              </div>
              <h1 className="hero-title">
                Predict <span className="text-gradient">Customer Churn</span> Before It Happens
              </h1>
              <p className="hero-subtitle">
                Harness the power of Stage-2 Machine Learning to identify at-risk customers, 
                simulate what-if scenarios, and automate retention strategies with ChurnMetrics.
              </p>
              <div className="hero-ctas">
                <NavLink to="/login" className="btn-primary-custom">
                  Get Started Free
                </NavLink>
                <a href="#features" className="btn-ghost-custom">
                  Explore Features
                </a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="visual-card">
                <img
                  src="/dashboard-actual.png"
                  alt="ChurnMetrics Dashboard"
                  className="img-fluid"
                />
                <div className="visual-overlay"></div>
              </div>
            </div>
          </div>
        </section>

        {/* --- FEATURES SECTION --- */}
        <section id="features" className="section reveal" ref={featuresRef}>
          <div className="section-header">
            <span className="section-label">Features</span>
            <h2 className="section-title">Everything you need to scale</h2>
            <p className="section-subtitle">Powerful tools designed to give you a deep understanding of your customer health.</p>
          </div>
          
          <div className="feature-grid reveal-group" ref={featuresGridRef}>
            <div className="feature-card">
              <div className="feature-icon"><i className="bi bi-cpu"></i></div>
              <h3 className="feature-title">Predictive Analytics</h3>
              <p className="feature-body">Identify high-risk segments using our proprietary cascade model architecture optimized for high precision.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="bi bi-shuffle"></i></div>
              <h3 className="feature-title">What-If Simulations</h3>
              <p className="feature-body">Simulate the impact of pricing changes or product updates on your churn rate before you roll them out.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><i className="bi bi-shield-exclamation"></i></div>
              <h3 className="feature-title">Drift Detection</h3>
              <p className="feature-body">Automatically monitor model performance to ensure your predictions stay accurate as market trends shift.</p>
            </div>
          </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section id="how-it-works" className="section reveal" ref={howItWorksRef}>
          <div className="section-header">
            <span className="section-label">Process</span>
            <h2 className="section-title">Simple. Transparent. Actionable.</h2>
          </div>
          
          <div className="steps-grid reveal-group" ref={stepsRef}>
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Connect Data</h3>
              <p className="step-desc">Upload your historical customer data or connect your database securely via our API.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Run Prediction</h3>
              <p className="step-desc">Our AI processes thousands of data points to generate individualized risk scores for your entire base.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Take Action</h3>
              <p className="step-desc">Use detailed risk reasoning to design personalized rescue campaigns and prevent churn.</p>
            </div>
          </div>
        </section>

        {/* --- FAQ SECTION --- */}
        <section id="faq" className="section reveal" ref={faqRef}>
          <div className="section-header">
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          
          <div className="faq-list">
            {FAQ_DATA.map((item, index) => (
              <div key={index} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
                <button className="faq-question" onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
                  {item.question}
                  <i className={`bi bi-chevron-down faq-icon`}></i>
                </button>
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- CTA BANNER --- */}
        <section className="cta-banner reveal" ref={ctaRef}>
          <h2 className="cta-title">Ready to stop losing customers?</h2>
          <NavLink to="/login" className="btn-primary-custom">Start Your Analysis Now</NavLink>
        </section>

        {/* --- FOOTER --- */}
        <footer className="footer">
          <div className="footer-content">
            <NavLink className="navbar-brand-custom" to="/">
              <i className="bi bi-activity brand-icon"></i>
              <span>Churn<span style={{ color: 'var(--text-secondary)' }}>Metrics</span></span>
            </NavLink>
            
            <div className="footer-links">
              <a href="#features" className="footer-link">Features</a>
              <a href="#how-it-works" className="footer-link">Process</a>
              <a href="#faq" className="footer-link">FAQ</a>
              <NavLink to="/login" className="footer-link">Login</NavLink>
            </div>
            
            <div className="copyright">
              © 2026 ChurnMetrics Inc. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
