import { expect, test } from "bun:test"
import { noteTitleDerive } from "#src/note/model/noteTitleDerive.ts"

test("noteTitleDerive strips markdown heading markers from the first content line", () => {
  expect(noteTitleDerive("# Meeting Notes")).toBe("Meeting Notes")
  expect(noteTitleDerive("## Meeting Notes")).toBe("Meeting Notes")
  expect(noteTitleDerive("###   Deep Heading   ")).toBe("Deep Heading")
  expect(noteTitleDerive("###### Level 6")).toBe("Level 6")
})

test("noteTitleDerive falls back to Untitled for empty or heading-only lines", () => {
  expect(noteTitleDerive("")).toBe("Untitled")
  expect(noteTitleDerive("   ")).toBe("Untitled")
  expect(noteTitleDerive("\n\n\t  \n")).toBe("Untitled")
  expect(noteTitleDerive("#")).toBe("Untitled")
  expect(noteTitleDerive("###   ")).toBe("Untitled")
})

test("noteTitleDerive finds first non-empty line and handles plain text without headings", () => {
  expect(noteTitleDerive("Just plain text title")).toBe("Just plain text title")
  expect(noteTitleDerive("\n\n# Second Line Heading\nBody text")).toBe("Second Line Heading")
  expect(noteTitleDerive("First line\n# Not the title")).toBe("First line")
  expect(noteTitleDerive("## Task #42 Status")).toBe("Task #42 Status")
})
