import * as a from "valibot"
import { cantBeEmpty } from "#src/utils/valibot/cantBeEmpty.ts"
import { inputMaxLengthDefault } from "#src/utils/valibot/inputMaxLengthDefault.ts"

const regexMessage1 = "Must only consist of latin letters, digits and hyphens"
const regexMessage2 = "No consecutive hyphens"
const regexMessage3 = "No leading hyphens"
const regexMessage4 = "No trailing hyphens"

export const orgHandleSchema = a.pipe(
  a.string(),
  a.trim(),
  a.nonEmpty(cantBeEmpty),
  a.minLength(3),
  a.regex(/^[a-zA-Z0-9-]+$/, regexMessage1),
  a.regex(/^(?!.*--)/, regexMessage2),
  a.regex(/^[^-]/, regexMessage3),
  a.regex(/[^-]$/, regexMessage4),
  a.maxLength(inputMaxLengthDefault),
)

export function orgHandleGenerate(name: string) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}
