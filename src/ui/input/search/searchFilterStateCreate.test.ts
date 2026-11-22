import { flush } from "solid-js"
import { describe, expect, test } from "bun:test"
import { createRoot } from "solid-js"
import { searchFilterStateCreate } from "./searchFilterStateCreate.ts"

async function waitFor(condition: () => boolean) {
  const deadline = Date.now() + 1000
  while (!condition() && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 5))
}

describe("searchFilterStateCreate", () => {
  test("keeps input immediate and coalesces URL/server state", async () => {
    const previousWindow = globalThis.window
    let currentUrl = "https://example.test/resources?search=initial&type=report"
    const listeners = new Set<() => void>()
    const fakeWindow = {
      get location() {
        return { href: currentUrl }
      },
      history: {
        replaceState: (_state: unknown, _title: string, nextUrl: string) => {
          currentUrl = nextUrl
        },
      },
      addEventListener: (_name: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_name: string, listener: () => void) => listeners.delete(listener),
    } as unknown as Window
    globalThis.window = fakeWindow as typeof globalThis.window

    let state: ReturnType<typeof searchFilterStateCreate<{ type: string }>> | undefined
    const dispose = createRoot((disposeRoot) => {
      state = searchFilterStateCreate({ type: "" }, { debounceMs: 5 })
      return disposeRoot
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(state!.searchSignal.get()).toBe("initial")
    expect(state!.filterSignal.get().type).toBe("report")

    state!.searchSignal.set("next")
    state!.filterSignal.update({ type: "strategy" })
    flush()
    expect(state!.searchSignal.get()).toBe("next")
    expect(state!.debouncedSearch()).toBe("initial")

    await waitFor(() => new URL(currentUrl).searchParams.get("search") === "next")
    expect(state!.debouncedSearch()).toBe("next")
    expect(state!.debouncedFilters().type).toBe("strategy")
    expect(new URL(currentUrl).searchParams.get("search")).toBe("next")
    expect(new URL(currentUrl).searchParams.get("type")).toBe("strategy")

    state!.searchSignal.set("")
    await waitFor(() => !new URL(currentUrl).searchParams.has("search"))
    expect(state!.debouncedSearch()).toBe("")
    expect(new URL(currentUrl).searchParams.has("search")).toBe(false)

    currentUrl = "https://example.test/resources?search=back&type=report"
    for (const listener of listeners) listener()
    flush()
    expect(state!.searchSignal.get()).toBe("back")
    expect(state!.debouncedSearch()).toBe("back")
    expect(state!.filterSignal.get().type).toBe("report")

    dispose()
    globalThis.window = previousWindow
  })
})
