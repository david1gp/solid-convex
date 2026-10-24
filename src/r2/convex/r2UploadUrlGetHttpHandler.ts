import type { ActionCtx } from "#convex/_generated/server.js"
import { createResultError } from "#result"
import { apiError } from "#src/api/apiError.ts"
import { authorizationHeaderGetToken } from "#src/auth/server/authorizationHeaderGetToken.ts"
import { r2ApiGetUploadUrl } from "#src/r2/api_r2/r2ApiGetUploadUrl.ts"
import { authActionCredentialResolve } from "#src/utils/convex_backend/authActionCredentialResolve.ts"

export async function r2UploadUrlGetHttpHandler(ctx: ActionCtx, request: Request): Promise<Response> {
  const op = "r2UploadUrlHttpHandler"
  const url = new URL(request.url)

  const token = authorizationHeaderGetToken(request.headers.get("authorization"))
  if (!token) {
    const errorMessage = "Missing authorization header"
    console.warn(op, errorMessage)
    const err = createResultError(op, errorMessage)
    return apiError.fromResultError("r2.bad-request", err)
  }

  const credentialResult = await authActionCredentialResolve(ctx, token)
  if (!credentialResult.success) {
    return apiError.fromResultError("r2.bad-request", credentialResult)
  }

  const fileId = url.searchParams.get("fileId")
  if (!fileId) {
    const errorMessage = "Missing fileId query parameter"
    console.warn(op, errorMessage)
    const err = createResultError(op, errorMessage)
    return apiError.fromResultError("r2.bad-request", err)
  }

  const urlResult = await r2ApiGetUploadUrl(fileId)

  if (!urlResult.success) {
    return apiError.fromResultError("r2.internal", urlResult)
  }

  return new Response(urlResult.data, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  })
}
