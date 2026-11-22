import { expect, test } from "bun:test"
import { signInCallbackSessionTake } from "#src/auth/ui/sign_in/logic/signInCallbackSessionTake.ts"

test("callback credentials are removed before application startup while preserving the return URL", () => {
  const calls: unknown[][] = []
  const history = {
    state: { key: "router" },
    replaceState: (...args: unknown[]) => calls.push(args),
  } as unknown as History
  const location = { href: "https://app.test/groups?from=oidc#userSession=secret&returnHash=%23top" } as Location
  expect(signInCallbackSessionTake(location, history)).toBe("secret")
  expect(calls).toEqual([[{ key: "router" }, "", "/groups?from=oidc#top"]])
})

test("legacy query credentials are removed without disturbing other URL state", () => {
  const calls: unknown[][] = []
  const history = { state: null, replaceState: (...args: unknown[]) => calls.push(args) } as unknown as History
  const location = { href: "https://app.test/groups?userSession=legacy&x=1#top" } as Location
  expect(signInCallbackSessionTake(location, history)).toBe("legacy")
  expect(calls).toEqual([[null, "", "/groups?x=1#top"]])
})
