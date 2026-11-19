import { flush } from "solid-js"
import { afterEach, expect, test } from "bun:test"
import { authPageDemoRendererStateCreate } from "#src/app/demos/authPageDemoRendererStateCreate.ts"
import { signInViaEmailDemoStateCreate } from "#src/auth/ui/sign_in/via_email/signInViaEmailDemoStateCreate.ts"
import { signInViaPasswordDemoStateCreate } from "#src/auth/ui/sign_in/via_pw/signInViaPasswordDemoStateCreate.ts"

afterEach(() => {
  const store = authPageDemoRendererStateCreate().store
  flush()
  store.email.set("demo@example.com")
  flush()
  store.message.set("")
  flush()
})

test("email demo validates locally and shares the entered address with the OTP demo", () => {
  const demo = authPageDemoRendererStateCreate()
  const form = signInViaEmailDemoStateCreate()
  const event = { preventDefault() {} } as SubmitEvent
  flush()
  form.state.email.set("invalid")
  flush()
  form.handleSubmit(event)
  flush()
  expect(form.errors.email.get()).not.toBe("")
  expect(demo.store.email.get()).toBe("demo@example.com")

  flush()
  form.state.email.set("alice@example.com")
  flush()
  form.handleSubmit(event)
  flush()
  expect(form.errors.email.get()).toBe("")
  expect(demo.store.email.get()).toBe("alice@example.com")
  expect(demo.otpHref).toBe("/demos/sign-in-enter-otp")
})

test("password and OTP demo submits update memory without signing in or navigating", async () => {
  const demo = authPageDemoRendererStateCreate()
  const form = signInViaPasswordDemoStateCreate()
  flush()
  form.state.email.set("alice@example.com")
  flush()
  form.state.password.set("demo-password-123")
  flush()
  form.handleSubmit({ preventDefault() {} } as SubmitEvent)
  flush()
  expect(demo.store.message.get()).toContain("No sign-in was attempted")
  expect(demo.store.email.get()).toBe("alice@example.com")

  flush()
  await demo.confirm("123456", demo.store.email.get())
  flush()
  expect(demo.store.message.get()).toContain("123456")
  expect(demo.signInHref).toBe("/demos/sign-in")
  expect(demo.errorHref).toBe("/demos/sign-in-error")
})
