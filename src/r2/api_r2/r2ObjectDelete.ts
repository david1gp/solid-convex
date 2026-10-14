import { type S3Client, S3Errors } from "@bradenmacdonald/s3-lite-client"
import { createResult, createResultError, type PromiseResult } from "#result"
import { r2CreateClient } from "#src/r2/api_r2/r2CreateClient.ts"

export interface R2ObjectDeleteOutput {
  fileId: string
  deleted: boolean
}

function isMissingObjectError(error: unknown): boolean {
  if (error instanceof S3Errors.ServerError) {
    if (error.statusCode === 404 || error.code === "NoSuchKey" || error.code === "NotFound") {
      return true
    }
  }

  if (typeof error === "object" && error !== null) {
    const errorRecord = error as Record<string, unknown>
    if (errorRecord.statusCode === 404 || errorRecord.status === 404) {
      return true
    }
    if (
      typeof errorRecord.code === "string" &&
      (errorRecord.code === "NoSuchKey" || errorRecord.code === "NotFound" || errorRecord.code === "ResourceNotFound")
    ) {
      return true
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes("nosuchkey") || message.includes("not found") || message.includes("404")) {
      return true
    }
  }

  return false
}

export async function r2ObjectDelete(fileId: string, client?: S3Client): PromiseResult<R2ObjectDeleteOutput> {
  const op = "r2ObjectDelete"

  if (!fileId || typeof fileId !== "string" || fileId.trim() === "") {
    return createResultError(op, "fileId must be a non-empty string")
  }

  const clientResult = client ? createResult(client) : r2CreateClient()
  if (!clientResult.success) {
    return clientResult
  }

  const s3 = clientResult.data

  try {
    await s3.deleteObject(fileId)
    return createResult({ fileId, deleted: true })
  } catch (error) {
    if (isMissingObjectError(error)) {
      return createResult({ fileId, deleted: false })
    }
    const message = error instanceof Error ? error.message : String(error)
    return createResultError(op, `Failed to delete R2 object: ${message}`, message)
  }
}
