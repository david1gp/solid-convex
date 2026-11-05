import { randomUUID } from "node:crypto"
import { createResult, createResultError, type Result } from "#result"
import { e2eSsoCheckpointStoreCreate } from "./e2eSsoCheckpointStoreCreate.ts"
import { e2eSsoSessionOwnershipProve } from "./e2eSsoSessionOwnershipProve.ts"
import type { E2eSsoSessionObservation } from "./e2eSsoSessionObservationSchema.ts"
import type { e2eSsoSessionMarkTransportCreate } from "./e2eSsoSessionMarkTransportCreate.ts"
import { e2eSsoStepIds } from "./e2eSsoStepIds.ts"

export async function e2eSsoWorkflowRun(options: {
  store: ReturnType<typeof e2eSsoCheckpointStoreCreate>
  backendUrl: string
  accountKey: string
  sessionsRead: () => Promise<Result<E2eSsoSessionObservation[]>>
  sessionMark: ReturnType<typeof e2eSsoSessionMarkTransportCreate>
  browserSessionRead: () => Promise<Result<{ userId: string; token: string; tokenDigest: string }>>
  steps: Record<(typeof e2eSsoStepIds)[number], () => Promise<Result<void>>>
  now?: () => number
}): Promise<Result<void>> {
  const op = "e2eSsoWorkflowRun"
  const now = options.now ?? Date.now
  const loaded = await options.store.load()
  if (!loaded.success) return loaded
  let checkpoint = loaded.data
  let state = checkpoint.ssoSignIn ?? {
    backendUrl: options.backendUrl,
    accountKey: options.accountKey,
    completedStepIds: [],
    attempts: [],
  }
  if (state.backendUrl !== options.backendUrl || state.accountKey !== options.accountKey)
    return createResultError(op, "SSO backend/account context does not match the checkpoint")
  const baseline = await options.sessionsRead()
  if (!baseline.success) return baseline
  for (const pending of state.attempts) {
    if (!pending.browser || pending.sessionResourceId) continue
    const proof = e2eSsoSessionOwnershipProve({
      sessions: baseline.data,
      e2eRunId: checkpoint.runId,
      ownedAt: checkpoint.createdAt,
      baselineSessionIds: pending.baselineSessionIds,
      startedAt: pending.startedAt,
      now: now(),
      browser: pending.browser,
    })
    if (!proof.success) return proof
    const registered = await options.store.register(proof.data)
    if (!registered.success) return registered
    state = {
      ...state,
      attempts: state.attempts.map((entry) =>
        entry.attemptId === pending.attemptId ? { ...entry, sessionResourceId: registered.data } : entry,
      ),
    }
  }
  const reconciled = await options.store.load()
  if (!reconciled.success) return reconciled
  checkpoint = reconciled.data
  const owned = checkpoint.ownedResources.filter((resource) => resource.resourceType === "auth-session")
  for (const resource of owned) {
    const proof = resource.sessionProof
    if (
      !proof ||
      resource.ownerRunId !== checkpoint.runId ||
      proof.e2eRunId !== checkpoint.runId ||
      proof.ownedAt !== checkpoint.createdAt ||
      resource.resourceId !== `e2e-${checkpoint.runId}-session-${proof.sessionId}` ||
      resource.createdAt !== proof.creationTime
    )
      return createResultError(op, "Invalid persisted session ownership")
    const remote = baseline.data.find((session) => session.sessionId === proof.sessionId)
    // Missing/revoked sessions are not restored. Keep immutable evidence and authenticate anew.
    if (remote && JSON.stringify(remote) !== JSON.stringify(proof))
      return createResultError(op, "Persisted session identity/creation time changed remotely")
  }
  const attempt = {
    attemptId: randomUUID(),
    startedAt: now(),
    baselineSessionIds: baseline.data.map((s) => s.sessionId),
  }
  state = { ...state, attempts: [...state.attempts, attempt] }
  const intentSaved = await options.store.save({ ...checkpoint, ssoSignIn: state })
  if (!intentSaved.success) return intentSaved

  // A fresh browser has neither the provider transaction nor app authentication. Reestablish
  // those preconditions explicitly, even for logically completed steps; never rewind progress.
  for (const [index, stepId] of e2eSsoStepIds.entries()) {
    const step = await options.steps[stepId]()
    if (!step.success) return step
    if (stepId === "password-submit") {
      const browser = await options.browserSessionRead()
      if (!browser.success) return browser
      state = {
        ...state,
        attempts: state.attempts.map((entry) =>
          entry.attemptId === attempt.attemptId
            ? { ...entry, browser: { userId: browser.data.userId, tokenDigest: browser.data.tokenDigest } }
            : entry,
        ),
      }
      const observed = await options.store.save({ ...checkpoint, ssoSignIn: state })
      if (!observed.success) return observed
      if (owned.some((resource) => resource.sessionProof?.userId !== browser.data.userId))
        return createResultError(op, "Reauthenticated browser identity differs from the original SSO account")
      const marked = await options.sessionMark({
        token: browser.data.token,
        userId: browser.data.userId,
        e2eRunId: checkpoint.runId,
        ownedAt: checkpoint.createdAt,
      })
      if (!marked.success) return marked
      const sessions = await options.sessionsRead()
      if (!sessions.success) return sessions
      const proof = e2eSsoSessionOwnershipProve({
        sessions: sessions.data,
        e2eRunId: checkpoint.runId,
        ownedAt: checkpoint.createdAt,
        baselineSessionIds: attempt.baselineSessionIds,
        startedAt: attempt.startedAt,
        now: now(),
        browser: browser.data,
      })
      if (!proof.success) return proof
      if (
        proof.data.sessionId !== marked.data.sessionId ||
        proof.data.createdAt !== marked.data.createdAt ||
        proof.data.creationTime !== marked.data.creationTime ||
        proof.data.tokenDigest !== marked.data.tokenDigest
      )
        return createResultError(op, "Registered session does not match the browser ownership proof")
      const registration = await options.store.register(proof.data)
      if (!registration.success) return registration
      state = {
        ...state,
        attempts: state.attempts.map((entry) =>
          entry.attemptId === attempt.attemptId ? { ...entry, sessionResourceId: registration.data } : entry,
        ),
      }
    }
    const refreshed = await options.store.load()
    if (!refreshed.success) return refreshed
    checkpoint = refreshed.data
    state = {
      ...state,
      completedStepIds: [...e2eSsoStepIds].slice(0, Math.max(state.completedStepIds.length, index + 1)),
    }
    const saved = await options.store.save({ ...checkpoint, ssoSignIn: state })
    if (!saved.success) return saved
  }
  return createResult(undefined)
}
