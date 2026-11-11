import { describe, expect, test } from "bun:test"
import { e2eConvexBackendGet } from "./e2eConvexBackendGet.ts"

const unreadable = () => {
  throw new Error("must not read env file")
}

describe("E2E Convex backend resolution", () => {
  test("uses the explicit override pair without reading the env file", () => {
    expect(
      e2eConvexBackendGet(
        { E2E_CONVEX_URL: "https://override.example.com", E2E_CONVEX_ADMIN_KEY: "override-key" },
        "dev",
        unreadable,
      ),
    ).toEqual({ backendUrl: "https://override.example.com", adminKey: "override-key" })
  })

  test.each([["E2E_CONVEX_URL"], ["E2E_CONVEX_ADMIN_KEY"]] as const)(
    "rejects a partial override with only %s set",
    (key) => {
      const environment =
        key === "E2E_CONVEX_URL"
          ? { E2E_CONVEX_URL: "https://override.example.com" }
          : { E2E_CONVEX_ADMIN_KEY: "override-key" }
      expect(() => e2eConvexBackendGet(environment, "production", unreadable)).toThrow(
        "both E2E_CONVEX_URL and E2E_CONVEX_ADMIN_KEY",
      )
    },
  )

  test("rejects an empty override pair", () => {
    expect(() =>
      e2eConvexBackendGet({ E2E_CONVEX_URL: "", E2E_CONVEX_ADMIN_KEY: "" }, "dev", unreadable),
    ).toThrow()
  })

  test("falls back to the selected env file when neither override is set", () => {
    expect(
      e2eConvexBackendGet(
        {},
        "dev",
        () => ({ CONVEX_SELF_HOSTED_URL: "https://dev.example.com", CONVEX_SELF_HOSTED_ADMIN_KEY: "dev-key" }),
      ),
    ).toEqual({ backendUrl: "https://dev.example.com", adminKey: "dev-key" })
  })

  test("rejects an env file missing admin credentials", () => {
    expect(() =>
      e2eConvexBackendGet({}, "production", () => ({ CONVEX_SELF_HOSTED_URL: "https://prod.example.com" })),
    ).toThrow()
  })
})
