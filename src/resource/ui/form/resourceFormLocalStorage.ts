import { debounce } from "@solid-primitives/scheduled"
import * as a from "valibot"
import { createResult, createResultError, type Result } from "#result"
import type { ResourceFilesModel } from "#src/resource/model/ResourceFilesModel.ts"
import type { ResourceFormState } from "#src/resource/ui/form/ResourceFormState.ts"
import { resourceFormDraftCacheSchema } from "#src/resource/ui/form/resourceFormDraftCacheSchema.ts"
import { pageRouteResource } from "#src/resource/url/pageRouteResource.ts"
import { cachePrefix } from "#src/utils/ui/cachePrefix.ts"
import { debounceSaveMs } from "#src/utils/ui/debounceMs.ts"
import { type FormMode, formMode } from "#ui/input/form/formMode.ts"

const resourceFormLocalStorageKey = cachePrefix + pageRouteResource.resourceAdd

export type ResourceFormLocalStorage = {
  storageKey: string
  createDebounceSave(mode: FormMode, state: ResourceFormState): () => void
  loadFromLocalStorage(): Result<ResourceFilesModel>
  saveToLocalStorage(value: ResourceFilesModel): void
  clearLocalStorage(): void
}

export const resourceFormLocalStorage: ResourceFormLocalStorage = {
  storageKey: resourceFormLocalStorageKey,
  createDebounceSave,
  loadFromLocalStorage,
  saveToLocalStorage,
  clearLocalStorage,
}

function saveIdleSchedule(callback: () => void): void {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => callback())
  } else if (typeof window !== "undefined") {
    setTimeout(callback, 0)
  } else {
    callback()
  }
}

function createDebounceSave(mode: FormMode, state: ResourceFormState) {
  if (mode !== formMode.add) return () => {}
  return debounce(() => {
    const resourceFilesModel = stateToResourceFilesModel(state)
    saveIdleSchedule(() => saveToLocalStorage(resourceFilesModel))
  }, debounceSaveMs)
}

function stateToResourceFilesModel(state: ResourceFormState): ResourceFilesModel {
  const now = new Date().toISOString()
  return {
    resource: {
      resourceId: state.resourceId.get(),
      assignment: state.assignment.get() ?? undefined,
      name: state.name.get(),
      description: state.description.get(),
      type: state.type.get(),
      visibility: state.visibility.get(),
      image: state.image.get(),
      language: state.language.get(),
      createdAt: now,
      updatedAt: now,
    },
    files: state.fileIds.get(),
  }
}

function loadFromLocalStorage(): Result<ResourceFilesModel> {
  const op = "loadResourceFromLocalStorage"
  const key = resourceFormLocalStorageKey
  console.log(op, key)
  const readValue = localStorage.getItem(key)
  if (!readValue) return createResultError(op, `no ${key} saved in localStorage`)
  const parsingSchema = a.pipe(a.string(), a.parseJson(), resourceFormDraftCacheSchema)
  const parsing = a.safeParse(parsingSchema, readValue)
  if (!parsing.success) {
    return createResultError(op, a.summarize(parsing.issues), readValue)
  }
  const now = new Date().toISOString()
  const data = parsing.output
  const model: ResourceFilesModel = {
    resource: {
      resourceId: data.resource.resourceId ?? "",
      assignment: data.resource.assignment,
      name: data.resource.name ?? "",
      description: data.resource.description ?? "",
      type: data.resource.type ?? "strategy",
      visibility: data.resource.visibility ?? "public",
      image: data.resource.image ?? "",
      language: data.resource.language ?? "en",
      createdAt: data.resource.createdAt ?? now,
      updatedAt: data.resource.updatedAt ?? now,
    },
    files: data.files ?? [],
  }
  return createResult(model)
}

function saveToLocalStorage(value: ResourceFilesModel) {
  const key = resourceFormLocalStorageKey
  const serialized = JSON.stringify(value, null, 2)
  localStorage.setItem(key, serialized)
}

function clearLocalStorage() {
  localStorage.removeItem(resourceFormLocalStorageKey)
}
