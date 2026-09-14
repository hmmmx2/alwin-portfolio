// From the CV's PROFESSIONAL EXPERIENCE section, newest first.
//
// Every figure is transcribed from the CV, not rounded or restated: a 48 GB
// RunPod A40, 112 GiB down to 10.4 GiB, vLLM at a measured 41 GB, 0.817
// bug-localisation across six runs. If a number here stops matching the CV,
// the CV is the one that is right.
//
// Spelling is normalised to the site's British convention (quantisation,
// localisation, analysed) where the CV mixes the two. Nothing else is
// reworded: the claims are the CV's.
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
      "Fine-tuning a 30B Mixture-of-Experts code model with a verifiable-reward loop, serving it through vLLM, and building the streaming application it is served through.",
    period: "DEC 2025 - PRESENT",
    kind: "CONTRACT · 1 YEAR",
    current: true,
    highlights: [
      "Fine-tuned Qwen3-Coder-30B-A3B-Instruct, a Mixture-of-Experts model with 3B active parameters, using a GRPO verifiable-reward LoRA loop on a 48 GB RunPod A40 GPU.",
      "Engineered the training pipeline in Python and PyTorch, cutting training memory from roughly 112 GiB to 10.4 GiB through 4-bit NF4 quantisation with rank-16 LoRA adapters.",
      "Served the model through vLLM at a measured 41 GB, evaluating bug-localisation on the live serving path at 0.817 with a 95% CI across six runs.",
      "Diagnosed and corrected a scoring defect that had inflated a reported metric, catching an automated grader crediting the model for echoing its own prompt rather than solving the task.",
      "Built a streaming FastAPI backend with a Next.js and TypeScript client over PostgreSQL, integrating the served model into a production document reasoning application.",
    ],
    tech: ["Python", "PyTorch", "vLLM", "FastAPI", "PostgreSQL", "Next.js", "TypeScript"],
  },
  {
    id: "swinburne-llm-research-intern",
    title: "LLM Research Intern",
    organisation: "Swinburne University of Technology (Sarawak Campus)",
    location: "Sarawak, Malaysia",
    summary:
      "Built a bias-detection and mitigation workflow over Llama 3 8B, and the multi-stage pipeline that scores its own output.",
    period: "JUN 2025 - DEC 2025",
    kind: "INTERNSHIP",
    current: false,
    highlights: [
      "Implemented a Low-Rank Adaptation bias-detection workflow orchestrated in LangChain with Ollama inference, benchmarking Llama 3 8B against Direct Preference Optimization baselines using Qdrant retrieval.",
      "Fine-tuned a LoRA bias-mitigation adapter on Llama 3 8B in PyTorch with 4-bit quantisation, training rank-16 adapters over attention and MLP projections on a curated preference dataset.",
      "Engineered a multi-stage LangChain evaluation pipeline that detects bias, generates a refined response, and scores both against the original using a structured comparison framework.",
    ],
    tech: ["Python", "PyTorch", "LangChain", "Ollama", "Qdrant"],
  },
  {
    id: "finology-business-analyst",
    title: "Software Business Analyst",
    organisation: "Finology Sdn Bhd",
    location: "Kuala Lumpur, Malaysia",
    summary:
      "Analysed requirements across the full SDLC for two fintech platforms, and ran the testing that signed them off.",
    period: "NOV 2023 - JUN 2024",
    kind: "FULL-TIME",
    current: false,
    highlights: [
      "Analysed business requirements across the full Software Development Life Cycle for two fintech platforms, Aeon Bank, a digital loan platform, and AHAM Asset Management, a digital investment platform.",
      "Translated business needs into 40+ technical Jira specifications with edge cases and data validation rules, reducing developer rework 30 percent across both engagements.",
      "Executed System Integration Testing and User Acceptance Testing across staging and production, owning functional specification documents through client sign-off in a cross-functional Agile Scrum team.",
    ],
    tech: [],
  },
  {
    id: "hexabyn-ml-intern",
    title: "AI/Machine Learning Intern",
    organisation: "Hexabyn Technologies Sdn. Bhd",
    location: "Sarawak, Malaysia",
    summary:
      "Trained a defect classifier and built the interface that put its detections in front of an inspector.",
    period: "OCT 2023 - NOV 2023",
    kind: "INTERNSHIP",
    current: false,
    highlights: [
      "Trained an EfficientNet-B0 defect classifier to 93.4 percent accuracy on a curated annotated image dataset through an iterative PyTorch training pipeline.",
      "Developed a Django interface consuming YOLOv8 detections into a functional quality-inspection workflow.",
    ],
    tech: ["Python", "PyTorch"],
  },
  {
    id: "longi-qc-engineer-intern",
    title: "Quality Control Engineer Intern (Software Developer/Data Analyst)",
    organisation: "LONGi Malaysia Sdn. Bhd",
    location: "Sarawak, Malaysia",
    summary:
      "Automated solar cell certification end to end, and built the ETL pipelines behind the plant's defect prediction.",
    period: "MAR 2023 - JUL 2023",
    kind: "INTERNSHIP",
    current: false,
    highlights: [
      "Built an internal Certificate Automation System in VB.NET, MySQL, and a WinForms interface, cutting manual certificate-generation effort 85 percent and processing time 75 percent.",
      "Automated Python ETL pipelines across 22 real-time manufacturing datasets, preprocessing solar-cell wafer dimensions for product certification and time series analysis for defect prediction.",
      "Reduced certificate failures over 90 percent by implementing data validation checks, working with the IT department and Quality Control Engineers to map their certification process.",
    ],
    tech: ["Python"],
  },
];
