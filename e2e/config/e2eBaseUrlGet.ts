import type { E2eTarget } from "./e2eTargetGet.ts"

export function e2eBaseUrlGet(environment: Record<string, string | undefined>, target: E2eTarget): string {
  const targetUrl = target === "production" ? environment.E2E_PRODUCTION_BASE_URL : environment.E2E_DEV_BASE_URL
  const baseUrl = targetUrl?.trim() || environment.E2E_BASE_URL?.trim() || "http://localhost:3012"
  let url: URL

  try {
    url = new URL(baseUrl)
  } catch {
    throw new Error("The selected E2E base URL must be an absolute HTTP(S) URL")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("The selected E2E base URL must use HTTP or HTTPS")
  }

  return url.toString().replace(/\/$/u, "")
}
