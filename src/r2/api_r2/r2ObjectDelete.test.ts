import { describe, expect, mock, test } from "bun:test"
import { type S3Client, S3Errors } from "@bradenmacdonald/s3-lite-client"
import type { ActionCtx } from "#convex/_generated/server.js"
import { r2ObjectDelete } from "#src/r2/api_r2/r2ObjectDelete.ts"
import { r2ObjectDeleteActionFn } from "#src/r2/convex/r2ObjectDeleteInternalAction.ts"

describe("r2ObjectDelete", () => {
  test("deletes existing object and returns success with deleted true", async () => {
    let deletedKey = ""
    const mockClient = {
      deleteObject: mock(async (key: string) => {
        deletedKey = key
      }),
    } as unknown as S3Client

    const result = await r2ObjectDelete("file-12345.pdf", mockClient)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ fileId: "file-12345.pdf", deleted: true })
    }
    expect(deletedKey).toBe("file-12345.pdf")
  })

  test("handles missing object idempotently with ServerError 404 NoSuchKey", async () => {
    const mockClient = {
      deleteObject: mock(async () => {
        throw new S3Errors.ServerError(404, "NoSuchKey", "The specified key does not exist.")
      }),
    } as unknown as S3Client

    const result = await r2ObjectDelete("file-missing.pdf", mockClient)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ fileId: "file-missing.pdf", deleted: false })
    }
  })

  test("handles missing object idempotently with ServerError NotFound", async () => {
    const mockClient = {
      deleteObject: mock(async () => {
        throw new S3Errors.ServerError(404, "NotFound", "Not Found")
      }),
    } as unknown as S3Client

    const result = await r2ObjectDelete("file-not-found.pdf", mockClient)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ fileId: "file-not-found.pdf", deleted: false })
    }
  })

  test("handles missing object idempotently with generic 404 error", async () => {
    const mockClient = {
      deleteObject: mock(async () => {
        const error = new Error("Object not found (404)")
        throw error
      }),
    } as unknown as S3Client

    const result = await r2ObjectDelete("file-404.pdf", mockClient)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ fileId: "file-404.pdf", deleted: false })
    }
  })

  test("exposes storage errors on unexpected ServerError (403 AccessDenied)", async () => {
    const mockClient = {
      deleteObject: mock(async () => {
        throw new S3Errors.ServerError(403, "AccessDenied", "Access Denied.")
      }),
    } as unknown as S3Client

    const result = await r2ObjectDelete("file-protected.pdf", mockClient)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.op).toBe("r2ObjectDelete")
      expect(result.errorMessage).toContain("Access Denied")
    }
  })

  test("exposes storage errors on network or unexpected server failures", async () => {
    const mockClient = {
      deleteObject: mock(async () => {
        throw new Error("Connection reset by peer")
      }),
    } as unknown as S3Client

    const result = await r2ObjectDelete("file-net.pdf", mockClient)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.op).toBe("r2ObjectDelete")
      expect(result.errorMessage).toContain("Connection reset by peer")
    }
  })

  test("returns error when fileId is empty string", async () => {
    const mockClient = {
      deleteObject: mock(async () => undefined),
    } as unknown as S3Client

    const result = await r2ObjectDelete("   ", mockClient)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.op).toBe("r2ObjectDelete")
      expect(result.errorMessage).toBe("fileId must be a non-empty string")
    }
    expect(mockClient.deleteObject).not.toHaveBeenCalled()
  })

  test("r2ObjectDeleteActionFn delegates to r2ObjectDelete with fileId argument", async () => {
    const result = await r2ObjectDeleteActionFn({} as ActionCtx, { fileId: "   " })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.op).toBe("r2ObjectDelete")
    }
  })
})
