import { createHash } from "node:crypto"
import type { Page } from "@rstest/playwright"
import * as v from "valibot"
import { createResult, createResultError } from "#result"

const sessionsSchema = v.array(
  v.object({
    token: v.pipe(v.string(), v.minLength(1)),
    profile: v.object({ userId: v.pipe(v.string(), v.minLength(1)) }),
  }),
)

export async function e2eSsoBrowserSessionRead(page: Page, baseUrl: string) {
  const op = "e2eSsoBrowserSessionRead"
  let raw: unknown
  try {
    await page.waitForURL((url) => url.origin === new URL(baseUrl).origin && url.pathname === "/overview", {
      timeout: 60_000,
    })
    await page.waitForFunction(() => !!localStorage.getItem("userSessions"), undefined, { timeout: 30_000 })
    raw = await page.evaluate(() => JSON.parse(localStorage.getItem("userSessions") ?? "null"))
  } catch {
    return createResultError(op, "SSO browser did not establish an application session")
  }
  const parsed = v.safeParse(sessionsSchema, raw)
  if (!parsed.success || parsed.output.length !== 1)
    return createResultError(op, "Fresh browser must identify exactly one application session")
  const session = parsed.output[0]!
  return createResult({
    userId: session.profile.userId,
    // In-memory transport only. The workflow explicitly projects metadata before saving.
    token: session.token,
    tokenDigest: createHash("sha256").update(session.token).digest("hex"),
  })
}
