import { debounce } from "@solid-primitives/scheduled"
import type { FunctionArgs, FunctionReference } from "convex/server"
import { type Accessor, createEffect, createSignal, onCleanup, untrack } from "solid-js"
import type { BaseSchema } from "valibot"
import type { Result } from "#result"
import { paginationCacheKeyCreate } from "#src/utils/cache/paginationCacheKeyCreate.ts"
import { paginationPageCacheLoad } from "#src/utils/cache/paginationPageCacheLoad.ts"
import { paginationPageCacheSave } from "#src/utils/cache/paginationPageCacheSave.ts"
import { paginationDefaultOptions } from "#src/utils/convex_backend/paginationDefaultOptions.ts"
import { paginationResultSchema } from "#src/utils/convex_backend/paginationResultSchema.ts"
import type { PaginationResultType } from "#src/utils/convex_backend/paginationResultType.ts"
import { queryCreate } from "#src/utils/convex_client/queryCreate.ts"
import { debounceMs as defaultDebounceMs } from "#src/utils/ui/debounceMs.ts"

type CursorQueryArgs<Query extends FunctionReference<"query">> = Omit<FunctionArgs<Query>, "paginationOpts">

type CursorQueryResult<Item> = Result<PaginationResultType<Item>>

export function cursorPaginationCreate<Query extends FunctionReference<"query">, Item>(options: {
  query: Query
  queryKey: string
  args: Accessor<CursorQueryArgs<Query>>
  identity: Accessor<string | null | undefined>
  scope?: Accessor<unknown>
  filters?: Accessor<unknown>
  itemSchema: BaseSchema<any, Item, any>
  pageSize?: number
  debounceMs?: number
  storage?: Storage
}): {
  page: Accessor<CursorQueryResult<Item> | undefined>
  result: Accessor<CursorQueryResult<Item> | undefined>
  canNext: Accessor<boolean>
  canPrevious: Accessor<boolean>
  next: () => void
  previous: () => void
  loading: Accessor<boolean>
  cursor: Accessor<string | null>
  history: Accessor<readonly (string | null)[]>
  reset: () => void
} {
  const pageSize = options.pageSize ?? paginationDefaultOptions.numItems
  const wait = options.debounceMs ?? defaultDebounceMs
  const getScope = options.scope ?? (() => null)
  const getFilters = options.filters ?? (() => null)
  const pageSchema = paginationResultSchema(options.itemSchema)

  const [cursor, setCursor] = createSignal<string | null>(null)
  const [requestCursor, setRequestCursor] = createSignal<string | null>(null)
  const [history, setHistory] = createSignal<readonly (string | null)[]>([])

  const rawSnapshot = () => {
    const identity = options.identity() ?? null
    const args = options.args()
    const scope = getScope()
    const filters = getFilters()
    const stateSignature = paginationCacheKeyCreate({
      identity: identity ?? "",
      query: options.queryKey,
      args,
      scope,
      filters,
      cursor: null,
      pageSize,
    })
    const requestSignature = JSON.stringify({ args, identity, scope, filters })
    return { args, filters, identity, requestSignature, scope, stateSignature }
  }

  // Seed local state once; the effect below tracks and synchronizes every subsequent change.
  const initialSnapshot = untrack(rawSnapshot)
  const [activeSnapshot, setActiveSnapshot] = createSignal(initialSnapshot, { equals: false })
  let activeRequestSignature = initialSnapshot.requestSignature
  let stateVersion = 0
  let activeStateVersion = 0
  let lastStateSignature = initialSnapshot.stateSignature

  const applyActiveSnapshot = (snapshot: typeof initialSnapshot, requestCursor: string | null) => {
    activeRequestSignature = snapshot.requestSignature
    activeStateVersion = stateVersion
    setRequestCursor(requestCursor)
    setActiveSnapshot(snapshot)
  }
  const applyActiveSnapshotDebounced = debounce(applyActiveSnapshot, wait)

  const stateSynchronize = (snapshot: typeof initialSnapshot) => {
    if (snapshot.stateSignature !== lastStateSignature) {
      lastStateSignature = snapshot.stateSignature
      stateVersion += 1
      setCursor(null)
      setHistory([])
    }
    return snapshot
  }

  createEffect(
    () => ({ snapshot: rawSnapshot(), cursor: cursor() }),
    ({ snapshot, cursor: currentCursor }) => {
      const stateChanged = snapshot.stateSignature !== lastStateSignature
      stateSynchronize(snapshot)
      if (snapshot.requestSignature === activeRequestSignature && stateVersion === activeStateVersion) return
      const nextCursor = stateChanged ? null : currentCursor
      if (wait <= 0) {
        applyActiveSnapshot(snapshot, nextCursor)
        return
      }
      applyActiveSnapshotDebounced(snapshot, nextCursor)
    },
  )

  onCleanup(() => applyActiveSnapshotDebounced.clear())

  const queryArgs = () => {
    const snapshot = activeSnapshot()
    return {
      ...snapshot.args,
      paginationOpts: {
        numItems: pageSize,
        cursor: requestCursor(),
      },
    } as FunctionArgs<Query>
  }
  const queryResult = queryCreate<Query>(options.query, queryArgs)

  const currentCacheKey = () => {
    const snapshot = rawSnapshot()
    return paginationCacheKeyCreate({
      identity: snapshot.identity ?? "",
      query: options.queryKey,
      args: snapshot.args,
      scope: snapshot.scope,
      filters: snapshot.filters,
      cursor: cursor(),
      pageSize,
    })
  }

  const activePageRequestSignature = () => {
    const snapshot = activeSnapshot()
    return JSON.stringify({
      cursor: requestCursor(),
      requestSignature: snapshot.requestSignature,
      stateVersion: activeStateVersion,
    })
  }

  const page = () => {
    const currentResult = queryResult() as CursorQueryResult<Item> | undefined
    const currentSnapshot = rawSnapshot()
    const currentRequestSignature = JSON.stringify({
      cursor: cursor(),
      requestSignature: currentSnapshot.requestSignature,
      stateVersion,
    })
    const activeRequest = activePageRequestSignature()

    if (currentResult && currentRequestSignature === activeRequest) {
      return currentResult
    }

    if (!currentSnapshot.identity) return undefined
    const cached = paginationPageCacheLoad(currentCacheKey(), pageSchema, options.storage)
    if (!cached?.success) return undefined
    return cached
  }

  createEffect(
    () => ({
      currentResult: queryResult() as CursorQueryResult<Item> | undefined,
      currentSnapshot: rawSnapshot(),
      currentCursor: cursor(),
      activeRequest: activePageRequestSignature(),
      active: activeSnapshot(),
      cacheKey: currentCacheKey(),
    }),
    ({ currentResult, currentSnapshot, currentCursor, activeRequest, active, cacheKey }) => {
      if (!currentResult) return
      const currentRequestSignature = JSON.stringify({
        cursor: currentCursor,
        requestSignature: currentSnapshot.requestSignature,
        stateVersion,
      })
      if (currentRequestSignature !== activeRequest) return
      if (currentSnapshot.requestSignature !== active.requestSignature || stateVersion !== activeStateVersion) return
      if (!currentSnapshot.identity || !isCursorQueryResult(currentResult) || !currentResult.success) return
      paginationPageCacheSave(cacheKey, currentResult.data, pageSchema, options.storage)
    },
  )

  const result = page
  const canNext = () => {
    const current = page()
    if (!current?.success) return false
    return !current.data.isDone && current.data.continueCursor.length > 0
  }
  const canPrevious = () => rawSnapshot().stateSignature === lastStateSignature && history().length > 0

  const next = () => {
    stateSynchronize(rawSnapshot())
    if (rawSnapshot().requestSignature !== activeSnapshot().requestSignature || stateVersion !== activeStateVersion)
      return
    const current = page()
    if (!current?.success) return
    if (current.data.isDone || !current.data.continueCursor) return
    const nextCursor = current.data.continueCursor
    setHistory((previousHistory) => [...previousHistory, cursor()])
    setRequestCursor(nextCursor)
    setCursor(nextCursor)
  }

  const previous = () => {
    stateSynchronize(rawSnapshot())
    if (rawSnapshot().requestSignature !== activeSnapshot().requestSignature || stateVersion !== activeStateVersion)
      return
    const previousHistory = history()
    const previousCursor = previousHistory[previousHistory.length - 1]
    if (previousCursor === undefined && previousHistory.length <= 0) return
    const nextCursor = previousCursor ?? null
    setHistory(previousHistory.slice(0, -1))
    setRequestCursor(nextCursor)
    setCursor(nextCursor)
  }

  const reset = () => {
    setHistory([])
    setRequestCursor(null)
    setCursor(null)
  }

  const loading = () => {
    const snapshot = rawSnapshot()
    const active = activeSnapshot()
    if (snapshot.requestSignature !== active.requestSignature || stateVersion !== activeStateVersion) return true
    return queryResult() === undefined
  }

  return {
    page,
    result,
    canNext,
    canPrevious,
    next,
    previous,
    loading,
    cursor,
    history,
    reset,
  }
}

function isCursorQueryResult<Item>(value: unknown): value is CursorQueryResult<Item> {
  if (!value || typeof value !== "object") return false
  return "success" in value
}
