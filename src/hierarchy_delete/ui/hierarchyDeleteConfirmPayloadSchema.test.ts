import { describe, expect, test } from "bun:test"
import * as a from "valibot"
import { hierarchyDeleteConfirmPayloadSchema } from "#src/hierarchy_delete/ui/hierarchyDeleteConfirmPayloadSchema.ts"

describe("hierarchyDeleteConfirmPayloadSchema", () => {
  test("validates valid confirm payloads", () => {
    const valid = {
      target: {
        kind: "team",
        teamId: "team-123",
      },
      fingerprint: "abc123sha256",
      confirmedNameOrDelete: "DELETE",
    }

    const result = a.safeParse(hierarchyDeleteConfirmPayloadSchema, valid)
    expect(result.success).toBe(true)
  })

  test("rejects invalid payloads with missing fingerprint", () => {
    const invalid = {
      target: {
        kind: "org",
        orgHandle: "acme",
      },
      confirmedNameOrDelete: "acme",
    }

    const result = a.safeParse(hierarchyDeleteConfirmPayloadSchema, invalid)
    expect(result.success).toBe(false)
  })
})
