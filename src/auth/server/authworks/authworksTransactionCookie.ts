import * as a from "valibot"
import { createResult, createResultError, type PromiseResult, type Result } from "#result"
import { envAuthSecretResult } from "#src/app/env/private/envAuthSecretResult.ts"

const authworksTransactionCookieName = "__Host-authworks-transaction"
const authworksTransactionCookieDurationInSeconds = 600
const authworksTransactionCookieIssuer = "solid-convex/authworks-transaction"
const authworksTransactionCookieFallbackReturnTo = "/"
const authworksTransactionCookieReturnToOrigin = "https://authworks.invalid"
const authworksTransactionCookieMaxReturnToLength = 2048
const authworksTransactionCookieHmacAlgorithm = { name: "HMAC", hash: "SHA-256" } as const

const authworksTransactionSchema = a.object({
  state: a.pipe(a.string(), a.minLength(1), a.maxLength(128)),
  nonce: a.pipe(a.string(), a.minLength(1), a.maxLength(128)),
  codeVerifier: a.pipe(a.string(), a.minLength(43), a.maxLength(128)),
  returnTo: a.pipe(a.string(), a.maxLength(authworksTransactionCookieMaxReturnToLength)),
})

const authworksTransactionPayloadSchema = a.object({
  ...authworksTransactionSchema.entries,
  iat: a.pipe(a.number(), a.integer()),
  exp: a.pipe(a.number(), a.integer()),
  iss: a.literal(authworksTransactionCookieIssuer),
})

type AuthworksTransaction = a.InferOutput<typeof authworksTransactionSchema>

type AuthworksTransactionCookieCreateData = {
  transaction: AuthworksTransaction
  headers: Headers
}

function authworksTransactionCookieRandomValue(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return authworksTransactionCookieBase64urlEncode(bytes)
}

function authworksTransactionCookieBase64urlEncode(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "")
}

function authworksTransactionCookieBase64urlDecode(value: string): Uint8Array<ArrayBuffer> | undefined {
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

function authworksTransactionCookieReturnToGet(value: string | null | undefined): string {
  if (!value) return authworksTransactionCookieFallbackReturnTo
  if (value.length > authworksTransactionCookieMaxReturnToLength) return authworksTransactionCookieFallbackReturnTo
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return authworksTransactionCookieFallbackReturnTo
  }
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0
    if (code <= 31 || code === 127) return authworksTransactionCookieFallbackReturnTo
  }

  try {
    const parsed = new URL(value, authworksTransactionCookieReturnToOrigin)
    if (parsed.origin !== authworksTransactionCookieReturnToOrigin) return authworksTransactionCookieFallbackReturnTo
  } catch {
    return authworksTransactionCookieFallbackReturnTo
  }
  return value
}

function authworksTransactionCookieSetCookieGet(token: string, maxAge: number): string {
  return [
    `${authworksTransactionCookieName}=${token}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Secure",
  ].join("; ")
}

function authworksTransactionCookieValueGet(request: Request): Result<string> {
  const op = "authworksTransactionCookieValueGet"
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return createResultError(op, "missing transaction cookie")

  const values = cookieHeader.split(";").flatMap((part) => {
    const separatorIndex = part.indexOf("=")
    if (separatorIndex < 0 || part.slice(0, separatorIndex).trim() !== authworksTransactionCookieName) return []
    return [part.slice(separatorIndex + 1).trim()]
  })
  if (values.length !== 1 || !values[0]) return createResultError(op, "invalid transaction cookie")
  return createResult(values[0])
}

async function authworksTransactionCookieCreateHeaders(
  returnTo?: string | null,
): PromiseResult<AuthworksTransactionCookieCreateData> {
  const op = "authworksTransactionCookieCreateHeaders"
  const secretResult = envAuthSecretResult()
  if (!secretResult.success) return secretResult

  try {
    const issuedAt = Math.floor(Date.now() / 1000)
    const transaction = {
      state: authworksTransactionCookieRandomValue(),
      nonce: authworksTransactionCookieRandomValue(),
      codeVerifier: authworksTransactionCookieRandomValue(),
      returnTo: authworksTransactionCookieReturnToGet(returnTo),
    }
    const payload = JSON.stringify({
      ...transaction,
      iat: issuedAt,
      exp: issuedAt + authworksTransactionCookieDurationInSeconds,
      iss: authworksTransactionCookieIssuer,
    })
    const encodedPayload = authworksTransactionCookieBase64urlEncode(new TextEncoder().encode(payload))
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretResult.data),
      authworksTransactionCookieHmacAlgorithm,
      false,
      ["sign"],
    )
    const signature = await crypto.subtle.sign(
      authworksTransactionCookieHmacAlgorithm.name,
      key,
      new TextEncoder().encode(encodedPayload),
    )
    const token = `${encodedPayload}.${authworksTransactionCookieBase64urlEncode(new Uint8Array(signature))}`
    const headers = new Headers({
      "Set-Cookie": authworksTransactionCookieSetCookieGet(token, authworksTransactionCookieDurationInSeconds),
    })
    return createResult({ transaction, headers })
  } catch {
    return createResultError(op, "could not create Authworks transaction cookie")
  }
}

async function authworksTransactionCookieReadHeaders(
  request: Request,
  expectedState: string,
): PromiseResult<AuthworksTransaction> {
  const op = "authworksTransactionCookieReadHeaders"
  if (!expectedState) return createResultError(op, "missing transaction state")

  const cookieResult = authworksTransactionCookieValueGet(request)
  if (!cookieResult.success) return createResultError(op, "invalid transaction cookie")
  const secretResult = envAuthSecretResult()
  if (!secretResult.success) return secretResult

  try {
    const tokenParts = cookieResult.data.split(".")
    if (tokenParts.length !== 2 || !tokenParts[0] || !tokenParts[1]) {
      return createResultError(op, "invalid transaction cookie")
    }
    const encodedPayload = tokenParts[0]
    const signature = authworksTransactionCookieBase64urlDecode(tokenParts[1])
    if (signature?.byteLength !== 32) return createResultError(op, "invalid transaction cookie")
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secretResult.data),
      authworksTransactionCookieHmacAlgorithm,
      false,
      ["verify"],
    )
    const valid = await crypto.subtle.verify(
      authworksTransactionCookieHmacAlgorithm.name,
      key,
      signature,
      new TextEncoder().encode(encodedPayload),
    )
    if (!valid) return createResultError(op, "invalid transaction cookie")
    const payloadBytes = authworksTransactionCookieBase64urlDecode(encodedPayload)
    if (!payloadBytes) return createResultError(op, "invalid transaction cookie")

    const parsedPayload = JSON.parse(new TextDecoder().decode(payloadBytes))
    const parsed = a.safeParse(authworksTransactionPayloadSchema, parsedPayload)
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
      returnTo: authworksTransactionCookieReturnToGet(parsed.output.returnTo),
    })
  } catch {
    return createResultError(op, "invalid or expired transaction cookie")
  }
}

function authworksTransactionCookieClearHeaders(): Headers {
  return new Headers({
    "Set-Cookie": authworksTransactionCookieSetCookieGet("", 0),
  })
}

export const authworksTransactionCookie = {
  createHeaders: authworksTransactionCookieCreateHeaders,
  readHeaders: authworksTransactionCookieReadHeaders,
  clearHeaders: authworksTransactionCookieClearHeaders,
}
