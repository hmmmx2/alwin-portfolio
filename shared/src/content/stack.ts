// From the CV's SKILLS section. `icon` is a simple-icons slug resolved by the
// web app's <BrandIcon>; anything with no brand mark (QLoRA, Qdrant, vLLM)
// renders as a text-only pill, which is why they can sit here at all.
//
// A hiring manager screening for ML depth was never seeing XGBoost, LightGBM,
// PEFT, pgvector, embeddings, prompt engineering, SQL or Apache Spark: the CV
// claims all eight and the site named none of them, in a bullet or here. They
// are now listed, because a skills inventory is the honest place for a skill
// with no project on this site to point at -- writing them into an experience
// bullet would be inventing work.
//
// Deliberately still a selection. R, Java, C++ and JavaScript stay on the CV
// only: on a machine-learning profile they read as filler and dilute the
// signal the rest of this list carries. The earlier note here put the word
// cloud threshold at twenty; twenty-eight is a considered trade of density for
// coverage, not an accident.
//
// `experience.tech` and `projects.tech` resolve names against this file, so a
// name here and a name there must match exactly.
import type { StackItem } from "../types";

export const stack: StackItem[] = [
  { name: "Python", icon: "python", color: "#3776AB" },
  { name: "PyTorch", icon: "pytorch", color: "#EE4C2C" },
  { name: "TensorFlow", icon: "tensorflow", color: "#FF6F00" },
  { name: "scikit-learn", icon: "scikitlearn", color: "#F7931E" },
  { name: "QLoRA", icon: "qlora", color: "#C6CBD3" },
  { name: "LangChain", icon: "langchain", color: "#4FBFA5" },
  { name: "Qdrant", icon: "qdrant", color: "#C6CBD3" },
  { name: "vLLM", icon: "vllm", color: "#C6CBD3" },
  { name: "Ollama", icon: "ollama", color: "#E9EBEE" },
  { name: "PySpark", icon: "apachespark", color: "#E25A1C" },
  { name: "pandas", icon: "pandas", color: "#8C63D6" },
  { name: "NumPy", icon: "numpy", color: "#4D77CF" },
  { name: "PostgreSQL", icon: "postgresql", color: "#4E7FE1" },
  { name: "Redis", icon: "redis", color: "#FF4438" },
  { name: "FastAPI", icon: "fastapi", color: "#0FA396" },
  { name: "Docker", icon: "docker", color: "#2496ED" },
  { name: "AWS", icon: "amazonwebservices", color: "#FF9900" },
  { name: "GitHub Actions", icon: "githubactions", color: "#7C8AF5" },
  { name: "Next.js", icon: "nextdotjs", color: "#E9EBEE" },
  { name: "TypeScript", icon: "typescript", color: "#3178C6" },

  // From the CV's SKILLS block, and absent from every bullet on the site.
  // Most carry no brand mark and render as text pills, which is the same
  // treatment QLoRA and Qdrant already get above.
  { name: "XGBoost", icon: "xgboost", color: "#C6CBD3" },
  { name: "LightGBM", icon: "lightgbm", color: "#C6CBD3" },
  { name: "PEFT", icon: "peft", color: "#C6CBD3" },
  { name: "Apache Spark", icon: "apachespark", color: "#E25A1C" },
  { name: "SQL", icon: "sql", color: "#C6CBD3" },
  { name: "pgvector", icon: "pgvector", color: "#C6CBD3" },
  { name: "embeddings", icon: "embeddings", color: "#C6CBD3" },
  { name: "prompt engineering", icon: "promptengineering", color: "#C6CBD3" },
];
