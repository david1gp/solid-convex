import { describe, expect, test } from "bun:test"
import { e2eBaseUrlGet } from "./e2eBaseUrlGet.ts"

describe("E2E base URL selection", () => {
  test("development defaults to the configured app origin used by the SSO callback", () => {
    expect(
      e2eBaseUrlGet(
        {
          PUBLIC_BASE_URL_APP: " https://dev.example.com/ ",
          E2E_PRODUCTION_BASE_URL: "https://production.example.com",
        },
        "dev",
      ),
    ).toBe("https://dev.example.com")
  })

  test.each(["dev", "production"] as const)(
    "%s target-specific overrides take precedence over shared and app URLs",
    (target) => {
      expect(
        e2eBaseUrlGet(
          {
            E2E_DEV_BASE_URL: " https://dev-override.example.com/ ",
            E2E_PRODUCTION_BASE_URL: " https://production-override.example.com/ ",
            E2E_BASE_URL: "https://shared.example.com",
            PUBLIC_BASE_URL_APP: "https://app.example.com",
          },
          target,
        ),
      ).toBe(`https://${target}-override.example.com`)
    },
  )

  test.each(["dev", "production"] as const)(
    "%s uses the shared override when its target override is blank",
    (target) => {
      expect(
        e2eBaseUrlGet(
          {
            E2E_DEV_BASE_URL: " ",
            E2E_PRODUCTION_BASE_URL: " ",
            E2E_BASE_URL: " https://shared.example.com/ ",
            PUBLIC_BASE_URL_APP: "https://app.example.com",
          },
          target,
        ),
      ).toBe("https://shared.example.com")
    },
  )

  test("production never implicitly selects the development app URL", () => {
    expect(e2eBaseUrlGet({ PUBLIC_BASE_URL_APP: "https://dev.example.com" }, "production")).toBe(
      "http://localhost:3012",
    )
  })

  test("development defaults to the preview when no app URL is configured", () => {
    expect(e2eBaseUrlGet({ PUBLIC_BASE_URL_APP: " " }, "dev")).toBe("https://solid-convex.wonder1.de")
  })

  test.each(["not-a-url", "ftp://dev.example.com"])("rejects invalid configured development app URL: %s", (appUrl) => {
    expect(() => e2eBaseUrlGet({ PUBLIC_BASE_URL_APP: appUrl }, "dev")).toThrow("E2E base URL")
  })
})
