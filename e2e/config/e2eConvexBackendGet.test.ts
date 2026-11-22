import { describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { e2eConvexBackendGet } from "./e2eConvexBackendGet.ts"

const unreadable = () => {
  throw new Error("must not read env file")
}

describe("E2E Convex backend resolution", () => {
  test("dev reads preview credentials, not local development credentials", () => {
    const dir = mkdtempSync(join(tmpdir(), "solid-convex-env-test-"))
    const previous = process.cwd()
    try {
      writeFileSync(
        join(dir, ".env.preview"),
        "CONVEX_SELF_HOSTED_URL=https://preview.example.com\nCONVEX_SELF_HOSTED_ADMIN_KEY=preview-key\n",
      )
      writeFileSync(
        join(dir, ".env.development"),
        "CONVEX_SELF_HOSTED_URL=https://local.example.com\nCONVEX_SELF_HOSTED_ADMIN_KEY=local-key\n",
      )
      process.chdir(dir)
      expect(e2eConvexBackendGet({}, "dev")).toEqual({
        backendUrl: "https://preview.example.com",
        adminKey: "preview-key",
      })
    } finally {
      process.chdir(previous)
      rmSync(dir, { recursive: true, force: true })
    }
  })
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
    expect(() => e2eConvexBackendGet({ E2E_CONVEX_URL: "", E2E_CONVEX_ADMIN_KEY: "" }, "dev", unreadable)).toThrow()
  })

  test("falls back to the selected env file when neither override is set", () => {
    expect(
      e2eConvexBackendGet({}, "dev", () => ({
        CONVEX_SELF_HOSTED_URL: "https://dev.example.com",
        CONVEX_SELF_HOSTED_ADMIN_KEY: "dev-key",
      })),
    ).toEqual({ backendUrl: "https://dev.example.com", adminKey: "dev-key" })
  })

  test("rejects an env file missing admin credentials", () => {
    expect(() =>
      e2eConvexBackendGet({}, "production", () => ({ CONVEX_SELF_HOSTED_URL: "https://prod.example.com" })),
    ).toThrow()
  })
})
