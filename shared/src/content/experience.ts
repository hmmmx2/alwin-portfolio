// From the CV's PROFESSIONAL EXPERIENCE section, newest first.
//
// Every figure is transcribed from the CV, not rounded or restated: 40.4M
// trainable parameters at 0.92 percent, a 10.4 GiB measured peak, 0.813
// bug-localisation accuracy with its confidence interval. If a number here
// stops matching the CV, the CV is the one that is right.
//
// `summary` is a one-line condensation of that role's own bullets -- the schema
// requires one and the CV is written as bullets alone. It adds no claims.
//
// `tech` holds names from `stack.ts`. Anything not found there still renders,
// just without a brand icon.
import type { ExperienceEntry } from "../types";

export const experience: ExperienceEntry[] = [
  {
    id: "swinburne-llm-research-assistant",
    title: "LLM Research Assistant",
    organisation: "Swinburne University of Technology (Sarawak Campus)",
    location: "Sarawak, Malaysia",
    summary:
      "Fine-tuning and evaluating a code-tutoring LLM on a single consumer GPU, and building the streaming application it is served through.",
    period: "DEC 2025 — PRESENT",
    kind: "CONTRACT · 1 YEAR",
    current: true,
    highlights: [
      "Trained a QLoRA adapter at rank 16 with 40.4 million trainable parameters — 0.92 percent of Qwen2.5 7B-Instruct — over 1,860 curated instruction examples on a single 16 GB RTX 5060 Ti, at effective batch 32 and sequence length 1,536.",
      "Reduced the training footprint to a measured 10.4 GiB peak against roughly 112 GiB for full-parameter AdamW, through 4-bit NF4 quantisation with rank-16 LoRA adapters.",
      "Evaluated the tutor across 9 runs on its production serving path, reaching bug-localisation accuracy of 0.813 (95% CI 0.774–0.846), routing accuracy of 0.941 and debug-mode recall of 0.902.",
      "Engineered a streaming Python FastAPI backend with a Next.js and TypeScript client over PostgreSQL for a document reasoning application.",
    ],
    tech: ["Python", "PyTorch", "FastAPI", "PostgreSQL", "Next.js", "TypeScript"],
  },
  {
    id: "swinburne-llm-research-intern",
    title: "LLM Research Intern",
    organisation: "Swinburne University of Technology (Sarawak Campus)",
    location: "Sarawak, Malaysia",
    summary:
      "Built a bias-detection workflow over Llama 3 8B and wrote the research paper that came out of it.",
    period: "JUN 2025 — DEC 2025",
    kind: "INTERNSHIP",
    current: false,
    highlights: [
      "Implemented a Low-Rank Adaptation bias-detection workflow orchestrated in LangChain with Ollama inference, evaluating Llama 3 8B against Direct Preference Optimization baselines with Qdrant vector retrieval.",
      "Authored a research paper on a recursive refinement and bias analysis framework for conversational AI, under academic supervision.",
    ],
    tech: ["Python", "LangChain", "Ollama", "Qdrant"],
  },
  {
    id: "finology-business-analyst",
    title: "Software Business Analyst",
    organisation: "Finology Sdn Bhd",
    location: "Kuala Lumpur, Malaysia",
    summary:
      "Translated business requirements into technical specifications and ran QA across two fintech projects.",
    period: "NOV 2023 — JUN 2024",
    kind: "FULL-TIME",
    current: false,
    highlights: [
      "Analysed business requirements and translated them into 40+ technical Jira specifications, defining edge cases and data validation rules that cut developer rework by 30% across two fintech projects (Aeon Bank and AHAM Asset Management).",
      "Executed technical quality assurance (SIT/UAT) across staging and production, isolating functional bugs in loan application workflows before deployment.",
      "Worked in an Agile Scrum team across the SDLC, owning Functional Specification Document updates for client sign-off and aligning specifications with the system architecture.",
    ],
    tech: [],
  },
  {
    id: "hexabyn-ml-intern",
    title: "AI/Machine Learning Intern",
    organisation: "Hexabyn Technologies Sdn. Bhd",
    location: "Sarawak, Malaysia",
    summary:
      "Built a fruit defect detection system and the training pipeline and interface around it.",
    period: "OCT 2023 — NOV 2023",
    kind: "INTERNSHIP",
    current: false,
    highlights: [
      "Developed a fruit defect detection system using EfficientNet-B0, reaching 93.4% classification accuracy.",
      "Curated the annotated image dataset and implemented an iterative PyTorch training pipeline to accelerate model optimisation.",
      "Developed a Django interface integrating YOLOv8 output into a working quality-inspection workflow.",
    ],
    tech: ["Python", "PyTorch"],
  },
  {
    id: "longi-qc-engineer-intern",
    title: "Quality Control Engineer Intern (IT Programmer)",
    organisation: "LONGi Malaysia Sdn. Bhd",
    location: "Sarawak, Malaysia",
    summary:
      "Automated solar cell certification and built the ETL pipelines behind the plant's defect analysis.",
    period: "MAR 2023 — JUL 2023",
    kind: "INTERNSHIP",
    current: false,
    highlights: [
      "Engineered a VB.NET and MySQL automation system for solar cell certification, processing high-volume logic to reduce manual generation by 85% and lift engineering productivity by 60%.",
      "Developed automated Python ETL pipelines for 22 real-time datasets and ran time series analysis to predict and mitigate manufacturing defects.",
    ],
    tech: ["Python"],
  },
];
