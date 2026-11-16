import { mdiEmailCheck } from "@adaptive-ds/mdi/mdiEmailCheck.js"
import { Show } from "solid-js"
import type { EnterOtpFormProps } from "#src/auth/ui/email/EnterOtpFormProps.ts"
import { enterOtpFormStateCreate } from "#src/auth/ui/email/EnterOtpFormStateCreate.ts"
import { Label } from "#ui/input/label/Label.jsx"
import { ButtonIcon } from "#ui/interactive/button/ButtonIcon.jsx"
import { buttonVariant } from "#ui/interactive/button/buttonCva.ts"
import { cn } from "cn"
import { OtpInput6Numbers } from "./OtpInput6Numbers.js"

export function EnterOtpForm(p: EnterOtpFormProps) {
  const state = enterOtpFormStateCreate(() => p)

  return (
    <form onSubmit={state.handleSubmit} autocomplete="off" class={cn("flex flex-col gap-2", p.class)}>
      <div class="flex flex-col gap-2 mb-2">
        <h1 class="text-2xl font-bold text-foreground">{p.title}</h1>
        <p class="text-muted-foreground">{p.subtitle}</p>
        <p class="text-muted-foreground">
          {p.sentMessage} <span class="font-medium">{state.email.get()}</span>.
        </p>
        <p class="text-muted-foreground">{p.instruction}</p>
      </div>
      <div class="flex flex-col gap-2">
        <Label for={state.otpInputId}>{state.verificationCodeLabel}</Label>
        <OtpInput6Numbers id={state.otpInputId} valueSignal={state.otp} error={!!state.otpError.get()} />
        <Show when={state.otpError.get()}>
          <p class="text-sm text-red-500">{state.otpError.get()}</p>
        </Show>
      </div>
      <ButtonIcon
        type="submit"
        variant={buttonVariant.filledIndigo}
        icon={mdiEmailCheck}
        disabled={state.otp.get().length !== 6}
        isLoading={state.isSubmitting.get()}
        class="w-full"
      >
        {state.isSubmitting.get() ? "Verifying..." : p.buttonText}
      </ButtonIcon>
    </form>
  )
}
