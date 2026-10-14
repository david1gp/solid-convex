import { describe, expect, it } from "bun:test"
import { fileCreateDataBuild } from "#src/file/ui/upload_file/fileCreateDataBuild.ts"

describe("fileCreateDataBuild", () => {
  it("builds basic unassigned file data without resource", () => {
    const data = fileCreateDataBuild({
      fileId: "f_123",
      displayName: "document.pdf",
      contentType: "application/pdf",
      fileSize: 1024,
      baseUrlR2: "https://r2.example.com",
    })

    expect(data.fileId).toBe("f_123")
    expect(data.displayName).toBe("document.pdf")
    expect(data.url).toBe("https://r2.example.com/f_123")
    expect(data.resourceId).toBeUndefined()
    expect(data.assignment).toBeUndefined()
  })

  it("includes resourceId and explicit assignment when provided", () => {
    const data = fileCreateDataBuild({
      fileId: "f_456",
      displayName: "chart.png",
      contentType: "image/png",
      fileSize: 2048,
      baseUrlR2: "https://r2.example.com",
      imageWidth: 800,
      imageHeight: 600,
      resourceId: "res_abc",
      assignment: { kind: "project", id: "proj_xyz" },
    })

    expect(data.resourceId).toBe("res_abc")
    expect(data.assignment).toEqual({ kind: "project", id: "proj_xyz" })
    expect(data.imageWidth).toBe(800)
    expect(data.imageHeight).toBe(600)
  })

  it("includes resourceId without explicit assignment for backend inheritance", () => {
    const data = fileCreateDataBuild({
      fileId: "f_789",
      displayName: "attached.pdf",
      contentType: "application/pdf",
      fileSize: 4096,
      baseUrlR2: "https://r2.example.com",
      resourceId: "res_parent",
    })

    expect(data.resourceId).toBe("res_parent")
    expect(data.assignment).toBeUndefined()
  })

  it("normalizes base URL without trailing slash", () => {
    const data = fileCreateDataBuild({
      fileId: "f_100",
      displayName: "photo.jpg",
      contentType: "image/jpeg",
      fileSize: 512,
      baseUrlR2: "https://r2.example.com",
    })

    expect(data.url).toBe("https://r2.example.com/f_100")
  })

  it("normalizes base URL with trailing slash without double slashes", () => {
    const data = fileCreateDataBuild({
      fileId: "f_200",
      displayName: "photo.jpg",
      contentType: "image/jpeg",
      fileSize: 512,
      baseUrlR2: "https://r2.example.com/",
    })

    expect(data.url).toBe("https://r2.example.com/f_200")
  })

  it("normalizes base URL with multiple trailing slashes without double slashes", () => {
    const data = fileCreateDataBuild({
      fileId: "f_300",
      displayName: "photo.jpg",
      contentType: "image/jpeg",
      fileSize: 512,
      baseUrlR2: "https://r2.example.com///",
    })

    expect(data.url).toBe("https://r2.example.com/f_300")
  })

  it("builds unlinked upload data with optional hierarchy assignment for new resource creation", () => {
    const data = fileCreateDataBuild({
      fileId: "f_unlinked_1",
      displayName: "document.pdf",
      contentType: "application/pdf",
      fileSize: 1024,
      baseUrlR2: "https://r2.example.com",
      resourceId: undefined,
      assignment: { kind: "team", id: "team_42" },
    })

    expect(data.fileId).toBe("f_unlinked_1")
    expect(data.resourceId).toBeUndefined()
    expect(data.assignment).toEqual({ kind: "team", id: "team_42" })
  })
})
