import { expect, test } from "bun:test"
import * as a from "valibot"
import {
  resourceIdGenerateFromName,
  resourceIdNamCutoffLength,
} from "#src/resource/model/resourceIdGenerateFromName.ts"
import { resourceIdSchema } from "#src/resource/model/resourceIdSchema.ts"

type Entry = {
  start?: string
  end?: string
}

test("generates dated slug resource IDs from file names", () => {
  const data: Record<string, Entry> = {
    a: { start: "a" },
    "My Document.pdf": { start: "my_document", end: ".pdf" },
    "Copy of DCC_LEG Education Directory June 2025_GK (3).xlsx": {
      start: "copy_of_dcc_leg_education_directory_june_2025_gk-3",
      end: ".xlsx",
    },
    "stem-Ҳисоботи моҳи августи 2025": { start: "stem-2025" },
    "Стратегияи миллии рушди маорифи Ҷумҳурии Тоҷикистон барои давраи то соли 2030": { start: "2030" },
  }

  for (const [given, expected] of Object.entries(data)) {
    const now = new Date(2020, 0, 10)
    const prefix = "2020-01-10_"
    const computed = resourceIdGenerateFromName(given, now)
    if (expected.start) {
      expect(computed).toStartWith(prefix + expected.start)
    }

    const validation = a.safeParse(resourceIdSchema, computed)
    if (!validation.success) console.log(computed, "->", validation.issues)
    expect(validation.success).toBe(true)
  }
})

test("truncates long file names to the cutoff length", () => {
  const now = new Date(2020, 0, 10)
  const prefix = "2020-01-10_"
  const test = "a".repeat(resourceIdNamCutoffLength + 1)
  const result = resourceIdGenerateFromName(test, now)
  expect(result).toStartWith(prefix + "a".repeat(resourceIdNamCutoffLength))

  const validation = a.safeParse(resourceIdSchema, result)
  if (!validation.success) console.log(result, "->", validation.issues)
  expect(validation.success).toBe(true)
})
