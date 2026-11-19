import * as a from "valibot"
import { createResult, createResultError } from "#result"
import { type UserSession, userSessionIsStillValid, userSessionSchema } from "#src/auth/model/UserSession.ts"
import { createSignalObject, type SignalObject } from "#ui/utils/createSignalObject.ts"

const userSessionsLocalStorageKey = "userSessions"
const userSessionsSchema = a.array(userSessionSchema)

export const userSessionsSignal: SignalObject<UserSession[]> = createUserSessionsSignal()

export function userSessionsSignalAdd(newSession: UserSession): UserSession[] {
  const userSessions = userSessionsSignal.get()
  const newSessions = addUserSesssionOrReplace(userSessions, newSession)
  userSessionsSignal.set(newSessions)
  return newSessions
}

function addUserSesssionOrReplace(userSessions: UserSession[], userProfile: UserSession) {
  const existingUserIndex = userSessions.findIndex((session) => session.profile.userId === userProfile.profile.userId)
  const newSessions = [...userSessions]

  if (existingUserIndex !== -1) {
    // Update existing user session
    newSessions[existingUserIndex] = userProfile
  } else {
    // Add new user session
    newSessions.push(userProfile)
  }
  return newSessions
}

function createUserSessionsSignal(): SignalObject<UserSession[]> {
  let hasLoaded = false
  const signal = createSignalObject<UserSession[]>([])

  // Override get to from localStorage if not already loaded
  const originalGet = signal.get
  signal.get = () => {
    if (!hasLoaded) {
      const result = userSessionsLoadFromLocalStorage()
      if (result.success) {
        signal.set(result.data)
      }
      hasLoaded = true
    }
    return originalGet()
  }

  // Override the set method to also save to localStorage
  const originalSet = signal.set
  signal.set = (value) => {
    const result = originalSet(value)
    userSessionsSaveToLocalStorage(value)
    return result
  }

  return signal
}

export function userSessionsLoadFromLocalStorage() {
  const op = "userSessionsLoadFromLocalStorage"
  const read = localStorage.getItem(userSessionsLocalStorageKey)
  if (!read) return createResultError(op, "no userSessions saved in localStorage")
  const schema = a.pipe(a.string(), a.parseJson(), userSessionsSchema)
  const parsing = a.safeParse(schema, read)
  if (!parsing.success) {
    return createResultError(op, a.summarize(parsing.issues), read)
  }
  // filter by expiredAt
  const filtered = parsing.output.filter(userSessionIsStillValid)
  return createResult(filtered)
}

export function userSessionsSaveToLocalStorage(sessions: UserSession[]) {
  const serialized = JSON.stringify(sessions, null, 2)
  localStorage.setItem(userSessionsLocalStorageKey, serialized)
}

import { onCleanup, onSettled } from "solid-js"

export function userSessionsSignalRegisterHandler(signal = userSessionsSignal) {
  function handleStorageEvent(event: StorageEvent) {
    if (event.key !== userSessionsLocalStorageKey) return
    if (event.newValue == null) return
    const schema = a.pipe(a.string(), a.parseJson(), userSessionsSchema)
    const parsing = a.safeParse(schema, event.newValue)
    if (parsing.success) {
      signal.set(parsing.output)
    }
  }
  onSettled(() => {
    if (typeof window === "undefined") return
    window.addEventListener("storage", handleStorageEvent)
  })
  onCleanup(() => {
    if (typeof window === "undefined") return
    window.removeEventListener("storage", handleStorageEvent)
  })
}
