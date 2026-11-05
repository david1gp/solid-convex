import { expect, test } from "bun:test"
import { createHash } from "node:crypto"
import { getFunctionName } from "convex/server"
import { createResult, createResultError } from "#result"
import { e2eSsoSessionMarkTransportCreate } from "./workflows/ssoSignIn/e2eSsoSessionMarkTransportCreate.ts"

const backendUrl = "https://convex.example.test"
const ownedAt = 1_800_000_000_000
const input = { token: "in-memory-browser-secret", userId: "test-user-id", e2eRunId: "original-run", ownedAt }
const remote = {
  sessionId: "exact-session-id",
  userId: input.userId,
  e2eRunId: input.e2eRunId,
  ownedAt,
  createdAt: new Date(ownedAt + 100).toISOString(),
  creationTime: ownedAt + 100,
}

test("SSO registration calls the real Convex mutation with only the browser token and original ownership", async () => {
  let calls = 0
  const mark = e2eSsoSessionMarkTransportCreate({
    backendUrl,
    client: {
      mutation: async (reference, args) => {
        calls++
        expect(getFunctionName(reference)).toBe("auth:authSessionE2eMarkMutation")
        expect(args).toEqual({ token: input.token, e2eRunId: input.e2eRunId, ownedAt })
        expect(Object.keys(args).sort()).toEqual(["e2eRunId", "ownedAt", "token"])
        return createResult(remote)
      },
    },
  })
  const result = await mark(input)
  expect(calls).toBe(1)
  expect(result).toEqual(
    createResult({
      ...remote,
      tokenDigest: createHash("sha256").update(input.token).digest("hex"),
    }),
  )
  expect(JSON.stringify(result)).not.toContain(input.token)
})

test("SSO registration rejects the wrong returned owner, run, or original ownership time", async () => {
  for (const mismatch of [{ userId: "another-user" }, { e2eRunId: "another-run" }, { ownedAt: ownedAt + 1 }]) {
    const mark = e2eSsoSessionMarkTransportCreate({
      backendUrl,
      client: { mutation: async () => createResult({ ...remote, ...mismatch }) },
    })
    const result = await mark(input)
    expect(result.success).toBe(false)
    expect(JSON.stringify(result)).not.toContain(input.token)
  }
})

test("SSO registration rejects malformed identity and creation metadata instead of manufacturing proof", async () => {
  for (const mismatch of [
    { sessionId: "" },
    { createdAt: "not-a-date" },
    { creationTime: ownedAt - 1 },
    { createdAt: new Date(ownedAt - 1).toISOString() },
    { token: input.token },
  ]) {
    const result = await e2eSsoSessionMarkTransportCreate({
      backendUrl,
      client: { mutation: async () => createResult({ ...remote, ...mismatch }) },
    })(input)
    expect(result.success).toBe(false)
    expect(JSON.stringify(result)).not.toContain(input.token)
  }
})

test("SSO registration preserves a backend Result error without storing response data", async () => {
  const error = createResultError("authSessionE2eMarkMutation", "Session already has different immutable E2E ownership")
  const result = await e2eSsoSessionMarkTransportCreate({
    backendUrl,
    client: { mutation: async () => ({ ...error, rawData: { token: input.token } }) },
  })(input)
  expect(result).toEqual(error)
  expect(JSON.stringify(result)).not.toContain(input.token)
})

test("SSO registration sanitizes thrown Convex SDK errors that may contain the browser token", async () => {
  const result = await e2eSsoSessionMarkTransportCreate({
    backendUrl,
    client: {
      mutation: async () => {
        throw new Error(input.token)
      },
    },
  })(input)
  expect(result.success).toBe(false)
  expect(JSON.stringify(result)).not.toContain(input.token)
})
