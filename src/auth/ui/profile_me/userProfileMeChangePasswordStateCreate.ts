import * as a from "valibot"
import type { Result } from "#result"
import { passwordSchema } from "#src/auth/model_field/passwordSchema.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"
import { profileMeStepSignalCreate } from "./profileMeStepSignalCreate.ts"

export function userProfileMeChangePasswordStateCreate(actions: {
  request: () => Promise<Result<unknown>>
  confirm: (code: string, password: string) => Promise<Result<unknown>>
}) {
  const step = profileMeStepSignalCreate()
  const code = createSignalObject("")
  const password = createSignalObject("")
  const codeError = createSignalObject("")
  const passwordError = createSignalObject("")
  const submitting = createSignalObject(false)
  const message = createSignalObject("")

  async function request(e: SubmitEvent) {
    e.preventDefault()
    if (submitting.get()) return
    submitting.set(true)
    const result = await actions.request()
    submitting.set(false)
    if (!result.success) {
      message.set(result.errorMessage)
      return
    }
    message.set("Verification code sent")
    step.goToConfirmation()
  }

  async function confirm(e: SubmitEvent) {
    e.preventDefault()
    if (submitting.get()) return
    const nextCodeError = /^\d{6}$/.test(code.get()) ? "" : "Please enter a valid 6-digit confirmation code"
    const nextPasswordError = a.safeParse(passwordSchema, password.get()).success
      ? ""
      : "Password must be at least 12 characters"
    codeError.set(nextCodeError)
    passwordError.set(nextPasswordError)
    if (nextCodeError || nextPasswordError) return
    submitting.set(true)
    const result = await actions.confirm(code.get(), password.get())
    submitting.set(false)
    if (!result.success) {
      message.set(result.errorMessage)
      return
    }
    password.set("")
    message.set("Password changed successfully!")
  }

  return {
    step: step.get,
    code: code.get,
    password: password.get,
    codeError: codeError.get,
    passwordError: passwordError.get,
    submitting: submitting.get,
    message: message.get,
    codeInput: (value: string) => code.set(value),
    passwordInput: (value: string) => password.set(value),
    back: step.goBack,
    request,
    confirm,
  }
}
