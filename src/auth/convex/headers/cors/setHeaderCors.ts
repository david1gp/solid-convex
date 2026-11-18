import { envBaseUrlAppResult } from "#src/app/env/public/envBaseUrlAppResult.ts"
import { envBaseUrlSiteResult } from "#src/app/env/public/envBaseUrlSiteResult.ts"
import { getOriginFromRequest } from "#src/auth/convex/headers/getOriginFromRequest.ts"
import { isDevEnv } from "#ui/env/isDevEnv.ts"

const allowedMethods = ["OPTIONS", "GET", "POST"] as const
const allowedHeaders = ["Authorization", "If-Modified-Since", "Content-Type"] as const

const allowedHeaderSet = new Set([...allowedHeaders])

const staticCorsHeaders = {
  "Access-Control-Allow-Methods": allowedMethods.join(", "),
  "Access-Control-Allow-Headers": [...allowedHeaderSet.values()].join(", "),
  // "Access-Control-Max-Age": isDevEnv() ? "100" : "1000",
} as const satisfies HeadersInit

export function setHeaderCors(req: Request, r: Response): Response {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = getOriginFromRequest(req) ?? "*"

  for (const [k, v] of Object.entries(staticCorsHeaders)) {
    r.headers.set(k, v)
  }

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    r.headers.set("Access-Control-Allow-Origin", requestOrigin)
  } else {
    // Be conservative - don't allow unexpected origins
    r.headers.delete("Access-Control-Allow-Credentials")
  }
  return r
}

function getAllowedOrigins(): string[] {
  const baseUrlAppResult = envBaseUrlAppResult()
  if (!baseUrlAppResult.success) {
    return []
  }

  const baseUrlSiteResult = envBaseUrlSiteResult()
  if (!baseUrlSiteResult.success) {
    return []
  }

  const list = [baseUrlAppResult.data, baseUrlSiteResult.data]
  if (isDevEnv()) {
    // Local dev origins: the PORT-based default (5173) and the legacy
    // PREVIEW_WEB_PORT standalone fallback (3016).
    list.push("http://localhost:5173", "http://localhost:3016")
  }
  return list
}
