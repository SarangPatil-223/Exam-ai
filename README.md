# NeuralExam — Precision Assessment Platform

![Project Banner](https://raw.githubusercontent.com/SarangPatil-223/Exam-ai/main/client/public/banner.png) <!-- Note: Replace with actual banner if available -->

NeuralExam is a secure, enterprise-grade digital examination infrastructure designed for universities, professional certification bodies, and institutional learning programmes. It leverages advanced psychometrics and computer vision to deliver high-stakes assessments with mathematical precision and verified integrity.

## 🚀 Key Features

### 1. Adaptive Testing Engine (CAT)
Utilises **Item Response Theory (IRT 3PL)** with Bayesian ability estimation. The system dynamically selects the "optimal next item" for each candidate to maximise Fisher information at their current ability level ($\theta$), significantly reducing test length while maintaining measurement precision.

### 2. AI-Powered Proctoring
Continuous integrity monitoring via multi-modal AI feedback loops:
- **Computer Vision:** Facial presence verification, gaze trajectory analysis, and multiple-person detection (YOLOv8/ArcFace).
- **Audio Analysis:** Environmental noise spike detection and vocal anomaly monitoring.
- **System Integrity:** Browser tab-switch detection and focal window tracking.

### 3. Automated Response Evaluation
- **Closed-Ended:** Instant, deterministic scoring for MCQ and multi-select items.
- **Constructed-Response:** Hybrid semantic evaluation using **DeBERTa-v3** similarity models vs. institutional rubrics. Supports partial-credit allocation and rubric-aligned feedback.

### 4. Institutional Analytics
Comprehensive post-administration reporting:
- **Item Analysis:** p-values, point-biserial correlations, and IRT parameter fit.
- **Cohort Mapping:** Bloom’s Taxonomy distribution heatmaps and relative performance benchmarking.
- **Audit Logs:** Full proctoring incident timelines with frame-specific risk scoring.

## 🛠 Technology Stack

- **Frontend:** React, Vite, Chart.js, Spline (3D Visualization)
- **Design System:** Desktop-first Enterprise UI, IBM Plex Sans typography, Deep Navy Palette
- **Backend:** Node.js, Express.js
- **Intelligence:** IRT 3PL (Adaptive), DeBERTa-v3 (NLP), YOLOv8 (Vision)
- **Infrastructure:** Kubernetes-ready microservices, Stateless session design

## 📂 Project Structure

```text
├── client/          # Vite + React Frontend
│   ├── src/
│   │   ├── engines/ # Adaptive & Proctoring logic
│   │   ├── components/
│   │   └── pages/   # Landing, Exam, Results, Dashboards
├── server/          # Node.js + Express Backend
│   ├── routes/      # Question & Evaluation APIs
│   └── engines/     # Adaptive item selection service
└── package.json     # Root workspace configuration
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm

### Quick Start
1. **Clone the repository:**
   ```bash
   git clone https://github.com/SarangPatil-223/Exam-ai.git
   cd Exam-ai
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

3. **Launch the development environment:**
   ```bash
   npm run dev
   ```
   *This will launch both the Client (usually Port 5173) and the Server (Port 3001) concurrently.*

## 🔒 Security & Compliance
Designed with institutional data privacy in mind:
- **GDPR & FERPA Aware:** Minimal PII retention and local data residency support.
- **Encryption:** AES-256 for data-at-rest; TLS 1.3 in-transit.
- **Zero-Trust:** Role-based access control (RBAC) across all administrative endpoints.

## 📄 License
This project is licensed under the [MIT License](LICENSE).

---
*Built for the future of intelligent institutional assessment.*
