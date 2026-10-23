import { expect, test } from "bun:test"
import { filterSignalValueFromUrl } from "./filterSignalValueFromUrl.ts"

test("filter signal restores defaults when URL has no filter parameters", () => {
  expect(filterSignalValueFromUrl({ type: "" }, new URL("https://example.test/resources"))).toEqual({ type: "" })
})
