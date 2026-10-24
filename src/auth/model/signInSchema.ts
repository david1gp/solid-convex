import * as a from "valibot"
import { languageSchema } from "#src/app/i18n/language.ts"
import { passwordSchema } from "#src/auth/model_field/passwordSchema.ts"
import { emailSchema } from "#src/utils/valibot/emailSchema.ts"
import { inputMaxLength100 } from "#src/utils/valibot/inputMaxLength100.ts"

export type SignInViaPwType = a.InferOutput<typeof signInViaPwSchema>
export const signInViaPwSchema = a.object({
  email: emailSchema,
  pw: passwordSchema,
  l: languageSchema,
})

export type SignInViaEmailType = a.InferOutput<typeof signInViaEmailSchema>
export const signInViaEmailSchema = a.object({
  email: emailSchema,
  l: languageSchema,
})

export type SignInViaEmailEnterOtpType = a.InferOutput<typeof signInViaEmailEnterOtpSchema>
export const signInViaEmailEnterOtpSchema = a.object({
  email: a.pipe(a.string(), a.email(), a.maxLength(inputMaxLength100)),
  code: a.pipe(a.string(), a.length(6)),
  l: languageSchema,
})
