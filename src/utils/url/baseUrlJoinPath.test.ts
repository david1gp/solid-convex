import { describe, expect, it } from "bun:test"
import { baseUrlJoinPath } from "#src/utils/url/baseUrlJoinPath.ts"

describe("baseUrlJoinPath", () => {
  it("joins base URL and path without trailing slash", () => {
    expect(baseUrlJoinPath("https://r2.example.com", "file123.png")).toBe("https://r2.example.com/file123.png")
  })

  it("joins base URL with single trailing slash without double slashes", () => {
    expect(baseUrlJoinPath("https://r2.example.com/", "file123.png")).toBe("https://r2.example.com/file123.png")
  })

  it("joins base URL with multiple trailing slashes without double slashes", () => {
    expect(baseUrlJoinPath("https://r2.example.com///", "file123.png")).toBe("https://r2.example.com/file123.png")
  })

  it("handles path with leading slash", () => {
    expect(baseUrlJoinPath("https://r2.example.com", "/file123.png")).toBe("https://r2.example.com/file123.png")
    expect(baseUrlJoinPath("https://r2.example.com/", "/file123.png")).toBe("https://r2.example.com/file123.png")
    expect(baseUrlJoinPath("https://r2.example.com///", "///file123.png")).toBe("https://r2.example.com/file123.png")
  })

  it("preserves subpaths on base URL", () => {
    expect(baseUrlJoinPath("https://r2.example.com/subfolder", "file123.png")).toBe(
      "https://r2.example.com/subfolder/file123.png",
    )
    expect(baseUrlJoinPath("https://r2.example.com/subfolder/", "file123.png")).toBe(
      "https://r2.example.com/subfolder/file123.png",
    )
  })

  it("handles empty path or empty base URL", () => {
    expect(baseUrlJoinPath("https://r2.example.com/", "")).toBe("https://r2.example.com")
    expect(baseUrlJoinPath("", "file123.png")).toBe("file123.png")
  })
})
