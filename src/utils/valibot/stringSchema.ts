import * as a from "valibot"
import { cantBeEmpty } from "#src/utils/valibot/cantBeEmpty.ts"
import { inputMaxLength100 } from "#src/utils/valibot/inputMaxLength100.ts"
import { inputMaxLength500 } from "#src/utils/valibot/inputMaxLength500.ts"

export const stringSchema0to100 = a.pipe(
  a.string(),
  a.trim(),
  a.maxLength(inputMaxLength100, "Only a max length of 100 is allowed"),
)
export const stringSchema1to100 = a.pipe(
  a.string(),
  a.trim(),
  a.nonEmpty(cantBeEmpty),
  a.maxLength(inputMaxLength100, "Only a max length of 100 is allowed"),
)

export const stringSchema = stringSchema0to100
export const stringSchemaId = stringSchema1to100
export const stringSchemaName = stringSchema1to100

// Url
export const stringSchema0to500 = a.pipe(
  a.string(),
  a.trim(),
  a.maxLength(inputMaxLength500, "Only a max length of 500 is allowed"),
)
export const stringSchemaUrl = stringSchema0to500

// Description
export const stringSchema0to5000 = a.pipe(a.string(), a.trim(), a.maxLength(5_000))
export const stringSchemaDescription = stringSchema0to5000
