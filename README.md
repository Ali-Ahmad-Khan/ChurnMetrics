YAML metadata for HuggingFace Build
---
title: ChurnMetrics
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
---
# ChurnMetrics MVP

### *Next-Gen Customer Retention & Predictive Analytics Platform*

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-EB2027?style=for-the-badge&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 🚀 The Vision
**ChurnMetrics** is a production-ready MVP designed to bridge the gap between raw data and actionable customer retention strategies. By combining a high-performance **XGBoost** predictive engine with **SHAP-based explainability** and a sleek **React dashboard**, ChurnMetrics empowers businesses to not just predict *who* will leave, but understand *why*—and simulate how to save them.

---

## ✨ Key Features

### 🧠 Dual-Engine AI Core
- **Stage 1 (Precision):** High-recall Logistic Regression for initial screening.
- **Stage 2 (Refinement):** XGBoost "Local Expert" model focused on high-uncertainty bands (0.2 - 0.8 probability).
- **Explainability:** Integrated **SHAP** values to reveal the top 3 drivers for every single prediction.

### 🎛️ Interactive "What-If" Simulator
Test retention strategies in real-time. What happens if we offer a 15% discount to all high-risk Fiber Optic users? The simulator recalculates the predicted churn risk instantly.

### 📈 Executive Dashboard
- **Live Risk Pulse:** Real-time visibility into customer health.
- **Segment Analysis:** Breakdowns by contract type, tenure, and payment method.
- **AI Rescue Suggestions:** Generative insights powered by **Google Gemini** to suggest personalized rescue campaigns.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Custom Vanilla CSS, Lucide Icons |
| **Orchestrator** | Node.js, Express, MongoDB Atlas |
| **AI Engine** | FastAPI, XGBoost, Scikit-learn, SHAP |
| **LLM Integration** | Google Gemini (Insight Generation) |
| **Deployment** | Docker, Vercel, Uvicorn |

---

## 📁 Project Structure

```bash
├── client/          # React + Vite Frontend
├── server/          # Node.js Express API (Orchestration)
├── api/             # FastAPI Engine (ML & Simulations)
├── models/          # Serialized XGBoost & Scalar Models
├── data/            # Sample Datasets & EDA Notebooks
├── src/             # Shared Source Code
└── Dockerfile       # Containerization for AI Engine
```

---

## 🚦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python 3.10+
- MongoDB Atlas Connection

# Ports
EXPRESS_PORT=5001
FASTAPI_PORT=8000
```

### 3. Installation & Launch
```bash
# Install and Start AI Engine
pip install -r requirements.txt
uvicorn api.main:app --port 8000

# Install and Start Backend
cd server && npm install && npm run dev

# Install and Start Frontend
cd ../client && npm install && npm run dev
```

---

## 🖼️ Mockup Preview (FUTURE WORKS)
![Dashboard Mockup](client/public/dashboard-mockup-final.png)

---

## 📝 License
Distributed under the MIT License.
