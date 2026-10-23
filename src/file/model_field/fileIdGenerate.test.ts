import { expect, test } from "bun:test"
import * as a from "valibot"
import { fileIdGenerate } from "#src/file/model_field/fileIdGenerate.ts"
import { fileIdSchema } from "#src/file/model_field/fileIdSchema.ts"

test("generates IDs with a date prefix and normalized ending that pass validation", () => {
  const data = {
    a: "",
    "My document.pdf": ".pdf",
    "Copy of DCC_LEG Education Directory June 2025_GK (3).xlsx": ".xlsx",
    "STEM-Ҳисоботи моҳи августи 2025.docx": "docx",
    "Стратегияи миллии рушди маорифи Ҷумҳурии Тоҷикистон барои давраи то соли 2030.pdf": "pdf",
  } as const

  for (const [given, expected] of Object.entries(data)) {
    const now = new Date(2020, 0, 10)
    const prefix = "2020-01-10_"
    const computed = fileIdGenerate(given, now)
    // console.log("fileIdGenerate: ", given, "->", computed)
    expect(computed).toStartWith(prefix)
    expect(computed).toEndWith(expected)

    const validation = a.safeParse(fileIdSchema, computed)
    if (!validation.success) console.log(computed, "->", validation.issues)
    expect(validation.success).toBe(true)
  }
})
