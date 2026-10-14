import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import type { AssignmentTarget } from "#src/assignment/model/assignmentTargetSchema.ts"
import type { ResourceFilesModel } from "#src/resource/model/ResourceFilesModel.ts"
import { resourceFormDraftCacheSchema } from "#src/resource/ui/form/resourceFormDraftCacheSchema.ts"
import { resourceFormLocalStorage } from "#src/resource/ui/form/resourceFormLocalStorage.ts"
import * as a from "valibot"

describe("resourceFormLocalStorage", () => {
  let mockStorage: Record<string, string> = {}

  beforeEach(() => {
    mockStorage = {}
    globalThis.localStorage = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val
      },
      removeItem: (key: string) => {
        delete mockStorage[key]
      },
      clear: () => {
        mockStorage = {}
      },
      key: () => null,
      length: 0,
    } as unknown as Storage
  })

  afterEach(() => {
    resourceFormLocalStorage.clearLocalStorage()
  })

  it("saves and loads resource draft preserving validated canonical assignment target", () => {
    const target: AssignmentTarget = { kind: "team", id: "team_alpha_1" }
    const draft: ResourceFilesModel = {
      resource: {
        resourceId: "",
        assignment: target,
        name: "Draft resource title",
        description: "Draft resource description",
        type: "strategy",
        visibility: "public",
        image: "",
        language: "en",
        createdAt: "2026-10-14T10:00:00.000Z",
        updatedAt: "2026-10-14T10:00:00.000Z",
      },
      files: [],
    }

    resourceFormLocalStorage.saveToLocalStorage(draft)
    const loaded = resourceFormLocalStorage.loadFromLocalStorage()

    expect(loaded.success).toBe(true)
    if (loaded.success) {
      expect(loaded.data.resource.assignment).toEqual(target)
      expect(loaded.data.resource.name).toBe("Draft resource title")
      expect(loaded.data.resource.type).toBe("strategy")
    }
  })

  it("preserves organization level target across save and load", () => {
    const target: AssignmentTarget = { kind: "organization", id: "org_99" }
    const draft: ResourceFilesModel = {
      resource: {
        resourceId: "persisted_res_12345",
        assignment: target,
        name: "Org resource",
        description: "",
        type: "report",
        visibility: "member",
        image: "",
        language: "en",
        createdAt: "2026-10-14T10:00:00.000Z",
        updatedAt: "2026-10-14T10:00:00.000Z",
      },
      files: [],
    }

    resourceFormLocalStorage.saveToLocalStorage(draft)
    const loaded = resourceFormLocalStorage.loadFromLocalStorage()

    expect(loaded.success).toBe(true)
    if (loaded.success) {
      expect(loaded.data.resource.assignment).toEqual(target)
    }
  })

  it("handles unassigned draft target cleanly as undefined", () => {
    const draft: ResourceFilesModel = {
      resource: {
        resourceId: "",
        name: "Unassigned resource",
        description: "",
        type: "strategy",
        visibility: "public",
        image: "",
        language: "en",
        createdAt: "2026-10-14T10:00:00.000Z",
        updatedAt: "2026-10-14T10:00:00.000Z",
      },
      files: [],
    }

    resourceFormLocalStorage.saveToLocalStorage(draft)
    const loaded = resourceFormLocalStorage.loadFromLocalStorage()

    expect(loaded.success).toBe(true)
    if (loaded.success) {
      expect(loaded.data.resource.assignment).toBeUndefined()
    }
  })

  it("rejects corrupted or invalid assignment target during load", () => {
    mockStorage[resourceFormLocalStorage.storageKey] = JSON.stringify({
      resource: {
        resourceId: "",
        assignment: { kind: "invalid_kind", id: "foo" },
        name: "Corrupted assignment",
      },
      files: [],
    })

    const loaded = resourceFormLocalStorage.loadFromLocalStorage()
    expect(loaded.success).toBe(false)
  })

  it("resourceFormDraftCacheSchema validates canonical targets and rejects invalid ones", () => {
    const valid = a.safeParse(resourceFormDraftCacheSchema, {
      resource: {
        assignment: { kind: "project", id: "proj_123" },
      },
      files: [],
    })
    expect(valid.success).toBe(true)
    if (valid.success) {
      expect(valid.output.resource.assignment).toEqual({ kind: "project", id: "proj_123" })
    }

    const invalid = a.safeParse(resourceFormDraftCacheSchema, {
      resource: {
        assignment: { kind: "not_a_kind", id: "proj_123" },
      },
      files: [],
    })
    expect(invalid.success).toBe(false)
  })
})
