import * as a from "valibot"
import type { Result } from "#result"
import { userProfileSchema } from "#src/auth/model/UserProfile.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"
import { profileMeStepSignalCreate } from "./profileMeStepSignalCreate.ts"

export function userProfileMeChangeEmailStateCreate(actions: {
  hasPassword: () => boolean
  initialEmail?: string
  request: (email: string, password: string) => Promise<Result<unknown>>
  confirm: (email: string, code: string) => Promise<Result<unknown>>
}) {
  const step = profileMeStepSignalCreate()
  const password = createSignalObject("")
  const email = createSignalObject(actions.initialEmail ?? "")
  const code = createSignalObject("")
  const passwordError = createSignalObject("")
  const emailError = createSignalObject("")
  const codeError = createSignalObject("")
  const submitting = createSignalObject(false)
  const message = createSignalObject("")

  async function request(e: SubmitEvent) {
    e.preventDefault()
    if (submitting.get()) return
    const newEmail = email.get().trim()
    const nextPasswordError = actions.hasPassword() && !password.get() ? "Current password is required" : ""
    const nextEmailError =
      newEmail && a.safeParse(userProfileSchema.entries.email, newEmail).success
        ? ""
        : "Please enter a valid email address"
    passwordError.set(nextPasswordError)
    emailError.set(nextEmailError)
    codeError.set("")
    if (nextPasswordError || nextEmailError) return
    submitting.set(true)
    const result = await actions.request(newEmail, password.get())
    submitting.set(false)
    if (!result.success) {
      message.set(result.errorMessage)
      return
    }
    email.set(newEmail)
    password.set("")
    message.set("Verification code sent")
    step.goToConfirmation()
  }

  async function confirm(e: SubmitEvent) {
    e.preventDefault()
    if (submitting.get()) return
    const nextCodeError = /^\d{6}$/.test(code.get()) ? "" : "Please enter a valid 6-digit confirmation code"
    const nextEmailError =
      email.get() && a.safeParse(userProfileSchema.entries.email, email.get()).success
        ? ""
        : "Please enter a valid email address"
    codeError.set(nextCodeError)
    emailError.set(nextEmailError)
    if (nextCodeError || nextEmailError) return
    submitting.set(true)
    const result = await actions.confirm(email.get(), code.get())
    submitting.set(false)
    if (!result.success) {
      message.set(result.errorMessage)
      return
    }
    message.set("Email changed successfully!")
  }

  return {
    step: step.get,
    hasPassword: actions.hasPassword,
    password: password.get,
    email: email.get,
    code: code.get,
    passwordError: passwordError.get,
    emailError: emailError.get,
    codeError: codeError.get,
    submitting: submitting.get,
    message: message.get,
    passwordInput: (value: string) => password.set(value),
    emailInput: (value: string) => email.set(value),
    codeInput: (value: string) => code.set(value),
    back: step.goBack,
    request,
    confirm,
  }
}
