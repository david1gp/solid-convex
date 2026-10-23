export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 429 | 500 | 503

export type ApiErrorDetails = Record<string, unknown>

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    op: string
    status: ApiErrorStatus
    requestId: string
    retryable: boolean
    details?: ApiErrorDetails
  }
}

const statusSlug: Record<ApiErrorStatus, string> = {
  400: "bad-request",
  401: "unauthorized",
  403: "forbidden",
  404: "not-found",
  409: "conflict",
  429: "rate-limited",
  500: "internal",
  503: "unavailable",
}

const retryableStatuses: ReadonlySet<ApiErrorStatus> = new Set([429, 500, 503])

function response(
  feature: string,
  op: string,
  message: string,
  status: ApiErrorStatus,
  details?: ApiErrorDetails,
  headers?: HeadersInit,
): Response {
  const body: ApiErrorBody = {
    error: {
      code: `${feature}.${statusSlug[status]}`,
      message,
      op,
      status,
      requestId: crypto.randomUUID(),
      retryable: retryableStatuses.has(status),
      ...(details === undefined ? {} : { details }),
    },
  }
  return Response.json(body, { status, ...(headers === undefined ? {} : { headers }) })
}

function fromResultError(
  feature: string,
  error: { op: string; errorMessage: string },
  status: ApiErrorStatus,
  headers?: HeadersInit,
): Response {
  return response(feature, error.op, error.errorMessage, status, undefined, headers)
}

/**
 * Unified HTTP error envelope shared by the api route modules.
 * Every error body is `{ error: { code, message, op, status, requestId, retryable, details? } }`
 * with `code = {feature}.{slug}` and `httpStatus` restricted to 400|401|403|404|409|429|500|503.
 * Unknown failures map to `{feature}.internal` / 500.
 */
export const apiError = {
  response,
  fromResultError,
}
