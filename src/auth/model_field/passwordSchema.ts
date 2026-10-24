import * as a from "valibot"
import { cantBeEmpty } from "#src/utils/valibot/cantBeEmpty.ts"
import { inputMaxLengthUrl } from "#src/utils/valibot/inputMaxLengthUrl.ts"

export const requiredPasswordLength = 12

export const passwordSchema = a.pipe(
  a.string(),
  a.nonEmpty(cantBeEmpty),
  a.minLength(requiredPasswordLength, "Password is to short"),
  a.maxLength(inputMaxLengthUrl),
)
