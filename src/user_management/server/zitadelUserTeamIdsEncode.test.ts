import { expect, test } from "bun:test"
import { zitadelUserTeamIdsDecode } from "#src/user_management/server/zitadelUserTeamIdsDecode.ts"
import { zitadelUserTeamIdsEncode } from "#src/user_management/server/zitadelUserTeamIdsEncode.ts"

test("zitadelUserTeamIdsEncode and Decode round-trip team IDs correctly", () => {
  const original = ["team-1", "team-2", "team-3"]
  const encoded = zitadelUserTeamIdsEncode(original)

  expect(encoded instanceof Uint8Array).toBe(true)

  const decodedResult = zitadelUserTeamIdsDecode(encoded)
  expect(decodedResult.success).toBe(true)
  if (!decodedResult.success) return
  expect(decodedResult.data).toEqual(original)
})

test("zitadelUserTeamIdsDecode handles empty input and undefined", () => {
  const r1 = zitadelUserTeamIdsDecode(undefined)
  expect(r1.success).toBe(true)
  if (r1.success) expect(r1.data).toEqual([])

  const r2 = zitadelUserTeamIdsDecode(null)
  expect(r2.success).toBe(true)
  if (r2.success) expect(r2.data).toEqual([])

  const r3 = zitadelUserTeamIdsDecode(new Uint8Array(0))
  expect(r3.success).toBe(true)
  if (r3.success) expect(r3.data).toEqual([])
})

test("zitadelUserTeamIdsDecode handles base64 encoded JSON", () => {
  const base64 = Buffer.from(JSON.stringify(["team-alpha", "team-beta"])).toString("base64")
  const decodedResult = zitadelUserTeamIdsDecode(base64)

  expect(decodedResult.success).toBe(true)
  if (!decodedResult.success) return
  expect(decodedResult.data).toEqual(["team-alpha", "team-beta"])
})

test("zitadelUserTeamIdsDecode rejects invalid JSON and non-string arrays", () => {
  const invalidJson = zitadelUserTeamIdsDecode("not-json")
  expect(invalidJson.success).toBe(false)

  const invalidArray = zitadelUserTeamIdsDecode(new TextEncoder().encode(JSON.stringify([123, true])))
  expect(invalidArray.success).toBe(false)
})
