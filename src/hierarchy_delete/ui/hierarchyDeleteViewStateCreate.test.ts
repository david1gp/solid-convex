import { describe, expect, mock, test } from "bun:test"
import { createResult, createResultError } from "#result"
import type { HierarchyDeleteTarget } from "#src/hierarchy_delete/model/hierarchyDeleteTargetSchema.ts"

if (!globalThis.sessionStorage) {
  globalThis.sessionStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
  } as unknown as Storage
}
if (!globalThis.localStorage) {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
    key: () => null,
    length: 0,
  } as unknown as Storage
}

const solidJsClientPath = "solid-js/dist/solid.js"
type SolidJsModule = typeof import("solid-js")
const solidJsClient = (await import(solidJsClientPath)) as unknown as SolidJsModule
mock.module("solid-js", () => solidJsClient)
const { createRoot, createSignal, getOwner, useContext } = solidJsClient
const { api } = await import("#convex/_generated/api.js")
const { ConvexContext } = await import("#src/utils/convex_client/convexContext.ts")
const { hierarchyDeleteViewStateCreate } = await import("./hierarchyDeleteViewStateCreate.ts")
mock.restore()

type QueryUpdate = (value: unknown) => void

class MockConvexClient {
  subscriptions: Array<{ query: unknown; args: unknown; update: QueryUpdate }> = []
  mutations: Array<{ mutation: unknown; args: unknown }> = []
  mutationHandler?: (mutation: unknown, args: unknown) => Promise<unknown>

  async mutation(mutation: unknown, args: unknown) {
    this.mutations.push({ mutation, args })
    if (this.mutationHandler) {
      return this.mutationHandler(mutation, args)
    }
    return createResult({ jobId: "job-default-1", status: "pending" })
  }

  onUpdate(query: unknown, args: unknown, update: QueryUpdate) {
    const entry = { query, args, update }
    this.subscriptions.push(entry)
    return () => {
      const idx = this.subscriptions.indexOf(entry)
      if (idx >= 0) this.subscriptions.splice(idx, 1)
    }
  }

  notifyLast(value: unknown) {
    const last = this.subscriptions[this.subscriptions.length - 1]
    last?.update(value)
  }

  notifyQuery(matcher: (args: unknown) => boolean, value: unknown) {
    for (const sub of this.subscriptions) {
      if (matcher(sub.args)) {
        sub.update(value)
      }
    }
  }
}

