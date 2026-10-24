import * as a from "valibot"
import { inputMaxLength100 } from "#src/utils/valibot/inputMaxLength100.ts"

export const emailSchemaOptional = a.union([
  a.pipe(a.string(), a.length(0)),
  a.pipe(
    a.string(),
    a.maxLength(inputMaxLength100, "Only a max length of 100 is allowed"),
    a.email("The email is badly formatted"),
  ),
])
