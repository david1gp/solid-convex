import { describe, expect, mock, test } from "bun:test"

const solidJsClientPath = "solid-js/dist/solid.js"
type SolidJsModule = typeof import("solid-js")
const solidJsClient = (await import(solidJsClientPath)) as unknown as SolidJsModule
mock.module("solid-js", () => solidJsClient)
const { createRoot, createSignal } = solidJsClient
mock.restore()

const { resourceDeletionWarningStateCreate } = await import("#src/resource/ui/resourceDeletionWarningStateCreate.ts")

describe("resourceDeletionWarningStateCreate", () => {
  test("uses default dangerText when none is provided", () => {
    createRoot((dispose) => {
      const [count] = createSignal(0)
      const state = resourceDeletionWarningStateCreate({
        count,
      })

      expect(state.count()).toBe(0)
      expect(state.hasCount()).toBe(false)
      expect(state.dangerText()).toBe("This action is permanent and cannot be undone.")
      dispose()
    })
  })

  test("reactively updates count and custom dangerText", () => {
    createRoot((dispose) => {
      const [count, setCount] = createSignal(1)
      const [dangerText, setDangerText] = createSignal("Warning: Deleting organization will cascade.")

      const state = resourceDeletionWarningStateCreate({
        count,
        dangerText,
      })

      expect(state.count()).toBe(1)
      expect(state.hasCount()).toBe(true)
      expect(state.countLabel()).toBe("1 resource will be permanently deleted")
      expect(state.dangerText()).toBe("Warning: Deleting organization will cascade.")

      setCount(5)
      expect(state.count()).toBe(5)
      expect(state.countLabel()).toBe("5 resources will be permanently deleted")

      setDangerText("Immediate irreversible destruction.")
      expect(state.dangerText()).toBe("Immediate irreversible destruction.")

      dispose()
    })
  })
})
