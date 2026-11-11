import { readFileSync } from "node:fs"
import { parse } from "dotenv"

type FileEnvironmentRead = (target: "production" | "dev") => Record<string, string | undefined>

const fileEnvironmentReadDefault: FileEnvironmentRead = (target) =>
  parse(readFileSync(target === "dev" ? ".env.development" : ".env.production"))

/**
 * Resolve the Convex backend URL and admin key coherently: both come from the
 * explicit E2E_CONVEX_URL/E2E_CONVEX_ADMIN_KEY pair, or both come from the
 * selected env file. A partial override is a hard error so dev and prod
 * credentials can never mix silently.
 */
export function e2eConvexBackendGet(
  environment: Record<string, string | undefined>,
  target: "production" | "dev",
  fileEnvironmentRead: FileEnvironmentRead = fileEnvironmentReadDefault,
): { backendUrl: string; adminKey: string } {
  const overrideUrl = environment.E2E_CONVEX_URL
  const overrideKey = environment.E2E_CONVEX_ADMIN_KEY
  if ((overrideUrl === undefined) !== (overrideKey === undefined))
    throw new Error("Set both E2E_CONVEX_URL and E2E_CONVEX_ADMIN_KEY, or set neither to use the selected env file")
  if (overrideUrl !== undefined && overrideKey !== undefined) {
    if (!overrideUrl || !overrideKey)
      throw new Error("Selected target requires a non-empty Convex admin URL and key")
    return { backendUrl: overrideUrl, adminKey: overrideKey }
  }
  const fileEnvironment = fileEnvironmentRead(target)
  const backendUrl = fileEnvironment.CONVEX_SELF_HOSTED_URL
  const adminKey = fileEnvironment.CONVEX_SELF_HOSTED_ADMIN_KEY
  if (!backendUrl || !adminKey)
    throw new Error("Selected target requires Convex admin URL and key in its env file")
  return { backendUrl, adminKey }
}
