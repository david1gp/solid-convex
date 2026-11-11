import { describe, expect, test } from "bun:test"
import { e2eTargetGet, e2eTargetParse } from "./e2eTargetGet.ts"

describe("e2eTargetGet", () => {
  test("resolves dev and production targets", () => {
    expect(e2eTargetGet({ E2E_TARGET: "dev" })).toBe("dev")
    expect(e2eTargetGet({ E2E_TARGET: "production" })).toBe("production")
  })

  test("throws on unset E2E_TARGET without falling back to a default environment", () => {
    for (const environment of [{}, { E2E_TARGET: undefined }, { E2E_TARGET: "" }, { E2E_TARGET: "   " }]) {
      expect(() => e2eTargetGet(environment)).toThrow("E2E_TARGET is not set")
      expect(() => e2eTargetGet(environment)).toThrow("dev|production")
      expect(() => e2eTargetGet(environment)).toThrow("There is no default environment.")
    }
  })

  test("throws on unknown E2E_TARGET values instead of coercing them to production", () => {
    for (const value of ["prod", "development", "PRODUCTION", "localhost", "staging"]) {
      expect(() => e2eTargetGet({ E2E_TARGET: value })).toThrow(`E2E_TARGET "${value}"`)
      expect(() => e2eTargetGet({ E2E_TARGET: value })).toThrow("dev|production")
      expect(() => e2eTargetGet({ E2E_TARGET: value })).toThrow("There is no default environment.")
    }
  })

  test("e2eTargetParse resolves explicit targets and rejects missing or unknown values", () => {
    expect(e2eTargetParse("dev")).toBe("dev")
    expect(e2eTargetParse("production")).toBe("production")
    expect(() => e2eTargetParse(undefined)).toThrow("There is no default environment.")
    expect(() => e2eTargetParse("staging")).toThrow('E2E_TARGET "staging"')
  })
})
