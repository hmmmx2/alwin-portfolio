// From the CV's SKILLS section. `icon` is a simple-icons slug resolved by the
// web app's <BrandIcon>; anything with no brand mark (QLoRA, Qdrant, vLLM)
// renders as a text-only pill, which is why they can sit here at all.
//
// This is a selection, not the whole CV list -- the pill grid stops reading as
// a stack and starts reading as a word cloud somewhere around twenty. The full
// list stays on the CV.
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
];
