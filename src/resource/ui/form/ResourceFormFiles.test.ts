import { afterAll, beforeAll, describe, expect, it } from "bun:test"
import { createRoot } from "solid-js"
import type { FileModel } from "#src/file/model/FileModel.ts"
import type { ResourceModel } from "#src/resource/model/ResourceModel.ts"
import { resourceFormFilesStateCreate } from "#src/resource/ui/form/resourceFormFilesStateCreate.ts"
import { formMode } from "#ui/input/form/formMode.ts"

const originalSessionStorage = globalThis.sessionStorage
const originalLocalStorage = globalThis.localStorage

beforeAll(() => {
  globalThis.sessionStorage = { getItem: () => null } as unknown as Storage
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage
})

afterAll(() => {
  globalThis.sessionStorage = originalSessionStorage
  globalThis.localStorage = originalLocalStorage
})

describe("ResourceFormFiles state factory", () => {
  it("passes undefined resourceId in add mode to prevent premature doc check on server", async () => {
    const { resourceFormStateManagement } = await import("#src/resource/ui/form/resourceFormStateManagement.ts")
    createRoot((dispose) => {
      const sm = resourceFormStateManagement(formMode.add, undefined, undefined, undefined, {
        actions: {},
        persist: false,
      })
      // Draft resourceId is populated during user input / autofill
      sm.state.resourceId.set("draft-resource-id-12345")
      sm.state.assignment.set({ kind: "team", id: "team_99" })

      const state = resourceFormFilesStateCreate({ sm: () => sm })

      expect(state.persistedResourceId()).toBeUndefined()
      expect(state.assignment()).toEqual({ kind: "team", id: "team_99" })
      dispose()
    })
  })

  it("passes persisted resourceId in edit mode for known loaded resource entity", async () => {
    const { resourceFormStateManagement } = await import("#src/resource/ui/form/resourceFormStateManagement.ts")
    createRoot((dispose) => {
      const existingResource: ResourceModel = {
        resourceId: "persisted-resource-12345",
        name: "Existing Resource",
        description: "",
        type: "strategy",
        visibility: "public",
        image: "",
        language: "en",
        createdAt: "2026-10-14T00:00:00.000Z",
        updatedAt: "2026-10-14T00:00:00.000Z",
      }

      const sm = resourceFormStateManagement(formMode.edit, existingResource.resourceId, existingResource, [], {
        actions: {},
        persist: false,
      })

      const state = resourceFormFilesStateCreate({ sm: () => sm })

      expect(state.persistedResourceId()).toBe("persisted-resource-12345")
      dispose()
    })
  })

  it("handles upload callback and remove file update correctly", async () => {
    const { resourceFormStateManagement } = await import("#src/resource/ui/form/resourceFormStateManagement.ts")
    createRoot((dispose) => {
      const sm = resourceFormStateManagement(formMode.add, undefined, undefined, undefined, {
        actions: {},
        persist: false,
      })
      const state = resourceFormFilesStateCreate({ sm: () => sm })

      expect(state.files()).toEqual([])

      const mockFile: FileModel = {
        fileId: "file_test_999",
        displayName: "document.pdf",
        fileSize: 2048,
        contentType: "application/pdf",
        url: "https://example.com/document.pdf",
        createdAt: "2026-10-14T00:00:00.000Z",
        updatedAt: "2026-10-14T00:00:00.000Z",
      }

      state.fileUploadSuccess(mockFile)
      expect(state.files()).toHaveLength(1)
      expect(state.files()[0]?.fileId).toBe("file_test_999")

      state.fileRemove("file_test_999")
      expect(state.files()).toHaveLength(0)
      dispose()
    })
  })
})
