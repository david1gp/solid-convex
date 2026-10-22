import { createResultError } from "#result"
import { type ApiErrorStatus, apiError } from "#src/api/apiError.ts"

const allowedStatuses: ReadonlySet<number> = new Set([400, 401, 403, 404, 409, 429, 500, 503])

export function oidcRequestErrorResponseCreate(
  operationName: string,
  errorMessage: string,
  status: number,
  headers?: Headers,
): Response {
  const error = createResultError(operationName, errorMessage)
  console.warn(error)
  const safeStatus = (allowedStatuses.has(status) ? status : 500) as ApiErrorStatus
  return apiError.fromResultError("auth", error, safeStatus, headers)
}
