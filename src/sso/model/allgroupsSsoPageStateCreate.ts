import { useNavigate } from "@tanstack/solid-router"
import { createEffect } from "solid-js"
import { userSessionIsStillValid } from "#src/auth/model/UserSession.ts"
import { userSessionSignal } from "#src/auth/ui/signals/userSessionSignal.ts"
import { urlSignInViaOidc } from "#src/auth/url/urlSignInViaOidc.ts"
import { navigateTo } from "#src/utils/router/navigateTo.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"
import { allgroupsSsoAttemptRecord } from "./allgroupsSsoAttemptRecord.ts"
import { allgroupsSsoAttemptsReset } from "./allgroupsSsoAttemptsReset.ts"
import { allgroupsSsoPreferenceRead } from "./allgroupsSsoPreferenceRead.ts"
import { allgroupsSsoPreferenceWrite } from "./allgroupsSsoPreferenceWrite.ts"
import { allgroupsSsoReturnToResolve } from "./allgroupsSsoReturnToResolve.ts"

export const allgroupsSsoPageStateCreate = () => {
  const navigate = useNavigate()

  const pending = createSignalObject(false)
  const errorMessage = createSignalObject<string | null>(null)
  const autoSignIn = createSignalObject(allgroupsSsoPreferenceRead())

  const returnTarget = () => {
    if (typeof window === "undefined") return allgroupsSsoReturnToResolve(null)
    const searchParams = new URLSearchParams(window.location.search)
    return allgroupsSsoReturnToResolve(searchParams.get("returnTo"))
  }

  const login = () => {
    const session = userSessionSignal.get()
    if (session !== null && userSessionIsStillValid(session)) {
      void navigate({ to: returnTarget() })
      return
    }
    pending.set(true)
    errorMessage.set(null)
    const target = returnTarget()
    const url = urlSignInViaOidc(target)
    if (!url) {
      pending.set(false)
      errorMessage.set("Authentication service is unavailable.")
      return
    }
    navigateTo(url)
  }

  // If already authenticated, proceed to the safe destination immediately
  createEffect(
    () => userSessionSignal.get(),
    (session) => {
      if (session !== null && userSessionIsStillValid(session)) {
        // Authentication succeeded; local attempt cleanup is best effort and must not block navigation.
        allgroupsSsoAttemptsReset()
        const target = returnTarget()
        void navigate({ to: target })
      }
    },
  )

  let autoSignInInitiated = false
  createEffect(
    () => ({ session: userSessionSignal.get(), enabled: autoSignIn.get() }),
    ({ session, enabled }) => {
      if (autoSignInInitiated) return
      if (session !== null && userSessionIsStillValid(session)) return
      if (!enabled) return

      const record = allgroupsSsoAttemptRecord()
      if (!record.success) {
        errorMessage.set(record.errorMessage)
        return
      }
      if (!record.data.allowed) {
        errorMessage.set("Automatic sign-in was paused after multiple attempts. Please sign in manually.")
        return
      }

      autoSignInInitiated = true
      login()
    },
  )

  const autoSignInToggle = (enabled: boolean) => {
    const preferenceWrite = allgroupsSsoPreferenceWrite(enabled)
    if (!preferenceWrite.success) {
      errorMessage.set(preferenceWrite.errorMessage)
      return
    }

    autoSignIn.set(enabled)
    if (!enabled) return

    autoSignInInitiated = true
    const record = allgroupsSsoAttemptRecord()
    if (!record.success) {
      errorMessage.set(record.errorMessage)
      return
    }
    if (!record.data.allowed) {
      errorMessage.set("Automatic sign-in was paused after multiple attempts. Please sign in manually.")
      return
    }

    login()
  }

  return {
    isPending: pending.get,
    errorMessage: errorMessage.get,
    autoSignIn: autoSignIn.get,
    autoSignInToggle,
    loginClick: login,
  }
}