describe("hierarchyDeleteViewStateCreate", () => {
  test("resets typed confirmation when selected target root changes", async () => {
    const client = new MockConvexClient()
    let state!: ReturnType<typeof hierarchyDeleteViewStateCreate>
    let setTarget!: (target: HierarchyDeleteTarget | undefined) => void

    const dispose = createRoot((disposeRoot) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }

      const [target, set] = createSignal<HierarchyDeleteTarget | undefined>({
        kind: "org",
        orgId: "org-1",
      })
      setTarget = set

      state = hierarchyDeleteViewStateCreate({
        target,
      })

      return disposeRoot
    })

    state.typedConfirmation.set("DELETE")
    expect(state.typedConfirmation.get()).toBe("DELETE")

    // Change target root
    setTarget({
      kind: "team",
      teamId: "team-1",
    })

    await Promise.resolve()
    expect(state.typedConfirmation.get()).toBe("")
    dispose()
  })

  test("resets typed confirmation when fingerprint changes", async () => {
    const client = new MockConvexClient()
    let state!: ReturnType<typeof hierarchyDeleteViewStateCreate>

    const dispose = createRoot((disposeRoot) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }

      const [target] = createSignal<HierarchyDeleteTarget | undefined>({
        kind: "org",
        orgId: "org-1",
      })

      state = hierarchyDeleteViewStateCreate({
        target,
      })

      // Send first preview query result
      client.notifyQuery(
        (args: any) => args?.kind === "org",
        createResult({
          root: { kind: "org", id: "org-1", name: "Corp" },
          counts: { orgs: 1, teams: 0, projects: 0, notes: 0, resources: 0, files: 0, total: 1 },
          fingerprint: "fp-initial-111",
          scope: { orgIds: ["org-1"], teamIds: [], projectIds: [], noteIds: [], resourceIds: [], fileIds: [] },
          isTruncated: false,
        }),
      )

      return disposeRoot
    })

    await Promise.resolve()
    expect(state.fingerprint()).toBe("fp-initial-111")
    state.typedConfirmation.set("Corp")
    expect(state.typedConfirmation.get()).toBe("Corp")

    // Send updated preview with different fingerprint
    client.notifyQuery(
      (args: any) => args?.kind === "org",
      createResult({
        root: { kind: "org", id: "org-1", name: "Corp" },
        counts: { orgs: 1, teams: 1, projects: 0, notes: 0, resources: 0, files: 0, total: 2 },
        fingerprint: "fp-updated-222",
        scope: { orgIds: ["org-1"], teamIds: ["team-1"], projectIds: [], noteIds: [], resourceIds: [], fileIds: [] },
        isTruncated: false,
      }),
    )

    await Promise.resolve()
    expect(state.fingerprint()).toBe("fp-updated-222")
    expect(state.typedConfirmation.get()).toBe("")
    dispose()
  })

  test("does not immediately navigate away on confirm: subscribes to status query and only navigates on completion", async () => {
    const client = new MockConvexClient()
    let successCount = 0

    let state!: ReturnType<typeof hierarchyDeleteViewStateCreate>
    const dispose = createRoot((disposeRoot) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }

      const [target] = createSignal<HierarchyDeleteTarget | undefined>({
        kind: "org",
        orgId: "org-1",
      })

      state = hierarchyDeleteViewStateCreate({
        target,
        onConfirm: async () => {
          return createResult({
            jobId: "job-123",
            status: "pending",
          })
        },
        onSuccess: () => {
          successCount++
        },
      })

      // Mock preview
      client.notifyQuery(
        (args: any) => args?.kind === "org",
        createResult({
          root: { kind: "org", id: "org-1", name: "Corp" },
          counts: { orgs: 1, teams: 0, projects: 0, notes: 0, resources: 0, files: 0, total: 1 },
          fingerprint: "fp-123",
          scope: { orgIds: ["org-1"], teamIds: [], projectIds: [], noteIds: [], resourceIds: [], fileIds: [] },
          isTruncated: false,
        }),
      )

      return disposeRoot
    })

    state.typedConfirmation.set("DELETE")
    expect(state.canConfirm()).toBe(true)

    // Confirm click
    await state.onConfirmClick()

    // After confirm submission, job is queued/in_progress, jobId is bound, but onSuccess is NOT called
    expect(state.activeJobId()).toBe("job-123")
    expect(state.jobStatus.get()).toBe("in_progress")
    expect(successCount).toBe(0)

    // Status query notifies job is completed
    client.notifyQuery(
      (args: any) => args?.jobId === "job-123",
      createResult({
        job: {
          jobId: "job-123",
          rootKind: "org",
          rootId: "org-1",
          status: "completed",
          counts: { orgs: 1, teams: 0, projects: 0, notes: 0, resources: 0, files: 0, total: 1 },
          scope: { orgIds: ["org-1"], teamIds: [], projectIds: [], noteIds: [], resourceIds: [], fileIds: [] },
          fingerprint: "fp-123",
          requestedByUserId: "user-1",
          createdAt: "2026-10-14T00:00:00Z",
          updatedAt: "2026-10-14T00:00:00Z",
        },
        jobs: [],
      }),
    )

    expect(state.jobStatus.get()).toBe("completed")
    expect(successCount).toBe(1)

    dispose()
  })

  test("handles job failure, exposes specific error, enables retry, and executes onRetry", async () => {
    const client = new MockConvexClient()
    let retryCalledWithJobId = ""

    let state!: ReturnType<typeof hierarchyDeleteViewStateCreate>
    const dispose = createRoot((disposeRoot) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }

      const [target] = createSignal<HierarchyDeleteTarget | undefined>({
        kind: "org",
        orgId: "org-1",
      })

      state = hierarchyDeleteViewStateCreate({
        target,
        onConfirm: async () => {
          return createResult({
            jobId: "job-fail-1",
            status: "pending",
          })
        },
        onRetry: async (jobId) => {
          retryCalledWithJobId = jobId
          return createResult({ status: "in_progress" })
        },
      })

      // Setup preview
      client.notifyQuery(
        (args: any) => args?.kind === "org",
        createResult({
          root: { kind: "org", id: "org-1", name: "Corp" },
          counts: { orgs: 1, teams: 0, projects: 0, notes: 0, resources: 0, files: 0, total: 1 },
          fingerprint: "fp-fail",
          scope: { orgIds: ["org-1"], teamIds: [], projectIds: [], noteIds: [], resourceIds: [], fileIds: [] },
          isTruncated: false,
        }),
      )

      return disposeRoot
    })

    state.typedConfirmation.set("Corp")
    await state.onConfirmClick()

    expect(state.activeJobId()).toBe("job-fail-1")

    // Notify job failed
    client.notifyQuery(
      (args: any) => args?.jobId === "job-fail-1",
      createResult({
        job: {
          jobId: "job-fail-1",
          rootKind: "org",
          rootId: "org-1",
          status: "failed",
          error: "R2 connection timeout during object deletion",
          counts: { orgs: 1, teams: 0, projects: 0, notes: 0, resources: 0, files: 0, total: 1 },
          scope: { orgIds: ["org-1"], teamIds: [], projectIds: [], noteIds: [], resourceIds: [], fileIds: [] },
          fingerprint: "fp-fail",
          requestedByUserId: "user-1",
          createdAt: "2026-10-14T00:00:00Z",
          updatedAt: "2026-10-14T00:00:00Z",
        },
        jobs: [],
      }),
    )

    expect(state.jobStatus.get()).toBe("error")
    expect(state.jobError.get()).toBe("R2 connection timeout during object deletion")
    expect(state.canRetry()).toBe(true)

    // Click retry
    await state.onRetryClick()

    expect(retryCalledWithJobId).toBe("job-fail-1")
    expect(state.jobStatus.get()).toBe("in_progress")
    expect(state.jobError.get()).toBe("")

    dispose()
  })

  test("exposes specific retry failure error when retry mutation fails", async () => {
    const client = new MockConvexClient()

    let state!: ReturnType<typeof hierarchyDeleteViewStateCreate>
    const dispose = createRoot((disposeRoot) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }

      const [target] = createSignal<HierarchyDeleteTarget | undefined>({
        kind: "org",
        orgId: "org-1",
      })

      state = hierarchyDeleteViewStateCreate({
        target,
        onConfirm: async () => {
          return createResult({
            jobId: "job-retry-fail",
            status: "pending",
          })
        },
        onRetry: async () => {
          return createResultError("retryMutation", "Cannot retry: root entity is not locked by this deletion job")
        },
      })

      client.notifyQuery(
        (args: any) => args?.kind === "org",
        createResult({
          root: { kind: "org", id: "org-1", name: "Corp" },
          counts: { orgs: 1, teams: 0, projects: 0, notes: 0, resources: 0, files: 0, total: 1 },
          fingerprint: "fp-fail",
          scope: { orgIds: ["org-1"], teamIds: [], projectIds: [], noteIds: [], resourceIds: [], fileIds: [] },
          isTruncated: false,
        }),
      )

      return disposeRoot
    })

    state.typedConfirmation.set("DELETE")
    await state.onConfirmClick()

    // Notify job failed
    client.notifyQuery(
      (args: any) => args?.jobId === "job-retry-fail",
      createResult({
        job: {
          jobId: "job-retry-fail",
          rootKind: "org",
          rootId: "org-1",
          status: "failed",
          error: "Initial error",
          counts: { orgs: 1, teams: 0, projects: 0, notes: 0, resources: 0, files: 0, total: 1 },
          scope: { orgIds: ["org-1"], teamIds: [], projectIds: [], noteIds: [], resourceIds: [], fileIds: [] },
          fingerprint: "fp-fail",
          requestedByUserId: "user-1",
          createdAt: "2026-10-14T00:00:00Z",
          updatedAt: "2026-10-14T00:00:00Z",
        },
        jobs: [],
      }),
    )

    expect(state.canRetry()).toBe(true)

    // Click retry -> retry fails
    await state.onRetryClick()

    expect(state.jobStatus.get()).toBe("error")
    expect(state.jobError.get()).toBe("Cannot retry: root entity is not locked by this deletion job")

    dispose()
  })

  test("faithful context helper throws outside owner and confirm/retry invoked uses factory once setup", async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(ConvexContext, "defaultValue")
    Object.defineProperty(ConvexContext, "defaultValue", {
      get() {
        throw new Error("ConvexContext accessed outside reactive owner")
      },
      configurable: true,
    })

    try {
      // 1. Context helper throws when accessed directly outside owner
      expect(getOwner()).toBeNull()
      expect(() => useContext(ConvexContext)).toThrow("ConvexContext accessed outside reactive owner")

      // 2. Setup state synchronously inside owner with provider context
      const client = new MockConvexClient()
      let state!: ReturnType<typeof hierarchyDeleteViewStateCreate>
      let dispose!: () => void

      createRoot((disposeRoot) => {
        dispose = disposeRoot
        const owner = getOwner()!
        owner.context = { [ConvexContext.id]: client }

        const [target] = createSignal<HierarchyDeleteTarget | undefined>({
          kind: "team",
          teamId: "team-42",
        })

        // hierarchyDeleteViewStateCreate constructs mutation closures synchronously once during setup
        state = hierarchyDeleteViewStateCreate({ target })

        // Provide preview query result so canConfirm becomes true
        client.notifyQuery(
          (args: any) => args?.kind === "team",
          createResult({
            root: { kind: "team", id: "team-42", name: "Engineering" },
            counts: { orgs: 0, teams: 1, projects: 1, notes: 2, resources: 0, files: 0, total: 3 },
            fingerprint: "fp-team-42",
            scope: {
              orgIds: [],
              teamIds: ["team-42"],
              projectIds: ["p-1"],
              noteIds: ["n-1", "n-2"],
              resourceIds: [],
              fileIds: [],
            },
            isTruncated: false,
          }),
        )
      })

      // Ensure execution is now outside owner
      expect(getOwner()).toBeNull()

      // Set typed confirmation to valid entity name
      state.typedConfirmation.set("Engineering")
      expect(state.canConfirm()).toBe(true)

      // 3. Confirm click executes outside owner - must NOT throw outside owner and must use factory closure
      await state.onConfirmClick()

      expect(client.mutations.length).toBe(1)
      const firstMutation = client.mutations[0]!
      expect(firstMutation.mutation).toEqual(api.hierarchyDelete.hierarchyDeleteConfirmMutation)
      expect((firstMutation.args as any).kind).toBe("team")
      expect((firstMutation.args as any).teamId).toBe("team-42")
      expect((firstMutation.args as any).fingerprint).toBe("fp-team-42")
      expect(state.activeJobId()).toBe("job-default-1")
      expect(state.jobStatus.get()).toBe("in_progress")

      // 4. Test retry click without custom onRetry handler
      state.jobStatus.set("error")
      state.jobError.set("Network timeout")
      expect(state.canRetry()).toBe(true)

      // Retry click executes outside owner - must NOT throw outside owner and must use factory closure
      await state.onRetryClick()

      expect(client.mutations.length).toBe(2)
      const secondMutation = client.mutations[1]!
      expect(secondMutation.mutation).toEqual(api.hierarchyDeleteControl.hierarchyDeleteRetryMutation)
      expect((secondMutation.args as any).jobId).toBe("job-default-1")
      expect(state.jobStatus.get()).toBe("in_progress")

      dispose()
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(ConvexContext, "defaultValue", originalDescriptor)
      } else {
        delete (ConvexContext as any).defaultValue
        ;(ConvexContext as any).defaultValue = undefined
      }
    }
  })

  test("preserves frozen preview counts and suppresses preview errors/loading when preview shrinks or root is missing after job begins", async () => {
    const client = new MockConvexClient()
    let successCount = 0

    let state!: ReturnType<typeof hierarchyDeleteViewStateCreate>
    const dispose = createRoot((disposeRoot) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }

      const [target] = createSignal<HierarchyDeleteTarget | undefined>({
        kind: "org",
        orgId: "org-1",
      })

      state = hierarchyDeleteViewStateCreate({
        target,
        onConfirm: async () => {
          return createResult({
            jobId: "job-shrink-1",
            status: "pending",
          })
        },
        onSuccess: () => {
          successCount++
        },
      })

      client.notifyQuery(
        (args: any) => args?.kind === "org",
        createResult({
          root: { kind: "org", id: "org-1", name: "Corp" },
          counts: { orgs: 1, teams: 2, projects: 3, notes: 4, resources: 5, files: 6, total: 21 },
          fingerprint: "fp-initial-21",
          scope: { orgIds: ["org-1"], teamIds: [], projectIds: [], noteIds: [], resourceIds: [], fileIds: [] },
          isTruncated: false,
        }),
      )

      return disposeRoot
    })

    state.typedConfirmation.set("Corp")
    expect(state.canConfirm()).toBe(true)

    await state.onConfirmClick()
    expect(state.activeJobId()).toBe("job-shrink-1")
    expect(state.jobStatus.get()).toBe("in_progress")

    // 1. Worker shrinks scope/counts in reactive preview
    client.notifyQuery(
      (args: any) => args?.kind === "org",
      createResult({
        root: { kind: "org", id: "org-1", name: "Corp" },
        counts: { orgs: 1, teams: 0, projects: 1, notes: 0, resources: 1, files: 0, total: 3 },
        fingerprint: "fp-worker-shrink",
        scope: { orgIds: ["org-1"], teamIds: [], projectIds: [], noteIds: [], resourceIds: [], fileIds: [] },
        isTruncated: false,
      }),
    )

    // Frozen preview counts preserved; worker fingerprint change does NOT reset typed confirmation
    expect(state.counts()?.total).toBe(21)
    expect(state.typedConfirmation.get()).toBe("Corp")
    expect(state.previewError()).toBeUndefined()
    expect(state.isPreviewLoading()).toBe(false)

    // 2. Worker deletes root entity -> preview query returns error
    client.notifyQuery(
      (args: any) => args?.kind === "org",
      createResultError("hierarchyDeletePreviewQuery", "Root entity not found"),
    )

    // Suppress obsolete preview error and loading, preserve root name and frozen counts
    expect(state.previewError()).toBeUndefined()
    expect(state.isPreviewLoading()).toBe(false)
    expect(state.rootName()).toBe("Corp")
    expect(state.counts()?.total).toBe(21)
    expect(state.preview()).toBeDefined()

    // 3. Status query completes job -> triggers onSuccess
    client.notifyQuery(
      (args: any) => args?.jobId === "job-shrink-1",
      createResult({
        job: {
          jobId: "job-shrink-1",
          rootKind: "org",
          rootId: "org-1",
          status: "completed",
          counts: { orgs: 1, teams: 2, projects: 3, notes: 4, resources: 5, files: 6, total: 21 },
          scope: { orgIds: ["org-1"], teamIds: [], projectIds: [], noteIds: [], resourceIds: [], fileIds: [] },
          fingerprint: "fp-initial-21",
          requestedByUserId: "user-1",
          createdAt: "2026-10-14T00:00:00Z",
          updatedAt: "2026-10-14T00:00:00Z",
        },
        jobs: [],
      }),
    )

    expect(state.jobStatus.get()).toBe("completed")
    expect(successCount).toBe(1)
    expect(state.previewError()).toBeUndefined()
    expect(state.counts()?.total).toBe(21)

    dispose()
  })

  test("clears job snapshot when target changes to a new entity", async () => {
    const client = new MockConvexClient()
    let state!: ReturnType<typeof hierarchyDeleteViewStateCreate>
    let setTarget!: (target: HierarchyDeleteTarget | undefined) => void

    const dispose = createRoot((disposeRoot) => {
      const owner = getOwner()!
      owner.context = { [ConvexContext.id]: client }

      const [target, set] = createSignal<HierarchyDeleteTarget | undefined>({
        kind: "org",
        orgId: "org-1",
      })
      setTarget = set

      state = hierarchyDeleteViewStateCreate({
        target,
        onConfirm: async () => {
          return createResult({
            jobId: "job-active-1",
            status: "pending",
          })
        },
      })

      client.notifyQuery(
        (args: any) => args?.kind === "org",
        createResult({
          root: { kind: "org", id: "org-1", name: "Corp" },
          counts: { orgs: 1, teams: 0, projects: 0, notes: 0, resources: 0, files: 0, total: 1 },
          fingerprint: "fp-1",
          scope: { orgIds: ["org-1"], teamIds: [], projectIds: [], noteIds: [], resourceIds: [], fileIds: [] },
          isTruncated: false,
        }),
      )

      return disposeRoot
    })

    state.typedConfirmation.set("Corp")
    await state.onConfirmClick()
    expect(state.activeJobId()).toBe("job-active-1")
    expect(state.jobStatus.get()).toBe("in_progress")

    // Change target to a new entity
    setTarget({
      kind: "team",
      teamId: "team-new",
    })

    await Promise.resolve()
    expect(state.activeJobId()).toBeUndefined()
    expect(state.jobStatus.get()).toBe("idle")
    expect(state.typedConfirmation.get()).toBe("")

    dispose()
  })
})
