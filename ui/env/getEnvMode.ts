import { type EnvMode, envMode } from "./envMode.js"

export function getEnvMode(fallback: EnvMode = envMode.production): EnvMode {
  const mode =
    (typeof process !== "undefined" && (process.env?.ENV_MODE || process.env?.PUBLIC_ENV_MODE)) ||
    import.meta.env?.PUBLIC_ENV_MODE ||
    import.meta.env?.MODE ||
    (typeof process !== "undefined" && process.env?.NODE_ENV)
  if (mode === "preview") return envMode.development
  if (mode === envMode.production || mode === envMode.development || mode === envMode.test) return mode
  return fallback
}
