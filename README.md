# MachineInsight Pro – AI Predictive Maintenance Platform

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/) [![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)](https://machine-insight-pro.vercel.app/) [![Live Demo](https://img.shields.io/badge/Live-Demo-blue.svg)](https://machine-insight-pro.vercel.app/)

---

## Live Demo

Try the platform instantly in your browser:

https://machine-insight-pro.vercel.app/

---

## Project Showcase

A quick look at the real-time AI-driven maintenance predictions, from telemetry input to interactive charts and gauges.

![MachineInsight Pro Demo GIF](https://github.com/saiabhinav001/machine-insight-pro/releases/download/v1.0.0-assets/MachineInsight.Live.Demo.gif)

---

## About The Project

MachineInsight Pro is an enterprise-grade web application that transforms how industrial operators predict equipment failures. It leverages IBM Watson AutoAI to automatically generate, optimize, and deploy a LightGBM classifier for real-time telemetry analysis. By moving from reactive to proactive maintenance, organizations can significantly reduce downtime and cut operational costs.

---

## Key Features

- Interactive glass-morphism UI with dynamic gauges, charts, and input controls  
- Automated model generation via IBM Watson AutoAI  
- Top-performing LightGBM classifier with automated feature engineering and hyperparameter optimization  
- Secure API handling through Vercel Serverless Functions  
- Real-time analytics dashboard powered by Chart.js  
- Advanced animations enabled by GSAP  
- Fully responsive design built with Tailwind CSS  

---

## Platform Documentation

### Platform Overview

MachineInsight Pro ingests live machine telemetry—torque, speed, temperature, wear, and quality type—and returns failure-risk predictions in milliseconds. The AI pipeline ranks multiple models, selects the best LightGBM pipeline, and continuously updates performance metrics to maintain 99.4 % F1-weighted accuracy.

### Technology Stack & Architecture

#### Frontend Technologies

| Technology       | Description                                                           |
|------------------|-----------------------------------------------------------------------|
| HTML5            | Semantic markup and structure                                        |
| Tailwind CSS     | Utility-first framework for rapid, responsive styling                 |
| GSAP             | High-performance animations and transitions                           |
| Chart.js         | Interactive, real-time data visualizations                            |
| Glass-morphism   | Modern UI design system for immersive user experience                 |

#### Backend & AI

| Technology                    | Description                                                  |
|-------------------------------|--------------------------------------------------------------|
| IBM Watson AutoAI            | Automated model generation, ranking, and deployment         |
| LightGBM Classifier (LGBM)   | Selected top model for predictive performance                |
| Automated HPO & Feature Eng.  | Hyperparameter tuning and engineered features at scale       |
| Vercel Serverless Functions  | Secure proxy for API calls and environment variable handling |

### Architectural Overview

1. **Client (Browser):** User inputs telemetry values and clicks “Analyze”  
2. **Vercel Function (`/api/predict`):** Receives data, injects IBM credentials from environment variables  
3. **IBM Watson AutoAI Endpoint:** Executes the LightGBM pipeline and returns prediction  
4. **Response Relay:** Serverless function forwards the result for display in the UI  

This decoupled design ensures the secret API key never reaches the browser and solves CORS/security constraints.

---

## Model Performance & Limitations

### Strengths

- 99.4 % F1-weighted score on standard failure modes  
- Nine model pipelines generated and ranked in under 12 minutes  
- Automated feature engineering and hyperparameter optimization  

### Limitations

- Performance depends on the quality and representativeness of incoming data  
- Less accurate on extremely rare or novel failure events  
- Requires periodic retraining to adapt to new equipment types or changing operating conditions  

---

## Project Structure

```
/
├── index.html
├── package.json
├── LICENSE.md
├── README.md
└── api/
    └── predict.js
```

---

## Getting Started (Local Development)

### Prerequisites

1. Node.js (v18 or later)  
2. npm

### Installation Steps

1. Clone the repository:  
   ```sh
   git clone https://github.com/YOUR_USERNAME/machine-insight-pro.git
   ```
2. Enter the project directory:  
   ```sh
   cd machine-insight-pro
   ```
3. Create a local environment file:  
   ```
   .env.local
   WML_API_KEY="YOUR_IBM_CLOUD_API_KEY"
   WML_ENDPOINT_URL="YOUR_MODEL_ENDPOINT_URL"
   ```
4. Start the dev server:  
   ```sh
   npx vercel dev
   ```

The app will run at `http://localhost:3000`.

---

## Contact

For questions, feedback, or collaboration:

- Sai Abhinav Patel Sadineni  
- LinkedIn: https://www.linkedin.com/in/sai-abhinav-sadineni/  
- Email: abhinav.sadineni@gmail.com  

---

## License

Distributed under the MIT License. See [LICENSE](https://github.com/saiabhinav001/machine-insight-pro/blob/main/LICENSE.md) for details.

---

**Next Steps & Recommendations**

- Add a badge for model performance to showcase F1 score directly in the header  
- Integrate CI/CD tests for API stability and frontend responsiveness  
- Set up automated retraining triggers based on incoming data drift  
- Document a changelog and roadmap to highlight future features like multi-machine comparison dashboards and anomaly clustering
