import { createEffect, onSettled as onMount } from "solid-js"
import * as a from "valibot"
import { ttc } from "#src/app/i18n/ttc.ts"
import { otpSchema } from "#src/auth/model_field/otpSchema.ts"
import type { EnterOtpFormProps } from "#src/auth/ui/email/EnterOtpFormProps.ts"
import { urlSignInRedirectUrl } from "#src/auth/url/urlSignInRedirectUrl.ts"
import { createUrl } from "#src/utils/router/createUrl.ts"
import { searchParamGet } from "#src/utils/router/searchParamGet.ts"
import { createSignalObject } from "#ui/utils/createSignalObject.ts"

export function enterOtpFormStateCreate(props: () => EnterOtpFormProps) {
  const otpError = createSignalObject("")
  const isSubmitting = createSignalObject(false)
  const otp = createSignalObject("")
  const email = createSignalObject(props().initialEmail ?? "")
  let url: URL | null = null

  onMount(() => {
    if (props().initialEmail !== undefined) return
    url = createUrl()
    const emailParam = searchParamGet("email", url)
    if (emailParam) email.set(emailParam)
    const codeParam = searchParamGet("code", url) ?? ""
    if (codeParam) otp.set(codeParam)
  })

  function getReturnPath() {
    if (!url) return ""
    return searchParamGet("returnPath", url) || urlSignInRedirectUrl()
  }

  function validateOtp(value: string) {
    const result = a.safeParse(otpSchema, value)
    if (result.success) {
      otpError.set("")
      return true
    }
    const message = result.issues[0]?.message || "Invalid code"
    otpError.set(message)
    return false
  }

  createEffect(() => {
    const value = otp.get()
    if (value.length === 6) {
      validateOtp(value)
      return
    }
    otpError.set("")
  })

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    if (isSubmitting.get()) {
      const title = ttc("Submission in progress, please wait")
      console.info(title)
      return
    }
    const otpValue = otp.get()
    if (!validateOtp(otpValue)) return
    isSubmitting.set(true)
    try {
      await props().actionFn(otpValue, email.get(), getReturnPath())
    } catch (error) {
      console.error("Email confirmation failed:", error)
      otpError.set("Verification failed. Please try again.")
    } finally {
      isSubmitting.set(false)
    }
  }

  return {
    email,
    handleSubmit,
    isSubmitting,
    otp,
    otpError,
    otpInputId: "otp-input",
    verificationCodeLabel: ttc("Verification Code"),
  }
}
