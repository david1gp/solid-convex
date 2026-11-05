import { test } from "@rstest/playwright"
import { pageErrorGuardCreate } from "./pageErrorGuardCreate.ts"

export const browserTest = test.extend<{ pageErrorGuard: void }>({
  pageErrorGuard: [async ({ context }, use) => {
    const guard = pageErrorGuardCreate(context)
    try {
      await use(undefined)
    } finally {
      guard.finish()
    }
  }, { auto: true }],
})
