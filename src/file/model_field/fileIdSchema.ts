import * as a from "valibot"
import { cantBeEmpty } from "#src/utils/valibot/cantBeEmpty.ts"
import { inputMaxLength100 } from "#src/utils/valibot/inputMaxLength100.ts"

const regexMessage1 = "Must only consist of latin lowercase letters, digits, hyphens and underscores"
const regexMessage2 = "No consecutive hyphens or underscores"
const regexMessage3 = "No leading hyphens or underscores"
const regexMessage4 = "No trailing hyphens or underscores"
const regexMessage5 = "Must start with yyyy-mm-dd_ prefix"
const regexMessage6 = "No -_ or _- combinations"
const regexMessage7 = "Minimum length is 15 characters"

export const stringSchema15to100 = a.pipe(
  a.string(),
  a.trim(),
  a.nonEmpty(cantBeEmpty),
  a.minLength(15),
  a.maxLength(inputMaxLength100, "Only a max length of 100 is allowed"),
)

// export const fileIdSchema = stringSchema15to100

export const fileIdSchema = a.pipe(
  a.string(),
  a.trim(),
  a.nonEmpty(cantBeEmpty),
  a.minLength(15, regexMessage7),
  a.regex(/^\d{4}-\d{2}-\d{2}_[a-z0-9\-_.]+$/, regexMessage1),
  a.regex(/^\d{4}-\d{2}-\d{2}_/, regexMessage5),
  a.regex(/^(?!.*--)(?!.*__)(?!.*-_|.*_-)/, regexMessage2 + " and " + regexMessage6),
  a.regex(/^\d{4}-\d{2}-\d{2}_[^-]/, regexMessage3),
  a.regex(/[^-_]$/, regexMessage4),
  a.maxLength(inputMaxLength100),
)
