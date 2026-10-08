import * as a from "valibot"
import { createResult, createResultError, type PromiseResult, type Result } from "#result"
import { envAuthSecretResult } from "#src/app/env/private/envAuthSecretResult.ts"

const oidcTransactionCookieName = "__Host-oidc-transaction"
const oidcTransactionCookieDurationInSeconds = 600
const oidcTransactionCookieIssuer = "solid-convex/oidc-transaction"
const oidcTransactionCookieFallbackReturnTo = "/"
const oidcTransactionCookieReturnToOrigin = "https://oidc.invalid"
const oidcTransactionCookieMaxReturnToLength = 2048
const oidcTransactionCookieHmacAlgorithm = { name: "HMAC", hash: "SHA-256" } as const

const oidcTransactionSchema = a.object({
  state: a.pipe(a.string(), a.minLength(1), a.maxLength(128)),
  nonce: a.pipe(a.string(), a.minLength(1), a.maxLength(128)),
  codeVerifier: a.pipe(a.string(), a.minLength(43), a.maxLength(128)),
  returnTo: a.pipe(a.string(), a.maxLength(oidcTransactionCookieMaxReturnToLength)),
})

const oidcTransactionPayloadSchema = a.object({
  ...oidcTransactionSchema.entries,
  iat: a.pipe(a.number(), a.integer()),
  exp: a.pipe(a.number(), a.integer()),
  iss: a.literal(oidcTransactionCookieIssuer),
})

type OidcTransaction = a.InferOutput<typeof oidcTransactionSchema>

type OidcTransactionCookieCreateData = {
  transaction: OidcTransaction
  headers: Headers
}

function oidcTransactionCookieRandomValue(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return oidcTransactionCookieBase64urlEncode(bytes)
}

function oidcTransactionCookieBase64urlEncode(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "")
}

function oidcTransactionCookieBase64urlDecode(value: string): Uint8Array<ArrayBuffer> | undefined {
  if (!value || value.length % 4 === 1 || !/^[A-Za-z0-9_-]+$/u.test(value)) return
  const padded = `${value.replaceAll("-", "+").replaceAll("_", "/")}${"=".repeat((4 - (value.length % 4)) % 4)}`
  try {
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes
  } catch {
    return
  }
}

function oidcTransactionCookieReturnToGet(value: string | null | undefined): string {
  if (!value) return oidcTransactionCookieFallbackReturnTo
  if (value.length > oidcTransactionCookieMaxReturnToLength) return oidcTransactionCookieFallbackReturnTo
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return oidcTransactionCookieFallbackReturnTo
  }
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0
    if (code <= 31 || code === 127) return oidcTransactionCookieFallbackReturnTo
  }

  try {
    const parsed = new URL(value, oidcTransactionCookieReturnToOrigin)
    if (parsed.origin !== oidcTransactionCookieReturnToOrigin) return oidcTransactionCookieFallbackReturnTo
  } catch {
    return oidcTransactionCookieFallbackReturnTo
  }
  return value
}

