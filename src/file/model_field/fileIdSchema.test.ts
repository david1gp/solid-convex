import { expect, test } from "bun:test"
import * as a from "valibot"
import { fileIdSchema } from "./fileIdSchema.js"

test("accepts well-formed file IDs with a date prefix and normalized ending", () => {
  const validFileIds = [
    "2024-01-15_document-name",
    "2024-01-15_file-name_with-underscore",
    "2024-01-15_my-file_123",
    "2024-01-15_test-document-example",
    "2024-01-15_file_name",
  ]
  validFileIds.forEach((fileId) => {
    const result = a.safeParse(fileIdSchema, fileId)
    if (result.success) console.log("wrongly classified ", fileId, "as invalid")
    expect(result.success).toBe(true)
  })
})

test("rejects malformed file IDs", () => {
  const invalidFileIds = [
    "too-short", // less than 15 characters
    "2024-1-1_file", // incorrect date format (should be yyyy-mm-dd_)
    "2024-01-15_f", // too short after prefix (only 1 char after 10-char prefix)
    "_2024-01-15_file", // leading underscore after prefix
    "2024-01-15_file_", // trailing underscore
    "2024-01-15_file__name", // consecutive underscores
    "2024-01-15_file--name", // consecutive hyphens
    "2024-01-15_file-_name", // -_ combination
    "2024-01-15_file_-name", // _- combination
    "2024-01-15_File-Name", // uppercase letters
    "2024-01-15_file@name", // special characters
    "2024-01-15_файл", // non-ASCII characters
  ]
  invalidFileIds.forEach((fileId) => {
    const result = a.safeParse(fileIdSchema, fileId)
    if (result.success) console.log("wrongly classified ", fileId, "as valid")
    expect(result.success).toBe(false)
  })
})
