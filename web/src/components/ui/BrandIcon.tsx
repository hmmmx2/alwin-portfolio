import {
  siAmazonwebservices,
  siApachespark,
  siDocker,
  siFastapi,
  siGithub,
  siGithubactions,
  siLangchain,
  siLinkedin,
  siNextdotjs,
  siNumpy,
  siOllama,
  siPandas,
  siPostgresql,
  siPython,
  siPytorch,
  siRedis,
  siScikitlearn,
  siTensorflow,
  siTypescript,
} from "simple-icons";

/**
 * Brand marks as inline SVG.
 *
 * The design pulled these from cdn.jsdelivr.net as CSS mask images: a
 * render-blocking third-party request per icon that flashes empty on a slow
 * connection and shows nothing at all offline. The paths come from the
 * `simple-icons` package instead, so they are part of the bundle.
 *
 * Only `path` is taken from the package — the brand colours stay in the
 * content files, because the design deliberately tuned several of them
 * (LangChain, FastAPI, PostgreSQL) away from the official values.
 */
const ICONS: Record<string, { path: string; title: string }> = {
  python: siPython,
  pytorch: siPytorch,
  tensorflow: siTensorflow,
  scikitlearn: siScikitlearn,
  langchain: siLangchain,
  ollama: siOllama,
  apachespark: siApachespark,
  pandas: siPandas,
  numpy: siNumpy,
  postgresql: siPostgresql,
  redis: siRedis,
  fastapi: siFastapi,
  docker: siDocker,
  amazonwebservices: siAmazonwebservices,
  githubactions: siGithubactions,
  nextdotjs: siNextdotjs,
  typescript: siTypescript,
  github: siGithub,
  linkedin: siLinkedin,
};

export function BrandIcon({
  name,
  className,
  color,
}: {
  name: string;
  className?: string;
  color?: string;
}) {
  // Not every skill has a brand mark — QLoRA, Qdrant and vLLM have none — and
  // the stack pill is designed to read as text alone when that happens.
  const icon = ICONS[name];
  if (!icon) return null;

  return (
    <svg
      role="img"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={className}
      fill={color ?? "currentColor"}
    >
      <path d={icon.path} />
    </svg>
  );
}

export function hasBrandIcon(name: string): boolean {
  return name in ICONS;
}