function oidcTransactionCookieSetCookieGet(token: string, maxAge: number): string {
  return [
    `${oidcTransactionCookieName}=${token}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
  ].join("; ")
}

function oidcTransactionCookieValueGet(request: Request): Result<string> {
  const op = "oidcTransactionCookieValueGet"
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return createResultError(op, "missing transaction cookie")

  const values = cookieHeader.split(";").flatMap((part) => {
    const separatorIndex = part.indexOf("=")
    if (separatorIndex < 0 || part.slice(0, separatorIndex).trim() !== oidcTransactionCookieName) return []
    return [part.slice(separatorIndex + 1).trim()]
  })
  if (values.length !== 1 || !values[0]) return createResultError(op, "invalid transaction cookie")
  return createResult(values[0])
}

async function oidcTransactionCookieCreateHeaders(
  returnTo?: string | null,
): PromiseResult<OidcTransactionCookieCreateData> {
  const op = "oidcTransactionCookieCreateHeaders"
  const secretResult = envAuthSecretResult()
  if (!secretResult.success) return secretResult

  try {
    const issuedAt = Math.floor(Date.now() / 1000)
    const transaction = {
      state: oidcTransactionCookieRandomValue(),
      nonce: oidcTransactionCookieRandomValue(),
      codeVerifier: oidcTransactionCookieRandomValue(),
      returnTo: oidcTransactionCookieReturnToGet(returnTo),
    }
    const payload = JSON.stringify({
      ...transaction,
      iat: issuedAt,
      exp: issuedAt + oidcTransactionCookieDurationInSeconds,
      iss: oidcTransactionCookieIssuer,
    })
    const encodedPayload = oidcTransactionCookieBase64urlEncode(new TextEncoder().encode(payload))
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretResult.data),
      oidcTransactionCookieHmacAlgorithm,
      false,
      ["sign"],
    )
    const signature = await crypto.subtle.sign(
      oidcTransactionCookieHmacAlgorithm.name,
      key,
      new TextEncoder().encode(encodedPayload),
    )
    const token = `${encodedPayload}.${oidcTransactionCookieBase64urlEncode(new Uint8Array(signature))}`
    const headers = new Headers({
      "Set-Cookie": oidcTransactionCookieSetCookieGet(token, oidcTransactionCookieDurationInSeconds),
    })
    return createResult({ transaction, headers })
  } catch {
    return createResultError(op, "could not create OIDC transaction cookie")
  }
}

async function oidcTransactionCookieReadHeaders(
  request: Request,
  expectedState: string,
): PromiseResult<OidcTransaction> {
  const op = "oidcTransactionCookieReadHeaders"
  if (!expectedState) return createResultError(op, "missing transaction state")

  const cookieResult = oidcTransactionCookieValueGet(request)
  if (!cookieResult.success) return createResultError(op, "invalid transaction cookie")
  const secretResult = envAuthSecretResult()
  if (!secretResult.success) return secretResult

  try {
    const tokenParts = cookieResult.data.split(".")
    if (tokenParts.length !== 2 || !tokenParts[0] || !tokenParts[1]) {
      return createResultError(op, "invalid transaction cookie")
    }
    const encodedPayload = tokenParts[0]
    const signature = oidcTransactionCookieBase64urlDecode(tokenParts[1])
    if (signature?.byteLength !== 32) return createResultError(op, "invalid transaction cookie")
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretResult.data),
      oidcTransactionCookieHmacAlgorithm,
      false,
      ["verify"],
    )
    const valid = await crypto.subtle.verify(
      oidcTransactionCookieHmacAlgorithm.name,
      key,
      signature,
      new TextEncoder().encode(encodedPayload),
    )
    if (!valid) return createResultError(op, "invalid transaction cookie")
    const payloadBytes = oidcTransactionCookieBase64urlDecode(encodedPayload)
    if (!payloadBytes) return createResultError(op, "invalid transaction cookie")

    const parsedPayload = JSON.parse(new TextDecoder().decode(payloadBytes))
    const parsed = a.safeParse(oidcTransactionPayloadSchema, parsedPayload)
    if (!parsed.success) return createResultError(op, "invalid transaction cookie")
    const now = Math.floor(Date.now() / 1000)
    if (parsed.output.iat > now + 60 || parsed.output.exp <= parsed.output.iat) {
      return createResultError(op, "invalid transaction cookie")
    }
    if (parsed.output.exp <= now) return createResultError(op, "expired transaction cookie")
    if (parsed.output.state !== expectedState) return createResultError(op, "transaction state mismatch")

    return createResult({
      state: parsed.output.state,
      nonce: parsed.output.nonce,
      codeVerifier: parsed.output.codeVerifier,
      returnTo: oidcTransactionCookieReturnToGet(parsed.output.returnTo),
    })
  } catch {
    return createResultError(op, "invalid or expired transaction cookie")
  }
}

function oidcTransactionCookieClearHeaders(): Headers {
  return new Headers({
    "Set-Cookie": oidcTransactionCookieSetCookieGet("", 0),
  })
}

export const oidcTransactionCookie = {
  createHeaders: oidcTransactionCookieCreateHeaders,
  readHeaders: oidcTransactionCookieReadHeaders,
  clearHeaders: oidcTransactionCookieClearHeaders,
}
